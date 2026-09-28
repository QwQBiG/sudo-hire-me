import test from 'node:test';
import assert from 'node:assert/strict';
import { binarySearchSteps, decodeByte } from '../src/domain/search.mjs';

test('binary search traces the complete closed-interval example', () => {
  const values = [2, 5, 8, 12, 16, 23, 38];
  assert.deepEqual(binarySearchSteps(values, 16), [
    { left: 0, right: 6, mid: 3, comparison: 'right', value: 12 },
    { left: 4, right: 6, mid: 5, comparison: 'left', value: 23 },
    { left: 4, right: 4, mid: 4, comparison: 'found', value: 16 },
  ]);
  assert.deepEqual(values, [2, 5, 8, 12, 16, 23, 38]);
});

test('binary search finds both endpoints, singletons and duplicate values', () => {
  for (const [values, target] of [
    [[1], 1],
    [[1, 2], 1],
    [[1, 2], 2],
    [[2, 2, 2], 2],
    [[-8, -1, 0, 2.5], -8],
    [[-8, -1, 0, 2.5], 2.5],
    [Array.from({ length: 15 }, (_, index) => index), 14],
  ]) {
    const last = binarySearchSteps(values, target).at(-1);
    assert.equal(last.comparison, 'found');
    assert.equal(values[last.mid], target);
  }
});

test('missing values end with an empty interval', () => {
  for (const [values, target] of [
    [[1], 0],
    [[1], 2],
    [[1, 3], 2],
    [[1, 3], -1],
    [[1, 3], 5],
  ]) {
    const steps = binarySearchSteps(values, target);
    const last = steps.at(-1);
    assert.equal(last.comparison, 'missing');
    assert.equal(last.mid, -1);
    assert.equal(last.value, null);
    assert.ok(last.left > last.right);
    for (let index = 1; index < steps.length; index += 1) {
      assert.ok(
        steps[index].right - steps[index].left < steps[index - 1].right - steps[index - 1].left,
      );
    }
  }
});

test('binary search rejects unsorted, non-finite and oversized input', () => {
  for (const values of [
    null,
    '1,2',
    [],
    [2, 1],
    [1, 3, 2],
    [1, NaN],
    [1, Infinity],
    [1, '2'],
    Array(16).fill(1),
  ]) {
    assert.throws(() => binarySearchSteps(values, 1));
  }
  for (const target of [NaN, Infinity, -Infinity, '1', null]) {
    assert.throws(() => binarySearchSteps([1, 2], target));
  }
});

test('binary search rejects sparse arrays instead of tracing undefined values', () => {
  assert.throws(() => binarySearchSteps(Array(3), 1));
  assert.throws(() => binarySearchSteps([1, , 3], 2));
});

test('byte decoding covers unsigned and signed boundaries', () => {
  for (const [bits, unsigned, signed] of [
    ['00000000', 0, 0],
    ['00000001', 1, 1],
    ['01111111', 127, 127],
    ['10000000', 128, -128],
    ['11111011', 251, -5],
    ['11111111', 255, -1],
  ]) {
    assert.deepEqual(decodeByte(bits), { unsigned, signed });
  }
});

test('byte decoding rejects incomplete and malformed bit strings', () => {
  for (const bits of [
    '',
    '0000000',
    '000000000',
    '00000002',
    ' 00000000',
    '00000000\n',
    '0b11111011',
    null,
    undefined,
  ]) {
    assert.throws(() => decodeByte(bits));
  }
});

test('byte decoding requires a string rather than coercing a number', () => {
  assert.throws(() => decodeByte(11111011));
});
