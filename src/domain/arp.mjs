import { calculateSubnet } from './subnet.mjs';

const sourceIp = '192.168.10.37';
const gatewayIp = '192.168.10.33';

export const arpDestinations = [
  { ip: '192.168.10.40', label: '主机 .40', mac: '02:00:00:00:00:40' },
  { ip: '192.168.10.50', label: '主机 .50', mac: '02:00:00:00:00:50' },
  { ip: '192.168.10.70', label: '主机 .70', mac: '02:00:00:00:00:70' },
];
const gatewayMac = '02:00:00:00:00:33';

export function createArpState(destination = '192.168.10.50', prefix = 27, cached = false) {
  if (![26, 27, 28].includes(prefix)) throw new Error('实验仅支持 /26、/27、/28');
  const target = arpDestinations.find(({ ip }) => ip === destination);
  if (!target) throw new Error('请选择实验中的目标主机');
  const direct =
    calculateSubnet(sourceIp, prefix).network === calculateSubnet(destination, prefix).network;
  const nextHop = direct ? destination : gatewayIp;
  const nextHopMac = direct ? target.mac : gatewayMac;
  return {
    destination,
    prefix,
    sourceIp,
    gatewayIp,
    direct,
    nextHop,
    nextHopMac,
    phase: 'idle',
    cache: /** @type {Record<string, string>} */ (cached ? { [nextHop]: nextHopMac } : {}),
    events: /** @type {string[]} */ ([]),
    message: '先判断目标是否在本机直连网段，再决定 ARP 查询谁。',
  };
}

export function advanceArp(state, action) {
  if (action === 'route' && state.phase === 'idle') {
    return {
      ...state,
      phase: 'route',
      events: [
        ...state.events,
        `${state.destination} ${state.direct ? '在直连网段' : '不在直连网段'}；下一跳 ${state.nextHop}`,
      ],
      message: state.direct
        ? '目标在直连网段：下一跳就是目标主机。'
        : '目标在其他网段：下一跳是默认网关，IP 目的地址仍是远端主机。',
    };
  }
  if (action === 'request' && state.phase === 'route' && !state.cache[state.nextHop]) {
    return {
      ...state,
      phase: 'request',
      events: [...state.events, `ARP 广播询问：谁拥有 ${state.nextHop}？`],
      message: `缓存未命中；广播 ARP 请求，查询下一跳 ${state.nextHop} 的链路层地址。`,
    };
  }
  if (action === 'reply' && state.phase === 'request') {
    return {
      ...state,
      phase: 'reply',
      cache: { ...state.cache, [state.nextHop]: state.nextHopMac },
      events: [...state.events, `收到应答：${state.nextHop} → ${state.nextHopMac}`],
      message: '把本实验收到的下一跳 IP 与 MAC 映射放入缓存。',
    };
  }
  if (
    action === 'send' &&
    (state.phase === 'route' || state.phase === 'reply') &&
    state.cache[state.nextHop]
  ) {
    return {
      ...state,
      phase: 'sent',
      events: [
        ...state.events,
        `发出以太帧：MAC 目的 ${state.nextHopMac}；IP 目的 ${state.destination}`,
      ],
      message: state.direct
        ? '本机把 IP 数据报封装进发往目标主机 MAC 的以太帧。'
        : '本机把 IP 数据报封装进发往网关 MAC 的以太帧；远端 IP 目的地址没有变。',
    };
  }
  if (!['route', 'request', 'reply', 'send'].includes(action)) {
    throw new Error('未知的 ARP 操作');
  }
  return { ...state, message: '当前阶段不能执行这一步；请按路线选择、ARP 查询、封装的顺序进行。' };
}
