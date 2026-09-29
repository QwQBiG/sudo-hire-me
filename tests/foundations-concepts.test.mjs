import test from 'node:test';
import assert from 'node:assert/strict';
import { bits8, computeBitwise8, toggleBit8 } from '../src/domain/bitwise.mjs';
import { layoutStruct } from '../src/domain/alignment.mjs';

test('eight-bit bitwise columns match the teaching example', () => {
  const left = 0xa6;
  const right = 0x0c;
  assert.deepEqual(bits8(left), [1, 0, 1, 0, 0, 1, 1, 0]);
  assert.equal(computeBitwise8(left, right, 'and').result, 0x04);
  assert.equal(computeBitwise8(left, right, 'or').result, 0xae);
  assert.equal(computeBitwise8(left, right, 'xor').result, 0xaa);
  assert.equal(toggleBit8(left, 3), 0xae);
  assert.equal(toggleBit8(toggleBit8(left, 3), 3), left);
});

test('logical shifts show truncation and reject invalid inputs', () => {
  const shifted = computeBitwise8(0xa6, 0x0c, 'left', 1);
  assert.equal(shifted.fullResult, 0x14c);
  assert.equal(shifted.result, 0x4c);
  assert.equal(shifted.droppedHighBits, 1);
  assert.equal(computeBitwise8(0xa6, 0, 'right', 1).result, 0x53);
  assert.throws(() => computeBitwise8(256, 0, 'and'), RangeError);
  assert.throws(() => computeBitwise8(1, 0, 'left', 8), RangeError);
  assert.throws(() => computeBitwise8(1, 0, 'pow'), RangeError);
  assert.throws(() => toggleBit8(1, -1), RangeError);
});

test('alignment model separates internal and tail padding', () => {
  const sample = layoutStruct([
    { name: 'tag', size: 1, alignment: 1 },
    { name: 'value', size: 4, alignment: 4 },
    { name: 'end', size: 1, alignment: 1 },
  ]);
  assert.deepEqual(
    sample.members.map(({ offset }) => offset),
    [0, 4, 8],
  );
  assert.equal(sample.internalPadding, 3);
  assert.equal(sample.tailPadding, 3);
  assert.equal(sample.size, 12);
  assert.equal(sample.slots.length, 12);
});

test('reordering fields and changing ABI assumption changes offsets', () => {
  const compact = layoutStruct([
    { name: 'value', size: 4, alignment: 4 },
    { name: 'tag', size: 1, alignment: 1 },
    { name: 'end', size: 1, alignment: 1 },
  ]);
  assert.deepEqual(
    compact.members.map(({ offset }) => offset),
    [0, 4, 5],
  );
  assert.equal(compact.size, 8);
  const twoAligned = layoutStruct([
    { name: 'tag', size: 1, alignment: 1 },
    { name: 'value', size: 4, alignment: 2 },
    { name: 'end', size: 1, alignment: 1 },
  ]);
  assert.deepEqual(
    twoAligned.members.map(({ offset }) => offset),
    [0, 2, 6],
  );
  assert.equal(twoAligned.size, 8);
});

test('alignment model rejects unsupported member descriptors', () => {
  assert.throws(() => layoutStruct([]), RangeError);
  assert.throws(() => layoutStruct([{ name: 'x', size: 4, alignment: 3 }]), RangeError);
  assert.throws(() => layoutStruct([{ name: 'x', size: 0, alignment: 1 }]), RangeError);
  assert.throws(
    () =>
      layoutStruct([
        { name: 'x', size: 1, alignment: 1 },
        { name: 'x', size: 1, alignment: 1 },
      ]),
    RangeError,
  );
});
