import assert from 'node:assert/strict';
import test from 'node:test';
import { describeArrayContext } from '../src/domain/array-decay.mjs';
import {
  inspectMoveExpression,
  ownershipState,
  transferUniqueOwner,
} from '../src/domain/move-ownership.mjs';
import { callWithList, defaultListState } from '../src/domain/mutable-default.mjs';

test('array contexts distinguish array bytes from adjusted parameter size', () => {
  assert.equal(describeArrayContext('array').result, 12);
  assert.equal(describeArrayContext('parameter').result, 8);
  assert.equal(describeArrayContext('element-step').result, 4);
  assert.equal(describeArrayContext('array-step').result, 12);
  assert.equal(describeArrayContext('array', 5).result, 20);
  assert.throws(() => describeArrayContext('missing'), RangeError);
  assert.throws(() => describeArrayContext('array', 0), RangeError);
});

test('std::move inspection does not transfer unique ownership', () => {
  const before = ownershipState();
  assert.equal(inspectMoveExpression(before).owner, 'p');
  const after = transferUniqueOwner(before);
  assert.deepEqual([after.p, after.q], [null, 7]);
  assert.deepEqual([transferUniqueOwner(after).p, transferUniqueOwner(after).q], [7, null]);
  assert.throws(() => transferUniqueOwner({ owner: 'none' }), TypeError);
});

test('omitted Python default persists while explicit list is independent', () => {
  const initial = defaultListState();
  const first = callWithList(initial, 1);
  const second = callWithList(first, 2);
  const explicit = callWithList(second, 3, true);
  const fourth = callWithList(explicit, 4);
  assert.deepEqual(initial.shared, []);
  assert.deepEqual(second.shared, [1, 2]);
  assert.deepEqual(explicit.shared, [1, 2]);
  assert.deepEqual(explicit.history.at(-1).result, [3]);
  assert.deepEqual(fourth.history.at(-1).result, [1, 2, 4]);
  assert.throws(() => callWithList(fourth, 1.5), TypeError);
});
