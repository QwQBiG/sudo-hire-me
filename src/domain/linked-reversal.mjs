export const reversalPresets = {
  four: ['A', 'B', 'C', 'D'],
  single: ['A'],
  empty: [],
};

export function createReversalState(preset = 'four') {
  if (!Object.hasOwn(reversalPresets, preset)) throw new Error('Unknown linked-list preset');
  const nodes = [...reversalPresets[preset]];
  const next = Object.fromEntries(nodes.map((node, index) => [node, nodes[index + 1] ?? null]));
  return {
    preset,
    nodes,
    next,
    head: nodes[0] ?? null,
    prev: null,
    curr: nodes[0] ?? null,
    saved: null,
    phase: nodes.length ? 'save' : 'done',
    count: 0,
    feedback: '',
    note: nodes.length ? '先保存当前节点的后继，才能安全改变链接。' : '空链表反转后仍为空。',
  };
}

export function stepReversal(state, action) {
  if (!['save', 'rewire', 'advance'].includes(action)) throw new Error('Unknown reversal action');
  if (state.phase === 'done') throw new Error('Reversal has finished');
  if (action !== state.phase) {
    return { ...state, feedback: '顺序不对：先保存后继，再重连当前节点，最后推进指针。' };
  }
  if (action === 'save') {
    const saved = state.next[state.curr];
    return {
      ...state,
      saved,
      phase: 'rewire',
      feedback: '',
      note: `保存 ${state.curr}.next = ${saved ?? 'null'}；剩余链表不会丢失。`,
    };
  }
  if (action === 'rewire') {
    return {
      ...state,
      next: { ...state.next, [state.curr]: state.prev },
      phase: 'advance',
      feedback: '',
      note: `把 ${state.curr}.next 改指向 ${state.prev ?? 'null'}。`,
    };
  }
  const prev = state.curr;
  const curr = state.saved;
  const done = curr === null;
  return {
    ...state,
    prev,
    curr,
    saved: null,
    head: done ? prev : state.head,
    phase: done ? 'done' : 'save',
    count: state.count + 1,
    feedback: '',
    note: done
      ? `处理完 ${state.count + 1} 个节点，新头是 ${prev}。`
      : `指针前移：prev=${prev}，curr=${curr}。`,
  };
}

export function listFromHead(state) {
  const result = [];
  const seen = new Set();
  let node = state.phase === 'done' ? state.head : state.prev;
  while (node !== null && !seen.has(node)) {
    seen.add(node);
    result.push(node);
    node = state.next[node];
  }
  return result;
}
