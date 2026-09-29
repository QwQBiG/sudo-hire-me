const byteOrders = new Set(['big', 'little']);

function requireOrder(order) {
  if (!byteOrders.has(order)) throw new RangeError('Byte order must be big or little');
}

export function parseWord32(text) {
  if (typeof text !== 'string' || !/^(?:0[xX])?[0-9a-fA-F]{1,8}$/.test(text.trim())) {
    throw new RangeError('Enter 1 to 8 hexadecimal digits, optionally prefixed with 0x');
  }
  return Number.parseInt(text.trim().replace(/^0[xX]/, ''), 16);
}

export function formatWord32(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Word must be an unsigned 32-bit integer');
  }
  return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function packWord32(value, order) {
  formatWord32(value);
  requireOrder(order);
  const bigEndianBytes = [24, 16, 8, 0].map((shift) => Math.floor(value / 2 ** shift) % 256);
  return order === 'big' ? bigEndianBytes : bigEndianBytes.reverse();
}

export function readWord32(bytes, order) {
  requireOrder(order);
  if (
    !Array.isArray(bytes) ||
    bytes.length !== 4 ||
    bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  ) {
    throw new RangeError('Exactly four byte values from 0 to 255 are required');
  }
  const highToLow = order === 'big' ? bytes : [...bytes].reverse();
  return highToLow.reduce((value, byte) => value * 256 + byte, 0);
}

export function inspectWord32(text, writeOrder, readOrder) {
  const value = parseWord32(text);
  const bytes = packWord32(value, writeOrder);
  const decoded = readWord32(bytes, readOrder);
  return {
    value,
    originalHex: formatWord32(value),
    bytes,
    decoded,
    decodedHex: formatWord32(decoded),
    sameValue: decoded === value,
  };
}
