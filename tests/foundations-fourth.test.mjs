import test from 'node:test';
import assert from 'node:assert/strict';
import { compareStringObjects } from '../src/domain/identity.mjs';
import { scanCString } from '../src/domain/cstring.mjs';
import { createLifetimeState, stepLifetime } from '../src/domain/lifetime.mjs';

test('object identity is distinct from String content equality', () => {
  assert.deepEqual(
    [compareStringObjects('A', 'A').sameObject, compareStringObjects('A', 'A').sameContent],
    [true, true],
  );
  assert.deepEqual(
    [compareStringObjects('A', 'B').sameObject, compareStringObjects('A', 'B').sameContent],
    [false, true],
  );
  assert.deepEqual(
    [compareStringObjects('A', 'C').sameObject, compareStringObjects('A', 'C').sameContent],
    [false, false],
  );
  assert.throws(() => compareStringObjects('A', 'missing'), RangeError);
});

test('bounded C-string scan stops at first NUL and ignores tail bytes', () => {
  const result = scanCString([67, 97, 116, 0, 88]);
  assert.equal(result.length, 3);
  assert.equal(result.capacity, 5);
  assert.deepEqual(result.visited, [0, 1, 2, 3]);
  assert.equal(result.ignoredAfterTerminator, 1);
  assert.equal(scanCString([0, 88]).length, 0);
});

test('bounded scan reports missing terminator without reading past capacity', () => {
  const result = scanCString([67, 97, 116]);
  assert.equal(result.terminated, false);
  assert.equal(result.length, null);
  assert.deepEqual(result.visited, [0, 1, 2]);
  assert.throws(() => scanCString([]), RangeError);
  assert.throws(() => scanCString([256]), RangeError);
});

test('freeing through one handle invalidates all aliases', () => {
  let state = createLifetimeState();
  state = stepLifetime(state, 'allocate');
  state = stepLifetime(state, 'alias');
  state = stepLifetime(state, 'free-p');
  assert.equal(state.phase, 'freed');
  assert.equal(state.p, 'dangling');
  assert.equal(state.q, 'dangling');
  assert.equal(stepLifetime(state, 'read-q').lastOutcome, 'dangling');
  assert.throws(() => stepLifetime(state, 'free-q'), RangeError);
});

test('dropping the final live handle without free is a leak', () => {
  let state = stepLifetime(createLifetimeState(), 'allocate');
  state = stepLifetime(state, 'alias');
  state = stepLifetime(state, 'drop-p');
  assert.equal(state.leaked, false);
  state = stepLifetime(state, 'drop-q');
  assert.equal(state.leaked, true);
  assert.equal(state.phase, 'allocated');
  assert.throws(() => stepLifetime(state, 'free-p'), RangeError);
  assert.throws(() => stepLifetime(state, 'allocate'), RangeError);
});
