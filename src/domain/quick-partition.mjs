export const partitionPresets = {
  mixed: [8, 3, 6, 2, 5],
  duplicates: [4, 2, 4, 1, 4],
  sorted: [1, 2, 3, 4, 5],
};

export function createPartitionState(preset = 'mixed') {
  if (!Object.hasOwn(partitionPresets, preset)) throw new Error('Unknown partition preset');
  const values = [...partitionPresets[preset]];
  return {
    preset,
    values,
    pivot: values.at(-1),
    i: 0,
    j: 0,
    phase: 'scan',
    pivotIndex: null,
    history: [],
    feedback: '',
    note: '末元素为 pivot；[0,i) 都小于它，[i,j) 都不小于它。',
  };
}

export function choosePartition(state, choice) {
  if (choice !== 'small' && choice !== 'large') throw new Error('Unknown partition choice');
  if (state.phase !== 'scan') throw new Error('No value left to classify');
  const expected = state.values[state.j] < state.pivot ? 'small' : 'large';
  if (choice !== expected) {
    return { ...state, feedback: '比较当前值与 pivot：严格小于才进入左侧区域。' };
  }
  return stepPartition(state);
}

export function stepPartition(state) {
  if (state.phase === 'done') throw new Error('Partition has finished');
  const values = [...state.values];
  const last = values.length - 1;
  if (state.phase === 'finalize') {
    [values[state.i], values[last]] = [values[last], values[state.i]];
    return {
      ...state,
      values,
      phase: 'done',
      pivotIndex: state.i,
      feedback: '',
      note: `pivot 落在下标 ${state.i}：左边都小于它，右边都不小于它。`,
    };
  }
  const value = values[state.j];
  const accepted = value < state.pivot;
  if (accepted) [values[state.i], values[state.j]] = [values[state.j], values[state.i]];
  const i = state.i + (accepted ? 1 : 0);
  const j = state.j + 1;
  return {
    ...state,
    values,
    i,
    j,
    phase: j === last ? 'finalize' : 'scan',
    feedback: '',
    history: [...state.history, { index: state.j, value, accepted }],
    note: accepted
      ? `${value} < ${state.pivot}，与下标 ${state.i} 交换，小于区扩大。`
      : `${value} ≥ ${state.pivot}，保留在不小于区，继续检查。`,
  };
}
