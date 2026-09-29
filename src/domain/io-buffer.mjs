export function createIoBufferState() {
  return {
    source: /** @type {null | 'stdio' | 'write'} */ (null),
    user: '',
    kernel: '',
    dirty: false,
    disk: '',
    crashed: false,
    message: '先用 fprintf 或 write(2) 写入 ABC，再观察三层状态。',
    events: /** @type {string[]} */ ([]),
  };
}

function record(state, message) {
  return { ...state, message, events: [...state.events, message] };
}

export function advanceIoBuffer(state, action) {
  if (!['fprintf', 'write', 'fflush', 'fsync', 'crash'].includes(action)) {
    throw new Error('未知的文件 I/O 操作');
  }
  if (state.crashed) return { ...state, message: '系统已模拟重启；请重置实验。' };

  if (action === 'fprintf' || action === 'write') {
    if (state.source) return { ...state, message: '本模型只写一次 ABC；请重置后切换另一条路径。' };
    if (action === 'fprintf') {
      return record(
        { ...state, source: 'stdio', user: 'ABC' },
        'fprintf 成功：ABC 暂在用户态 stdio 缓冲区。',
      );
    }
    return record(
      { ...state, source: 'write', kernel: 'ABC', dirty: true },
      'write(2) 成功：绕过 stdio 缓冲，ABC 进入内核待回写状态。',
    );
  }

  if (action === 'fflush') {
    if (!state.user) return { ...state, message: '用户态 stdio 缓冲区没有待提交的字节。' };
    return record(
      { ...state, user: '', kernel: 'ABC', dirty: true },
      'fflush 成功：ABC 已交给内核，但还不能保证崩溃后存在。',
    );
  }

  if (action === 'fsync') {
    if (!state.dirty) {
      return record(
        state,
        state.user
          ? 'fsync 无法看到仍在 stdio 缓冲区中的 ABC；持久层不变。'
          : '内核没有待同步的文件修改；持久层不变。',
      );
    }
    return record(
      { ...state, disk: state.kernel, dirty: false },
      'fsync 成功：本模型把已提交内核的 ABC 记为持久；用户态缓冲不由它处理。',
    );
  }

  return record(
    { ...state, user: '', kernel: '', dirty: false, crashed: true },
    `模拟系统崩溃重启：仅保留已确认持久的 ${state.disk || '空内容'}。`,
  );
}
