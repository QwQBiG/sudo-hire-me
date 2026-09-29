export const windowValues = [2, 1, 5, 2, 3, 2];

function describe(state) {
  if (state.right === state.values.length && state.sum < state.target) {
    return {
      ...state,
      done: true,
      next: null,
      note: '右端已到末尾，当前窗口不足目标；没有更多候选。',
    };
  }
  if (state.sum >= state.target) {
    return {
      ...state,
      done: false,
      next: 'shrink',
      note: '当前窗口达标：记录长度，再尝试移走左端。',
    };
  }
  return { ...state, done: false, next: 'expand', note: '当前窗口未达标：纳入右端的下一个数。' };
}

export function createWindowState(target = 7) {
  if (!Number.isSafeInteger(target) || target <= 0) {
    throw new Error('Target must be a positive safe integer');
  }
  return describe({
    target,
    values: [...windowValues],
    left: 0,
    right: 0,
    sum: 0,
    best: null,
    history: [],
    feedback: '',
  });
}

export function stepWindow(state, action) {
  if (action !== 'expand' && action !== 'shrink') throw new Error('Unknown window action');
  if (state.done) throw new Error('Window search has finished');
  if (action !== state.next) {
    return { ...state, feedback: '这一步不能保持当前算法的不变量；先判断窗口和是否达标。' };
  }
  const before = { left: state.left, right: state.right, sum: state.sum, action };
  if (action === 'expand') {
    return describe({
      ...state,
      right: state.right + 1,
      sum: state.sum + state.values[state.right],
      history: [...state.history, before],
      feedback: '',
    });
  }
  const candidate = { left: state.left, right: state.right, length: state.right - state.left };
  const best = !state.best || candidate.length < state.best.length ? candidate : state.best;
  return describe({
    ...state,
    left: state.left + 1,
    sum: state.sum - state.values[state.left],
    best,
    history: [...state.history, before],
    feedback: '',
  });
}
