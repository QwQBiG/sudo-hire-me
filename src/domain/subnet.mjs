export function calculateSubnet(address, prefix) {
  if (!Number.isInteger(prefix) || prefix < 24 || prefix > 30)
    throw new Error('实验仅支持 /24 到 /30');
  const parts = address.split('.');
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)
  ) {
    throw new Error('请输入四段 0 到 255 的十进制 IPv4 地址');
  }
  const ip = parts.reduce((value, part) => (value * 256 + Number(part)) >>> 0, 0);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const format = (value) => [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
  return {
    ip: format(ip),
    prefix,
    mask: format(mask),
    network: format(network),
    broadcast: format(broadcast),
    firstHost: format(network + 1),
    lastHost: format(broadcast - 1),
    usableHosts: 2 ** (32 - prefix) - 2,
    ipBits: (ip & 255).toString(2).padStart(8, '0'),
    maskBits: (mask & 255).toString(2).padStart(8, '0'),
    networkBits: (network & 255).toString(2).padStart(8, '0'),
  };
}
