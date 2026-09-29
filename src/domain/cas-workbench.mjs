export function createCasState() {
  return {
    value: 0,
    drafts: { A: { expected: 0, next: 1 }, B: { expected: 0, next: 1 } },
    history: /** @type {string[]} */ ([]),
    message: 'A 和 B 都已读到旧值 0，准备执行 CAS(0, 1)。',
  };
}

export function attemptCas(state, actor) {
  if (!['A', 'B'].includes(actor)) throw new Error('unknown actor');
  const draft = state.drafts[actor];
  const success = state.value === draft.expected;
  const value = success ? draft.next : state.value;
  const detail = `${actor}: CAS(${draft.expected}, ${draft.next}) ${success ? '成功' : '失败'}；共享值 ${value}`;
  return { ...state, value, history: [...state.history, detail], message: detail };
}

export function refreshCas(state, actor) {
  if (!['A', 'B'].includes(actor)) throw new Error('unknown actor');
  const drafts = { ...state.drafts, [actor]: { expected: state.value, next: state.value + 1 } };
  return {
    ...state,
    drafts,
    message: `${actor} 重新读到 ${state.value}，改为准备 CAS(${state.value}, ${state.value + 1})。`,
  };
}
