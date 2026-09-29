export const queueItems = ['A', 'B', 'C', 'D'];
export const queueCapacity = 2;

export function createBoundedQueueState() {
  return {
    queue: /** @type {string[]} */ ([]),
    consumed: /** @type {string[]} */ ([]),
    nextIndex: 0,
    pending: /** @type {string | null} */ (null),
    message: '队列为空，容量 2；先生产 A。',
  };
}

export function produceBounded(state) {
  if (state.pending) return { ...state, message: `${state.pending} 正等待空位，先处理它。` };
  const item = queueItems[state.nextIndex];
  if (!item) return { ...state, message: '示例任务已全部提交。' };
  if (state.queue.length === queueCapacity) {
    return { ...state, pending: item, message: `队列已满，${item} 尚未入队，生产者等待。` };
  }
  return {
    ...state,
    queue: [...state.queue, item],
    nextIndex: state.nextIndex + 1,
    message: `${item} 已入队。`,
  };
}

export function consumeBounded(state) {
  if (!state.queue.length) return { ...state, message: '队列为空，消费者需要等待新元素。' };
  const [item, ...queue] = state.queue;
  return {
    ...state,
    queue,
    consumed: [...state.consumed, item],
    message: `消费者取出 ${item}，空出一个位置；等待的生产者可重试。`,
  };
}

export function retryBounded(state) {
  if (!state.pending) return { ...state, message: '目前没有等待中的生产者。' };
  if (state.queue.length === queueCapacity)
    return { ...state, message: '队列仍满，生产者继续等待。' };
  return {
    ...state,
    queue: [...state.queue, state.pending],
    nextIndex: state.nextIndex + 1,
    pending: null,
    message: `${state.pending} 获得空位并入队。`,
  };
}
