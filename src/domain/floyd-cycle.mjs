export const cyclePresets = {
  cyclic: { A: 'B', B: 'C', C: 'D', D: 'E', E: 'C' },
  linear: { A: 'B', B: 'C', C: 'D', D: 'E', E: null },
  self: { A: 'A' },
  empty: {},
};

export function createCycleState(preset = 'cyclic') {
  if (!Object.hasOwn(cyclePresets, preset)) throw new Error('Unknown cycle preset');
  const next = { ...cyclePresets[preset] };
  const nodes = Object.keys(next);
  const head = nodes[0] ?? null;
  return {
    preset,
    next,
    nodes,
    head,
    slow: head,
    fast: head,
    seeker: null,
    phase: head ? 'detect' : 'done',
    entry: null,
    hasCycle: head ? null : false,
    ticks: 0,
    note: head ? '两指针都从头节点出发；先移动，再检查是否相遇。' : '空链表无环。',
  };
}

export function stepCycle(state) {
  if (state.phase === 'done' || state.phase === 'entry-ready')
    throw new Error('No movement available');
  if (state.phase === 'detect') {
    if (state.fast === null || state.next[state.fast] === null) {
      return { ...state, phase: 'done', hasCycle: false, note: '快指针无法再前进两步：没有环。' };
    }
    const slow = state.next[state.slow];
    const fast = state.next[state.next[state.fast]];
    const met = slow === fast;
    return {
      ...state,
      slow,
      fast,
      ticks: state.ticks + 1,
      phase: met ? 'entry-ready' : 'detect',
      hasCycle: met ? true : null,
      note: met
        ? `第 ${state.ticks + 1} 轮在 ${slow} 相遇；下一步重置一个指针到头。`
        : `第 ${state.ticks + 1} 轮：慢指针到 ${slow}，快指针到 ${fast ?? 'null'}。`,
    };
  }
  const seeker = state.next[state.seeker];
  const fast = state.next[state.fast];
  const entry = seeker === fast ? seeker : null;
  return {
    ...state,
    seeker,
    fast,
    entry,
    phase: entry ? 'done' : 'locate',
    note: entry
      ? `两指针在入环点 ${entry} 相遇。`
      : `寻找入口：头侧到 ${seeker}，环内侧到 ${fast}。`,
  };
}

export function beginEntrySearch(state) {
  if (state.phase !== 'entry-ready') throw new Error('Cycle meeting required');
  const entry = state.head === state.fast ? state.head : null;
  return {
    ...state,
    seeker: state.head,
    entry,
    phase: entry ? 'done' : 'locate',
    note: entry
      ? `相遇点就是头节点 ${entry}，它也是入口。`
      : '重置头侧指针；两边接下来每轮各走一步。',
  };
}
