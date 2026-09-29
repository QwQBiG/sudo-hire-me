const firstSequence = 1000;
const segmentSize = 2;
export const segmentData = ['AB', 'CD', 'EF', 'GH'];

export function createWindowState(windowBytes = 4, dropFirst = true) {
  if (![2, 4].includes(windowBytes)) throw new Error('Window must be 2 or 4 bytes');
  return {
    windowBytes,
    dropFirst,
    next: 0,
    acked: 0,
    received: /** @type {number[]} */ ([]),
    queue: /** @type {number[]} */ ([]),
    attempts: [0, 0, 0, 0],
    events: [],
    message: '先发送片段，观察序号、确认号和窗口右边界。',
  };
}

export const windowSequence = (index) => firstSequence + index * segmentSize;

export function canSend(state) {
  return (
    state.next < segmentData.length &&
    windowSequence(state.next + 1) <= windowSequence(state.acked) + state.windowBytes
  );
}

export function canDeliver(state) {
  return state.queue.length > 0;
}

export function canRetransmit(state) {
  return (
    state.acked < state.next &&
    !state.received.includes(state.acked) &&
    !state.queue.includes(state.acked)
  );
}

export function advanceWindow(state, action) {
  if (action === 'send') {
    if (!canSend(state))
      return { ...state, message: '窗口没有空间发送新的片段；先处理确认或重传。' };
    const index = state.next;
    const dropped = state.dropFirst && index === 0 && state.attempts[0] === 0;
    const attempts = [...state.attempts];
    attempts[index]++;
    const event = `${windowSequence(index)}–${windowSequence(index + 1) - 1} ${segmentData[index]}${dropped ? ' · 本次丢失' : ' · 在途'}`;
    return {
      ...state,
      next: index + 1,
      attempts,
      queue: dropped ? state.queue : [...state.queue, index],
      events: [...state.events, event],
      message: dropped
        ? `${segmentData[index]} 未到达接收方，仍占用未确认的发送窗口。`
        : `${segmentData[index]} 已发送，等待接收方处理。`,
    };
  }
  if (action === 'deliver') {
    if (!canDeliver(state)) return { ...state, message: '当前没有在途片段。' };
    const [index, ...queue] = state.queue;
    const received = [...state.received, index];
    let acked = state.acked;
    while (received.includes(acked)) acked++;
    const acknowledgment = windowSequence(acked);
    return {
      ...state,
      queue,
      received,
      acked,
      events: [...state.events, `收到 ${segmentData[index]} · 回 ACK ${acknowledgment}`],
      message:
        acked === state.acked
          ? `先收到 ${segmentData[index]}，但缺少更早字节；累计确认仍为 ${acknowledgment}。`
          : `连续字节已齐，累计确认推进到 ${acknowledgment}。`,
    };
  }
  if (action === 'retransmit') {
    if (!canRetransmit(state)) return { ...state, message: '当前没有可重传的最早缺失片段。' };
    const index = state.acked;
    const attempts = [...state.attempts];
    attempts[index]++;
    return {
      ...state,
      attempts,
      queue: [...state.queue, index],
      events: [
        ...state.events,
        `重传 ${windowSequence(index)}–${windowSequence(index + 1) - 1} ${segmentData[index]} · 在途`,
      ],
      message: `手动模拟超时后重传 ${segmentData[index]}；重传旧序号不扩大已发的新数据范围。`,
    };
  }
  throw new Error('Unknown window action');
}
