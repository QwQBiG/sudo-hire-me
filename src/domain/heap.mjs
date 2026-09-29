export const heapDatasets = {
  first: [2, 4, 3, 8, 6, 5, 7],
  second: [1, 3, 2, 9, 7, 6, 4],
};

export function removeMinFrames(dataset = 'first') {
  const input = heapDatasets[dataset];
  if (!input) throw new Error('Unknown heap dataset');
  const values = [...input];
  const removed = values[0];
  const frames = [
    { values: [...values], active: 0, note: `根节点 ${removed} 是当前最小值。`, comparisons: 0 },
  ];
  values[0] = values.pop();
  frames.push({
    values: [...values],
    active: 0,
    note: '取走根节点，把最后一个元素暂放在根。',
    comparisons: 0,
  });
  let parent = 0;
  let comparisons = 0;
  while (2 * parent + 1 < values.length) {
    const left = 2 * parent + 1;
    const right = left + 1;
    let child = left;
    if (right < values.length) {
      comparisons++;
      if (values[right] < values[left]) child = right;
    }
    comparisons++;
    if (values[parent] <= values[child]) {
      frames.push({
        values: [...values],
        active: parent,
        note: '父节点不大于较小的子节点，堆序已恢复。',
        comparisons,
      });
      break;
    }
    const oldParent = parent;
    [values[parent], values[child]] = [values[child], values[parent]];
    parent = child;
    frames.push({
      values: [...values],
      active: parent,
      note: `比较子节点后，交换下标 ${oldParent} 与 ${child}。`,
      comparisons,
    });
  }
  if (frames.at(-1).note !== '父节点不大于较小的子节点，堆序已恢复。') {
    frames.push({
      values: [...values],
      active: parent,
      note: '已到叶节点，堆序恢复。',
      comparisons,
    });
  }
  return { removed, frames };
}
