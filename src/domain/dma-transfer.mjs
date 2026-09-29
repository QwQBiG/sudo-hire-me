export function createDmaTransfer(size = 4) {
  if (!Number.isInteger(size) || size < 1 || size > 8) throw new RangeError('size must be 1..8');
  return { size, phase: 'idle', moved: 0, cpuWork: 0, events: [] };
}

export function configureDma(state) {
  if (!state || state.phase !== 'idle') throw new Error('configure only from idle');
  return {
    ...state,
    phase: 'transferring',
    events: [...state.events, 'CPU 配置缓冲区和设备，发起 DMA'],
  };
}

export function advanceDma(state) {
  if (!state || state.phase !== 'transferring')
    throw new Error('device can transfer only while active');
  const moved = state.moved + 1;
  return {
    ...state,
    moved,
    phase: moved === state.size ? 'completed' : 'transferring',
    events: [...state.events, `设备搬运第 ${moved} 块${moved === state.size ? '，传输完成' : ''}`],
  };
}

export function doCpuWork(state) {
  if (!state || state.phase !== 'transferring')
    throw new Error('CPU work demonstration requires active transfer');
  return {
    ...state,
    cpuWork: state.cpuWork + 1,
    events: [...state.events, `CPU 完成独立计算 ${state.cpuWork + 1}`],
  };
}

export function notifyDma(state) {
  if (!state || state.phase !== 'completed') throw new Error('notify only after completion');
  return { ...state, phase: 'notified', events: [...state.events, '设备发完成通知，驱动处理结果'] };
}
