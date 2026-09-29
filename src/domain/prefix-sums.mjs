export const prefixValues = [2, -1, 3, 4, -2];

export function buildPrefix(values) {
  if (!Array.isArray(values) || values.some((value) => !Number.isSafeInteger(value))) {
    throw new Error('Expected an array of safe integers');
  }
  const prefix = [0];
  for (const value of values) {
    const next = prefix.at(-1) + value;
    if (!Number.isSafeInteger(next)) throw new Error('Prefix sum exceeds safe integer range');
    prefix.push(next);
  }
  return prefix;
}

export function rangeSum(prefix, left, right) {
  if (
    !Array.isArray(prefix) ||
    prefix.length === 0 ||
    !Number.isInteger(left) ||
    !Number.isInteger(right) ||
    left < 0 ||
    left > right ||
    right >= prefix.length
  ) {
    throw new Error('Expected valid half-open range [left, right)');
  }
  return prefix[right] - prefix[left];
}
