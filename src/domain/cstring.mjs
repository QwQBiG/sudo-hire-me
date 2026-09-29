export function scanCString(bytes) {
  if (
    !Array.isArray(bytes) ||
    bytes.length < 1 ||
    bytes.length > 16 ||
    bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  ) {
    throw new RangeError('bytes must contain 1 to 16 unsigned octets');
  }

  const terminatorIndex = bytes.indexOf(0);
  const terminated = terminatorIndex !== -1;
  const visitedCount = terminated ? terminatorIndex + 1 : bytes.length;
  return {
    capacity: bytes.length,
    terminated,
    terminatorIndex: terminated ? terminatorIndex : null,
    length: terminated ? terminatorIndex : null,
    visited: Array.from({ length: visitedCount }, (_, index) => index),
    ignoredAfterTerminator: terminated ? bytes.length - visitedCount : 0,
  };
}
