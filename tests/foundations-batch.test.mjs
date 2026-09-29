import test from 'node:test';
import assert from 'node:assert/strict';
import { addFixedWidth, interpretTwosComplement } from '../src/domain/arithmetic.mjs';
import { resolveJavaDispatch } from '../src/domain/dispatch.mjs';
import { inspectWord32, packWord32, parseWord32, readWord32 } from '../src/domain/endian.mjs';

test('fixed-width addition separates carry from signed overflow', () => {
  const signedOnly = addFixedWidth(8, 127, 1);
  assert.equal(signedOnly.pattern, 128);
  assert.equal(signedOnly.signedExact, 128);
  assert.equal(signedOnly.signedResult, -128);
  assert.equal(signedOnly.signedOverflow, true);
  assert.equal(signedOnly.unsignedOverflow, false);
  assert.equal(signedOnly.carryOut, 0);

  const carryOnly = addFixedWidth(8, 255, 1);
  assert.equal(carryOnly.pattern, 0);
  assert.equal(carryOnly.signedExact, 0);
  assert.equal(carryOnly.signedOverflow, false);
  assert.equal(carryOnly.unsignedOverflow, true);
  assert.equal(carryOnly.carryOut, 1);
  assert.deepEqual(carryOnly.columns.at(-1), {
    bit: 0,
    leftBit: 1,
    rightBit: 1,
    carryIn: 0,
    resultBit: 0,
    carryOut: 1,
  });
});

test('four-bit boundaries and invalid operands are explicit', () => {
  const result = addFixedWidth(4, 15, 1);
  assert.equal(result.pattern, 0);
  assert.equal(result.signedLeft, -1);
  assert.equal(result.signedResult, 0);
  assert.equal(result.columns.length, 4);
  assert.equal(interpretTwosComplement(8, 4), -8);
  assert.throws(() => addFixedWidth(6, 1, 1), RangeError);
  assert.throws(() => addFixedWidth(4, 16, 0), RangeError);
  assert.throws(() => addFixedWidth(8, -1, 1), RangeError);
  assert.throws(() => addFixedWidth(8, 1.5, 1), RangeError);
});

test('every four-bit addition reconstructs its result and both overflow flags', () => {
  for (let left = 0; left < 16; left++) {
    for (let right = 0; right < 16; right++) {
      const sum = addFixedWidth(4, left, right);
      const rebuilt = sum.columns.reduce(
        (value, column) => value + column.resultBit * 2 ** column.bit,
        0,
      );
      assert.equal(rebuilt, sum.pattern);
      assert.equal(sum.carryOut, Number(sum.unsignedOverflow));
      const leftNegative = left >= 8;
      const rightNegative = right >= 8;
      const resultNegative = sum.pattern >= 8;
      assert.equal(
        sum.signedOverflow,
        leftNegative === rightNegative && resultNegative !== leftNegative,
      );
    }
  }
});

test('32-bit words pack to opposite address orders and round-trip explicitly', () => {
  const big = inspectWord32('0x12345678', 'big', 'big');
  assert.deepEqual(big.bytes, [0x12, 0x34, 0x56, 0x78]);
  assert.equal(big.decodedHex, '0x12345678');
  assert.equal(big.sameValue, true);
  const little = inspectWord32('0x12345678', 'little', 'little');
  assert.deepEqual(little.bytes, [0x78, 0x56, 0x34, 0x12]);
  assert.equal(little.decodedHex, '0x12345678');
  assert.equal(readWord32(big.bytes, 'little'), 0x78563412);
  assert.equal(inspectWord32('0x12345678', 'big', 'little').sameValue, false);
  assert.equal(inspectWord32('0x00000000', 'big', 'little').sameValue, true);
  assert.deepEqual(packWord32(0xffffffff, 'little'), [255, 255, 255, 255]);
});

test('word parsing rejects malformed and out-of-range data', () => {
  assert.equal(parseWord32('0Xf'), 15);
  assert.throws(() => parseWord32('0x100000000'), RangeError);
  assert.throws(() => parseWord32('0x12GG5678'), RangeError);
  assert.throws(() => parseWord32(''), RangeError);
  assert.throws(() => packWord32(-1, 'big'), RangeError);
  assert.throws(() => packWord32(1, 'native'), RangeError);
  assert.throws(() => readWord32([0, 1, 2], 'big'), RangeError);
  assert.throws(() => readWord32([0, 1, 2, 256], 'big'), RangeError);
});

test('overriding follows actual Java object type while overload choice follows declared type', () => {
  const baseReference = resolveJavaDispatch('Dog', 'Animal');
  const dogReference = resolveJavaDispatch('Dog', 'Dog');
  assert.equal(baseReference.overrideTarget, 'Dog.speak()');
  assert.equal(baseReference.overrideResult, '汪');
  assert.equal(baseReference.overloadTarget, 'feed(Animal)');
  assert.equal(dogReference.overrideTarget, 'Dog.speak()');
  assert.equal(dogReference.overloadTarget, 'feed(Dog)');
  assert.equal(resolveJavaDispatch('Cat', 'Animal').overrideResult, '喵');
  assert.equal(resolveJavaDispatch('Animal', 'Animal').overrideTarget, 'Animal.speak()');
});

test('dispatch demo rejects impossible declared and actual type combinations', () => {
  assert.throws(() => resolveJavaDispatch('Dog', 'Cat'), RangeError);
  assert.throws(() => resolveJavaDispatch('Unknown', 'Animal'), RangeError);
  assert.throws(() => resolveJavaDispatch('Dog', 'Unknown'), RangeError);
});
