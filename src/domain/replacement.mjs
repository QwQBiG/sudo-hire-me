export const referenceTrace = [1, 2, 3, 1, 4, 1, 2];

export function replacementFrames(method, capacity = 3, trace = referenceTrace) {
  if (!['FIFO', 'LRU'].includes(method)) throw new Error('Unknown replacement method');
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid frame count');
  const frames = [
    {
      slots: Array(capacity).fill(null),
      fault: false,
      victim: null,
      page: null,
      faults: 0,
      note: '等待首次访问。',
    },
  ];
  const slots = Array(capacity).fill(null);
  const order = [];
  let faults = 0;
  for (const page of trace) {
    let victim = null;
    let fault = false;
    if (slots.includes(page)) {
      if (method === 'LRU') {
        order.splice(order.indexOf(page), 1);
        order.push(page);
      }
    } else {
      fault = true;
      faults++;
      const empty = slots.indexOf(null);
      const slot = empty >= 0 ? empty : slots.indexOf(order.shift());
      victim = slots[slot];
      slots[slot] = page;
      order.push(page);
    }
    frames.push({
      slots: [...slots],
      fault,
      victim,
      page,
      faults,
      note: fault
        ? victim === null
          ? `缺页：把 ${page} 放入空页框。`
          : `缺页：淘汰 ${victim}，装入 ${page}。`
        : `命中：${page} 已在内存，${method === 'LRU' ? '更新最近使用顺序' : '不改变进入顺序'}。`,
    });
  }
  return frames;
}
