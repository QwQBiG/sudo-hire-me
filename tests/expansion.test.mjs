import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cacheAccess,
  nextGreater,
  pointerPermission,
  creationMode,
  referenceState,
  threadTraits,
  accessDecision,
  vectorMutation,
} from '../src/domain/expansion.mjs';

test('LRU refreshes hits while FIFO does not', () => {
  for (const [policy, expected] of [
    ['lru', ['C', 'A', 'D']],
    ['fifo', ['B', 'C', 'D']],
  ]) {
    let keys = [];
    for (const key of ['A', 'B', 'C', 'A', 'D']) keys = cacheAccess(keys, key, 3, policy).keys;
    assert.deepEqual(keys, expected);
  }
  assert.throws(() => cacheAccess([], 'A', 0), RangeError);
  assert.throws(() => cacheAccess(['A', 'A'], 'B', 3), RangeError);
});
test('strict next-greater handles duplicates, empty and bad input', () => {
  assert.deepEqual(nextGreater([2, 1, 3, 2, 4]).answers, [3, 3, 4, 4, -1]);
  assert.deepEqual(nextGreater([2, 2]).answers, [-1, -1]);
  assert.deepEqual(nextGreater([]).answers, []);
  assert.throws(() => nextGreater([-1]), RangeError);
});
test('const binding and pointee are separate permissions', () => {
  assert.equal(pointerPermission('pointee', 'write'), false);
  assert.equal(pointerPermission('pointee', 'rebind'), true);
  assert.equal(pointerPermission('pointer', 'write'), true);
  assert.throws(() => pointerPermission('bad', 'write'), RangeError);
  assert.throws(() => pointerPermission('toString', 'write'), RangeError);
});
test('umask removes requested permissions instead of arithmetic subtraction', () => {
  assert.equal(creationMode(0o666, 0o022), 0o644);
  assert.equal(creationMode(0o666, 0o077), 0o600);
  assert.equal(creationMode(0o600, 0o077), 0o600);
  assert.throws(() => creationMode(0o1000, 0), RangeError);
});
test('weak handles cannot resurrect a destroyed value', () => {
  assert.deepEqual(referenceState(0, 1), {
    valueAlive: false,
    controlAlive: true,
    canUpgrade: false,
  });
  assert.equal(referenceState(1, 1).canUpgrade, true);
  assert.throws(() => referenceState(-1, 0), RangeError);
});
test('Rust trait matrix considers payload, not only Arc wrapper', () => {
  assert.deepEqual(threadTraits('ArcRefCell'), { send: false, sync: false });
  assert.deepEqual(threadTraits('Cell'), { send: true, sync: false });
  assert.throws(() => threadTraits('bad'), RangeError);
  assert.throws(() => threadTraits('constructor'), RangeError);
});
test('authorization requires both identity and resource policy', () => {
  assert.equal(accessDecision(false, 'admin', true), 401);
  assert.equal(accessDecision(true, 'editor', false), 403);
  assert.equal(accessDecision(true, 'editor', true), 200);
  assert.throws(() => accessDecision(true, 'root', true), RangeError);
  assert.throws(() => accessDecision('false', 'admin', true), RangeError);
});
test('vector old end invalidates even without reallocation', () => {
  assert.equal(vectorMutation(3, 4, 'push', 3).valid, false);
  assert.equal(vectorMutation(3, 4, 'push', 1).valid, true);
  assert.equal(vectorMutation(3, 3, 'push', 1).reallocated, true);
  assert.throws(() => vectorMutation(4, 3, 'push', 0), RangeError);
  assert.throws(() => vectorMutation(1, 3, 'erase', 0), RangeError);
});
