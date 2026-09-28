export const indexLeaves = [
  [4, 9, 16, 21],
  [25, 31, 39, 44],
  [50, 56, 62, 69],
  [75, 83, 91, 98],
];

export function queryIndex(target, covering = false) {
  if (!Number.isInteger(target) || target < 0 || target > 100) {
    throw new RangeError('Target must be an integer from 0 to 100');
  }
  const leaf = target < 25 ? 0 : target < 50 ? 1 : target < 75 ? 2 : 3;
  const position = indexLeaves[leaf].indexOf(target);
  return {
    leaf,
    found: position !== -1,
    row: position === -1 ? null : leaf * 4 + position + 1,
    nodes: 2,
    lookups: position !== -1 && !covering ? 1 : 0,
    scanned: indexLeaves.flat().length,
  };
}

/** @returns {{committed: number[], draft: number[] | null, amount: number, stage: string, message: string}} */
export function newTransaction() {
  return {
    committed: [1000, 500],
    draft: null,
    amount: 300,
    stage: 'idle',
    message: '账户总额 1500 分，尚未开启事务。',
  };
}

export function transact(state, action, amount = state.amount) {
  if (action === 'begin') {
    if (state.draft) return state;
    if (!Number.isInteger(amount) || amount <= 0 || amount > 2000)
      throw new RangeError('Invalid amount');
    return {
      ...state,
      draft: [...state.committed],
      amount,
      stage: 'begun',
      message: 'BEGIN：事务读取自己的临时修改；已提交版本尚未改变。',
    };
  }
  if (!state.draft) return state;
  if (action === 'rollback')
    return { ...state, draft: null, stage: 'idle', message: 'ROLLBACK：撤销全部未提交修改。' };
  if (action === 'debit' && state.stage === 'begun') {
    if (state.draft[0] < state.amount)
      return {
        ...state,
        stage: 'failed',
        message: 'CHECK(balance >= 0) 失败：本条语句撤销，事务仍存在。应用选择回滚。',
      };
    return {
      ...state,
      draft: [state.draft[0] - state.amount, state.draft[1]],
      stage: 'debited',
      message: '扣款完成，但转账尚未完成，业务检查禁止此时提交。',
    };
  }
  if (action === 'credit' && state.stage === 'debited')
    return {
      ...state,
      draft: [state.draft[0], state.draft[1] + state.amount],
      stage: 'credited',
      message: '加款完成，总额恢复。可以提交，也可以回滚。',
    };
  if (action === 'commit' && state.stage === 'credited')
    return {
      ...state,
      committed: [...state.draft],
      draft: null,
      stage: 'idle',
      message: 'COMMIT：两个账户的新余额一起成为已提交版本。',
    };
  return state;
}

export function newGitState() {
  return { working: 'version A', staged: 'version A', head: 'version A', count: 0 };
}

export function gitAction(state, action, text = state.working) {
  if (action === 'edit') {
    if (typeof text !== 'string' || text.length > 100)
      throw new RangeError('File content exceeds 100 characters');
    return { ...state, working: text };
  }
  if (action === 'stage') return { ...state, staged: state.working };
  if (action === 'commit' && state.staged !== state.head)
    return { ...state, head: state.staged, count: state.count + 1 };
  return state;
}

export function gitStatus(state) {
  return `${state.staged !== state.head ? 'M' : ' '}${state.working !== state.staged ? 'M' : ' '}`;
}

/** @returns {{kind: 'removed' | 'added' | 'note', text: string}[]} */
export function snapshotDiff(from, to) {
  if (![from, to].every((text) => typeof text === 'string' && text.length <= 100)) {
    throw new RangeError('Snapshots must be strings of at most 100 characters');
  }
  if (from === to) return [];
  /** @type {{kind: 'removed' | 'added' | 'note', text: string}[]} */
  const result = [];
  for (const [index, text] of [from, to].entries()) {
    if (!text) continue;
    const lines = text.split('\n');
    if (text.endsWith('\n')) lines.pop();
    for (const line of lines) {
      result.push({
        kind: index === 0 ? 'removed' : 'added',
        text: `${index === 0 ? '-' : '+'} ${line}`,
      });
    }
    if (!text.endsWith('\n')) result.push({ kind: 'note', text: '\\ No newline at end of file' });
  }
  return result;
}

export const debugCases = [
  { label: '普通正数', values: [2, 9, 4], expected: 9 },
  { label: '全负数', values: [-8, -3, -5], expected: -3 },
  { label: '单元素', values: [-5], expected: -5 },
  { label: '空数组', values: [], expected: null },
  { label: '重复最大值', values: [7, 7], expected: 7 },
];

export function runMaxCase(index, fixed) {
  if (!Number.isInteger(index) || !debugCases[index]) throw new RangeError('Unknown test case');
  const { values, expected } = debugCases[index];
  if (fixed && values.length === 0) return { actual: null, expected, passed: true, trace: [] };
  let best = fixed ? values[0] : 0;
  const trace = [{ value: null, best, updated: false }];
  for (let i = fixed ? 1 : 0; i < values.length; i++) {
    const updated = best !== null && values[i] > best;
    if (updated) best = values[i];
    trace.push({ value: values[i], best, updated });
  }
  return { actual: best, expected, passed: best === expected, trace };
}

/** @returns {{mode: string, committed: number, snapshot: number | null, pending: number | null, bDone: boolean, readAfterCommit: boolean, reads: number[], log: string[]}} */
export function newIsolation(mode = 'read-committed') {
  if (!['read-committed', 'repeatable-read'].includes(mode))
    throw new RangeError('Unknown isolation level');
  return {
    mode,
    committed: 100,
    snapshot: null,
    pending: null,
    bDone: false,
    readAfterCommit: false,
    reads: [],
    log: ['账户余额的已提交版本为 100。'],
  };
}

export function isolationAction(state, action) {
  if (action === 'read' && state.reads.length < 6) {
    const snapshot = state.snapshot ?? state.committed;
    const value = state.mode === 'repeatable-read' ? snapshot : state.committed;
    return {
      ...state,
      snapshot,
      readAfterCommit: state.bDone,
      reads: [...state.reads, value],
      log: [...state.log, `A SELECT → ${value}`],
    };
  }
  if (action === 'write' && state.pending === null && !state.bDone) {
    return { ...state, pending: 120, log: [...state.log, 'B UPDATE → 120（尚未提交）'] };
  }
  if (action === 'commit' && state.pending !== null) {
    return {
      ...state,
      committed: state.pending,
      pending: null,
      bDone: true,
      log: [...state.log, 'B COMMIT → 120 成为已提交版本'],
    };
  }
  return state;
}
