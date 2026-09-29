export function createReadinessState(mode = 'lt') {
  if (!['lt', 'et'].includes(mode)) throw new Error('mode must be lt or et');
  return {
    mode,
    buffers: { 3: '', 4: '' },
    pending: /** @type {number[]} */ ([]),
    lastReady: /** @type {number[]} */ ([]),
    message: '先向 fd 3 或 fd 4 送入数据。',
  };
}

export function sendReadinessData(state, fd, data) {
  if (![3, 4].includes(fd) || !data) throw new Error('invalid fd or data');
  const buffers = { ...state.buffers, [fd]: state.buffers[fd] + data };
  // New input can create an ET notification even when unread data already exists.
  const pending = state.pending.includes(fd) ? state.pending : [...state.pending, fd];
  return {
    ...state,
    buffers,
    pending,
    message: `fd ${fd} 收到 ${data.length} 字节；现在可尝试等待事件。`,
  };
}

export function waitReadiness(state) {
  const ready =
    state.mode === 'lt' ? [3, 4].filter((fd) => state.buffers[fd].length > 0) : [...state.pending];
  return {
    ...state,
    pending: state.mode === 'et' ? [] : state.pending,
    lastReady: ready,
    message: ready.length ? `本轮报告 fd ${ready.join('、fd ')} 可读。` : '本轮没有新的可读通知。',
  };
}

export function readReadiness(state, fd, count) {
  if (![3, 4].includes(fd) || !Number.isInteger(count) || count <= 0) {
    throw new Error('invalid read request');
  }
  const taken = state.buffers[fd].slice(0, count);
  const buffers = { ...state.buffers, [fd]: state.buffers[fd].slice(count) };
  return {
    ...state,
    buffers,
    pending: buffers[fd].length ? state.pending : state.pending.filter((readyFd) => readyFd !== fd),
    message: taken
      ? `fd ${fd} 读出 ${JSON.stringify(taken)}；剩余 ${buffers[fd].length} 字节。`
      : `fd ${fd} 当前无数据；非阻塞读取会返回 EAGAIN。`,
  };
}
