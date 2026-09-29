const operations = new Set(['and', 'or', 'xor', 'left', 'right']);

function assertByte(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${label} must be an 8-bit unsigned integer`);
  }
}

export function bits8(value) {
  assertByte(value, 'value');
  return Array.from({ length: 8 }, (_, index) => (value >> (7 - index)) & 1);
}

export function toggleBit8(value, bitIndex) {
  assertByte(value, 'value');
  if (!Number.isInteger(bitIndex) || bitIndex < 0 || bitIndex > 7) {
    throw new RangeError('bitIndex must be from 0 to 7');
  }
  return value ^ (1 << bitIndex);
}

export function computeBitwise8(left, right, operation, shift = 1) {
  assertByte(left, 'left');
  assertByte(right, 'right');
  if (!operations.has(operation)) throw new RangeError('Unknown bitwise operation');
  if (!Number.isInteger(shift) || shift < 0 || shift > 7) {
    throw new RangeError('shift must be from 0 to 7');
  }

  let fullResult;
  switch (operation) {
    case 'and':
      fullResult = left & right;
      break;
    case 'or':
      fullResult = left | right;
      break;
    case 'xor':
      fullResult = left ^ right;
      break;
    case 'left':
      fullResult = left << shift;
      break;
    case 'right':
      fullResult = left >>> shift;
      break;
  }

  const result = fullResult & 0xff;
  return {
    left,
    right,
    operation,
    shift,
    fullResult,
    result,
    droppedHighBits: operation === 'left' ? fullResult >>> 8 : 0,
    leftBits: bits8(left),
    rightBits: bits8(right),
    resultBits: bits8(result),
  };
}
