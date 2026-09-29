export const lowerBoundDatasets = {
  duplicates: [1, 3, 3, 3, 7, 9],
  unique: [2, 5, 8, 12, 16],
  empty: [],
};

export function lowerBoundFrames(values, target) {
  if (!Array.isArray(values) || !Number.isFinite(target)) {
    throw new Error('Expected a nondecreasing finite-number array and finite target');
  }
  for (let index = 0; index < values.length; index++) {
    if (!Number.isFinite(values[index]) || (index > 0 && values[index] < values[index - 1])) {
      throw new Error('Expected a nondecreasing finite-number array and finite target');
    }
  }
  let left = 0;
  let right = values.length;
  const frames = [
    {
      left,
      right,
      mid: null,
      inspected: null,
      done: left === right,
      note: values.length
        ? `尚未判断的元素在半开区间 [0, ${right})；位置 ${right} 也可能是最终答案。`
        : '空数组没有待比较元素；第一个不小于目标的位置就是 0。',
    },
  ];
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    const inspected = values[mid];
    let note;
    if (inspected < target) {
      left = mid + 1;
      note = `a[${mid}] = ${inspected} < ${target}：下标 0..${mid} 都太小，left 移到 ${left}。`;
    } else {
      right = mid;
      note = `a[${mid}] = ${inspected} >= ${target}：第一个合格位置可能就是 ${mid}，right 移到 ${right}。`;
    }
    frames.push({ left, right, mid, inspected, done: left === right, note });
  }
  return {
    frames,
    index: left,
    found: left < values.length && values[left] === target,
  };
}
