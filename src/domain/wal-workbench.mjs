export function createWalState() {
  return {
    disk: 100,
    pending: /** @type {number | null} */ (null),
    log: /** @type {{ value: number, committed: boolean } | null} */ (null),
    stage: 'idle',
    message: '主数据页余额为 100；先开始一笔修改。',
  };
}

export function beginWalChange(state) {
  if (state.stage !== 'idle') throw new Error('finish current transaction first');
  return {
    ...state,
    pending: 130,
    stage: 'pending',
    message: '事务内准备把余额改为 130；主数据页仍是 100。',
  };
}

export function appendWalRecord(state) {
  if (state.stage !== 'pending') throw new Error('nothing to log');
  return {
    ...state,
    log: { value: state.pending, committed: false },
    stage: 'logged',
    message: '变更记录已写入教学日志，但尚无提交标记。',
  };
}

export function commitWal(state) {
  if (state.stage !== 'logged') throw new Error('log the change before commit');
  return {
    ...state,
    log: { ...state.log, committed: true },
    stage: 'committed',
    message: '提交记录已持久化；可恢复值为 130，主数据页仍未检查点。',
  };
}

export function checkpointWal(state) {
  if (state.stage !== 'committed') throw new Error('only committed data can be checkpointed');
  return {
    ...state,
    disk: state.log.value,
    pending: null,
    log: null,
    stage: 'checkpointed',
    message: '检查点已把提交值整理到主数据页；这是整理，不是再次提交。',
  };
}

export function crashRecoverWal(state) {
  const recovered = state.log?.committed ? state.log.value : state.disk;
  return {
    disk: recovered,
    pending: null,
    log: null,
    stage: 'recovered',
    message: `发生崩溃并恢复：${state.log?.committed ? '根据已提交日志重做' : '未提交变更丢弃'}，余额为 ${recovered}。`,
  };
}
