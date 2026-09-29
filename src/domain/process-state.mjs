export const processPhases = [
  { id: 'new', label: '新建', reason: '执行实体正在建立' },
  { id: 'ready', label: '就绪', reason: '可运行，等待 CPU' },
  { id: 'running', label: '运行', reason: '当前占有 CPU' },
  { id: 'blocked', label: '阻塞', reason: '等待 I/O 完成' },
  { id: 'terminated', label: '终止', reason: '不再参与调度' },
];

export const processEvents = [
  { id: 'admit', label: '创建完成', from: 'new', to: 'ready' },
  { id: 'dispatch', label: '分配 CPU', from: 'ready', to: 'running' },
  { id: 'block', label: '等待 I/O', from: 'running', to: 'blocked' },
  { id: 'wake', label: 'I/O 完成', from: 'blocked', to: 'ready' },
  { id: 'preempt', label: '时间片结束', from: 'running', to: 'ready' },
  { id: 'exit', label: '执行完成', from: 'running', to: 'terminated' },
];

export function createProcessState() {
  return {
    phase: 'new',
    events: /** @type {string[]} */ ([]),
    message: '先让进程创建完成，进入就绪队列。',
  };
}

export function advanceProcessState(state, action) {
  const event = processEvents.find(({ id }) => id === action);
  if (!event) throw new Error('未知的进程事件');
  if (state.phase !== event.from) {
    const current = processPhases.find(({ id }) => id === state.phase).label;
    return {
      ...state,
      message: `当前是${current}，不能执行“${event.label}”；该事件要求先处于${processPhases.find(({ id }) => id === event.from).label}。`,
    };
  }
  const from = processPhases.find(({ id }) => id === event.from).label;
  const to = processPhases.find(({ id }) => id === event.to).label;
  const message = `${event.label}：${from} → ${to}。`;
  return { phase: event.to, events: [...state.events, message], message };
}
