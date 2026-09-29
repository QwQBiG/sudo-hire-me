const supportedWidths = new Set([4, 8]);

export function interpretTwosComplement(pattern, width) {
  if (!supportedWidths.has(width)) throw new RangeError('Bit width must be 4 or 8');
  const limit = 2 ** width;
  if (!Number.isInteger(pattern) || pattern < 0 || pattern >= limit) {
    throw new RangeError(`Bit pattern must be an integer from 0 to ${limit - 1}`);
  }
  return pattern >= limit / 2 ? pattern - limit : pattern;
}

export function addFixedWidth(width, left, right) {
  if (!supportedWidths.has(width)) throw new RangeError('Bit width must be 4 or 8');
  const limit = 2 ** width;
  for (const operand of [left, right]) {
    if (!Number.isInteger(operand) || operand < 0 || operand >= limit) {
      throw new RangeError(`Operands must be integer bit patterns from 0 to ${limit - 1}`);
    }
  }

  let carry = 0;
  const columns = [];
  for (let bit = 0; bit < width; bit++) {
    const leftBit = Math.floor(left / 2 ** bit) % 2;
    const rightBit = Math.floor(right / 2 ** bit) % 2;
    const carryIn = carry;
    const total = leftBit + rightBit + carryIn;
    carry = Math.floor(total / 2);
    columns.unshift({ bit, leftBit, rightBit, carryIn, resultBit: total % 2, carryOut: carry });
  }

  const unsignedExact = left + right;
  const pattern = unsignedExact % limit;
  const signedLeft = interpretTwosComplement(left, width);
  const signedRight = interpretTwosComplement(right, width);
  const signedExact = signedLeft + signedRight;
  const signedResult = interpretTwosComplement(pattern, width);
  const unsignedOverflow = unsignedExact >= limit;
  const signedOverflow = signedExact < -limit / 2 || signedExact > limit / 2 - 1;

  return {
    width,
    left,
    right,
    columns,
    pattern,
    unsignedExact,
    unsignedOverflow,
    carryOut: carry,
    signedLeft,
    signedRight,
    signedExact,
    signedResult,
    signedOverflow,
  };
}
