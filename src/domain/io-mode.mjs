export const ioModes = ['blocking', 'nonblocking', 'readiness', 'async'];

export function createIoModeState(mode = 'blocking') {
  if (!ioModes.includes(mode)) throw new Error('未知的 I/O 模式');
  return {
    mode,
    buffer: '',
    writerOpen: true,
    phase: 'idle',
    outcome: '',
    message: '管道为空且写端仍打开。先启动读操作，再让写者行动。',
    events: [],
  };
}

function finish(state, outcome, message) {
  return { ...state, phase: 'completed', outcome, message, events: [...state.events, message] };
}

function takeAvailable(state) {
  if (state.buffer) {
    const bytes = state.buffer.length;
    return finish({ ...state, buffer: '' }, `read → ${bytes} 字节`, `读到 ${bytes} 字节：OK。`);
  }
  if (!state.writerOpen)
    return finish(state, 'read → 0（EOF）', '写端全关且缓冲区已空：读返回 0。');
  return finish(state, 'read → -1 / EAGAIN', '当前没有字节但仍有写者：非阻塞读返回 EAGAIN。');
}

export function advanceIoMode(state, action) {
  if (!['read', 'write', 'close', 'compete'].includes(action)) throw new Error('未知的 I/O 操作');

  if (action === 'read') {
    if (state.mode === 'nonblocking') return takeAvailable(state);
    if (state.phase === 'completed')
      return { ...state, message: '本次操作已完成；重置后可以重新演示。' };
    if (state.mode === 'readiness') {
      if (state.phase === 'ready') return takeAvailable(state);
      const ready = Boolean(state.buffer) || !state.writerOpen;
      const message = ready
        ? '就绪通知：现在可以尝试 read，但数据尚未读入应用。'
        : '开始等待可读事件；还没有执行 read。';
      return {
        ...state,
        phase: ready ? 'ready' : 'waiting',
        message,
        events: [...state.events, message],
      };
    }
    if (state.phase !== 'idle')
      return { ...state, message: '已有一个读取请求在等待；先让写者行动。' };
    if (state.mode === 'async' && state.buffer) {
      return finish(
        { ...state, buffer: '' },
        '异步完成 → 2 字节',
        '请求提交后即可完成：读到 2 字节 OK。',
      );
    }
    if (state.mode === 'async' && !state.writerOpen) {
      return finish(state, '异步完成 → EOF', '请求提交后即可完成：写端已关且没有数据。');
    }
    if (state.buffer || !state.writerOpen) return takeAvailable(state);
    const phase = state.mode === 'async' ? 'pending' : 'blocked';
    const message =
      state.mode === 'async'
        ? '异步请求已提交，调用方继续运行；完成结果稍后到达。'
        : '阻塞 read 尚未返回；调用方在本次读取中等待。';
    return { ...state, phase, message, events: [...state.events, message] };
  }

  if (action === 'write') {
    if (state.phase === 'completed' && state.mode !== 'nonblocking') {
      return { ...state, message: '本次操作已完成；重置后可以重新演示。' };
    }
    if (!state.writerOpen) return { ...state, message: '写端已经关闭，不能再写入。' };
    if (state.buffer) return { ...state, message: '本实验的单条消息缓冲区已有 OK；先读取它。' };
    const withData = {
      ...state,
      buffer: 'OK',
      outcome: '',
      events: [...state.events, '写者写入 OK（2 字节）。'],
    };
    if (state.phase === 'blocked') return takeAvailable(withData);
    if (state.phase === 'pending')
      return finish(
        { ...withData, buffer: '' },
        '异步完成 → 2 字节',
        '异步读取完成：返回 2 字节 OK。',
      );
    if (state.phase === 'waiting') {
      const message = '出现可读事件；操作仍未完成，读者还须调用 read。';
      return { ...withData, phase: 'ready', message, events: [...withData.events, message] };
    }
    return { ...withData, message: '数据已在管道中；调用或重试 read 才能取走。' };
  }

  if (action === 'close') {
    if (state.phase === 'completed' && state.mode !== 'nonblocking') {
      return { ...state, message: '本次操作已完成；重置后可以重新演示。' };
    }
    if (!state.writerOpen) return { ...state, message: '写端已关闭。' };
    const closed = {
      ...state,
      writerOpen: false,
      outcome: '',
      events: [...state.events, '最后一个写端关闭。'],
    };
    if (state.buffer)
      return { ...closed, message: '缓冲区仍有数据；先读完数据，下一次空读才得到 EOF。' };
    if (state.phase === 'blocked')
      return finish(closed, 'read → 0（EOF）', '阻塞读结束：写端全关、无数据，返回 0。');
    if (state.phase === 'pending')
      return finish(closed, '异步完成 → EOF', '异步请求完成：已无写者和数据，得到 EOF。');
    if (state.phase === 'waiting') {
      const message = 'EOF 也会使读端就绪；还须 read 才得到 0。';
      return { ...closed, phase: 'ready', message, events: [...closed.events, message] };
    }
    return { ...closed, message: '写端已关；缓冲区空时，下一次 read 返回 0。' };
  }

  if (state.mode === 'readiness' && state.phase === 'ready' && state.buffer && state.writerOpen) {
    const message = '另一读者先取走 OK；本读者虽收到就绪事件，再 read 仍可能得到 EAGAIN。';
    return { ...state, buffer: '', message, events: [...state.events, message] };
  }
  return { ...state, message: '当前没有可被另一读者抢走的字节。' };
}
