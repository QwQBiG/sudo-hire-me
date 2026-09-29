import { useState } from 'react';
import { CheckCheck, ClipboardPen, CloudDownload, DatabaseZap, FilePlus2 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  appendWalRecord,
  beginWalChange,
  checkpointWal,
  commitWal,
  crashRecoverWal,
  createWalState,
} from '../../domain/wal-workbench.mjs';
import './mechanism-labs.css';

export default function Wal() {
  const [state, setState] = useState(() => createWalState());
  const visible = state.log?.committed ? state.log.value : state.disk;
  return (
    <Experiment
      title="WAL 崩溃恢复台"
      subtitle="教学模型：日志先于主数据页，提交记录视为已持久化"
      className="wal-lab"
      onReset={() => setState(createWalState())}
    >
      <div className="wal-lanes">
        <section data-active={state.stage === 'pending'}>
          <small>事务内拟修改</small>
          <strong>{state.pending ?? '无'}</strong>
          <span>尚未成为可恢复的提交值</span>
        </section>
        <section data-active={Boolean(state.log)}>
          <small>预写日志</small>
          <strong>
            {state.log ? `${state.log.value} · ${state.log.committed ? '已提交' : '未提交'}` : '空'}
          </strong>
          <span>提交标记决定恢复取舍</span>
        </section>
        <section data-active={state.stage === 'checkpointed'}>
          <small>主数据页</small>
          <strong>{state.disk}</strong>
          <span>检查点后才整理成新值</span>
        </section>
      </div>
      <div className="wal-actions">
        <button disabled={state.stage !== 'idle'} onClick={() => setState(beginWalChange)}>
          <ClipboardPen size={15} /> 1 开始修改
        </button>
        <button disabled={state.stage !== 'pending'} onClick={() => setState(appendWalRecord)}>
          <FilePlus2 size={15} /> 2 追加日志
        </button>
        <button disabled={state.stage !== 'logged'} onClick={() => setState(commitWal)}>
          <CheckCheck size={15} /> 3 提交
        </button>
        <button disabled={state.stage !== 'committed'} onClick={() => setState(checkpointWal)}>
          <CloudDownload size={15} /> 4 检查点
        </button>
        <button
          disabled={state.stage === 'idle' || state.stage === 'recovered'}
          onClick={() => setState(crashRecoverWal)}
        >
          <DatabaseZap size={15} /> 任意阶段崩溃恢复
        </button>
      </div>
      <div className="mechanism-result" aria-live="polite">
        <strong>已提交可见值：{visible}</strong>
        <p>{state.message}</p>
      </div>
    </Experiment>
  );
}
