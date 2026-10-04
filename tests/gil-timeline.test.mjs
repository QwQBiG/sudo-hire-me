import test from 'node:test';
import assert from 'node:assert/strict';
import { gilTimeline } from '../src/domain/gil-timeline.mjs';

test('CPU work only advances for the thread with modeled GIL ownership', () => {
  assert.deepEqual(
    gilTimeline('gil', 1).map((lane) => lane.cpu),
    [1, 0],
  );
  assert.deepEqual(
    gilTimeline('gil', 8).map((lane) => lane.cpu),
    [4, 4],
  );
  for (let tick = 1; tick <= 8; tick++) {
    assert.equal(gilTimeline('gil', tick).filter((lane) => lane.current === 'cpu').length, 1);
  }
});
test('I/O waiting never pretends to have executed CPU work', () => {
  const lanes = gilTimeline('io', 8);
  assert.equal(lanes[0].cpu, 0);
  assert.ok(lanes[0].cells.every((cell) => cell === 'io'));
  assert.equal(lanes[1].cpu, 8);
});
test('free-threaded scenario permits two execution lanes without claiming measured speed', () => {
  assert.deepEqual(
    gilTimeline('free', 8).map((lane) => lane.cpu),
    [8, 8],
  );
  for (const mode of ['gil', 'io', 'free']) {
    assert.ok(
      gilTimeline(mode, 0).every(
        (lane) =>
          lane.current === 'ready' &&
          lane.cpu === 0 &&
          lane.cells.every((cell) => cell === 'pending'),
      ),
    );
  }
});
test('timeline rejects unsupported modes and out-of-range observations', () => {
  for (const tick of [-1, 9, 0.5, NaN]) assert.throws(() => gilTimeline('gil', tick), RangeError);
  assert.throws(() => gilTimeline('constructor', 0), RangeError);
});
