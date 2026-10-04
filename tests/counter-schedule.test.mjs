import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCounter,
  advanceCounter,
  counterEnabled,
  counterOutcomes,
} from '../src/domain/counter-schedule.mjs';
import { initialRace, advanceRace } from '../src/domain/systems.mjs';

const run = (strategy, order) => order.reduce(advanceCounter, createCounter(strategy));

test('chosen schedules expose both lost updates and a successful volatile execution', () => {
  assert.equal(run('volatile', [0, 1, 0, 1, 0, 1]).count, 1);
  assert.equal(run('volatile', [0, 0, 0, 1, 1, 1]).count, 2);
  assert.equal(run('volatile', [1, 1, 0, 0, 1, 0]).count, 1);
});
test('same monitor blocks the other thread until the whole increment ends', () => {
  const acquired = advanceCounter(createCounter('locked'), 1);
  assert.equal(acquired.owner, 1);
  assert.equal(counterEnabled(acquired, 0), false);
  assert.equal(advanceCounter(acquired, 0), acquired);
  const released = advanceCounter(advanceCounter(acquired, 1), 1);
  assert.equal(released.owner, null);
  assert.equal(run('locked', [1, 1, 1, 0, 0, 0]).count, 2);
});
test('atomic increment has one indivisible modeled operation per thread', () => {
  const final = run('atomic', [1, 0]);
  assert.equal(final.count, 2);
  assert.equal(final.events.length, 2);
  assert.equal(advanceCounter(final, 1), final);
});
test('exhaustive schedules retain program order and give correct final outcomes', () => {
  const volatile = counterOutcomes('volatile');
  assert.deepEqual(volatile, [
    { value: 1, schedules: 18 },
    { value: 2, schedules: 2 },
  ]);
  assert.equal(
    volatile.reduce((sum, r) => sum + r.schedules, 0),
    20,
  );
  assert.deepEqual(counterOutcomes('locked'), [{ value: 2, schedules: 2 }]);
  assert.deepEqual(counterOutcomes('atomic'), [{ value: 2, schedules: 2 }]);
});

test('Java counter adapter retains the shared read/compute/write mechanism at every prefix', () => {
  for (const strategy of ['volatile', 'locked']) {
    const compare = (counter, race) => {
      assert.equal(counter.count, race.shared);
      assert.deepEqual(
        counter.threads.map((t) => t.phase),
        race.phases,
      );
      assert.equal(counter.owner ?? -1, race.owner);
      for (let id = 0; id < 2; id++) {
        if (!counterEnabled(counter, id)) continue;
        compare(advanceCounter(counter, id), advanceRace(race, id, strategy === 'locked'));
      }
    };
    compare(createCounter(strategy), initialRace());
  }
});
test('steps preserve prior snapshots, reject invalid input and stop completed threads', () => {
  const initial = createCounter();
  const before = structuredClone(initial);
  advanceCounter(initial, 0);
  assert.deepEqual(initial, before);
  const finishedA = run('volatile', [0, 0, 0]);
  assert.equal(counterEnabled(finishedA, 0), false);
  assert.equal(advanceCounter(finishedA, 0), finishedA);
  for (const id of [-1, 2, 0.5, NaN]) assert.throws(() => advanceCounter(initial, id), RangeError);
  assert.throws(() => createCounter('constructor'), RangeError);
});
