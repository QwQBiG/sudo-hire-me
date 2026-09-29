export const pointerDatasets = {
  sorted: [1, 2, 4, 6, 8, 11],
  signed: [-4, -1, 1, 2, 5, 7],
};

function describe(state) {
  if (state.left >= state.right) {
    return { ...state, done: true, pair: null, note: '指针已相遇或越过；不存在两个不同下标的解。' };
  }
  const sum = state.values[state.left] + state.values[state.right];
  if (sum === state.target) {
    return {
      ...state,
      done: true,
      pair: [state.left, state.right],
      note: `${state.values[state.left]} + ${state.values[state.right]} = ${state.target}，找到两个不同下标。`,
    };
  }
  return {
    ...state,
    done: false,
    pair: null,
    note:
      sum < state.target
        ? `${sum} 小于 ${state.target}；固定左值并向左移右指针只会更小，应右移左指针。`
        : `${sum} 大于 ${state.target}；固定右值并向右移左指针只会更大，应左移右指针。`,
  };
}

export function createPointerState(dataset = 'sorted', target = 10) {
  if (!Object.hasOwn(pointerDatasets, dataset) || !Number.isSafeInteger(target)) {
    throw new Error('Expected a known sorted dataset and safe-integer target');
  }
  const values = [...pointerDatasets[dataset]];
  return describe({
    dataset,
    target,
    values,
    left: 0,
    right: values.length - 1,
    history: [],
    feedback: '',
  });
}

export function expectedPointerMove(state) {
  if (state.done) return null;
  return state.values[state.left] + state.values[state.right] < state.target ? 'left' : 'right';
}

export function movePointer(state, direction) {
  if (direction !== 'left' && direction !== 'right') throw new Error('Unknown pointer move');
  if (state.done) throw new Error('Pointer search has finished');
  const sum = state.values[state.left] + state.values[state.right];
  const expected = expectedPointerMove(state);
  if (direction !== expected) {
    return { ...state, feedback: '这一步不能安全排除目标；再比较两端和目标的大小。' };
  }
  return describe({
    ...state,
    left: state.left + (direction === 'left' ? 1 : 0),
    right: state.right - (direction === 'right' ? 1 : 0),
    history: [...state.history, { left: state.left, right: state.right, sum, direction }],
    feedback: '',
  });
}
