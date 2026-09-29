import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Check, Eye, Pencil } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { isolationAction, newIsolation } from '../../domain/practice.mjs';
import './practice.css';

export default function IsolationLab() {
  const [state, setState] = useState(newIsolation);
  const act = (action: string) => setState((current) => isolationAction(current, action));
  const changed = new Set(state.reads).size > 1;
  return (
    <Experiment
      className="practice-lab"
      title="同一次事务，两次读取"
      subtitle="参照 PostgreSQL 普通 SELECT 的快照教学模型，省略锁与写冲突；不是 SQLite 隔离级别实现。"
      onReset={() => setState(newIsolation(state.mode))}
    >
      <div className="experiment-controls">
        <label>
          事务 A 的隔离级别
          <SelectField
            value={state.mode}
            onChange={(event) => setState(newIsolation(event.target.value))}
          >
            <option value="read-committed">读已提交 · Read Committed</option>
            <option value="repeatable-read">可重复读 · Repeatable Read</option>
          </SelectField>
        </label>
      </div>
      <div className="practice-isolation-store">
        <small>已提交版本</small>
        <strong>{state.committed}</strong>
        <span>{state.pending === null ? '没有未提交写入' : 'B 的 120 尚未提交'}</span>
      </div>
      <div className="practice-isolation-lanes experiment-scene">
        <section>
          <h4>事务 A · 读取者</h4>
          <p>
            {state.mode === 'repeatable-read'
              ? '首次 SELECT 固定快照'
              : '每条 SELECT 取新的已提交快照'}
          </p>
          <button disabled={state.reads.length >= 6} onClick={() => act('read')}>
            <Eye size={16} />
            SELECT balance
          </button>
          <div className="practice-readings" aria-label="事务A读取记录">
            {state.reads.length ? (
              state.reads.map((value, i) => (
                <span key={i}>
                  <small>第 {i + 1} 次</small>
                  <strong>{value}</strong>
                </span>
              ))
            ) : (
              <span>尚未读取</span>
            )}
          </div>
        </section>
        <section>
          <h4>事务 B · 写入者</h4>
          <p>把同一账户的余额改成 120</p>
          <button disabled={state.pending !== null || state.bDone} onClick={() => act('write')}>
            <Pencil size={16} />
            UPDATE → 120
          </button>
          <button disabled={state.pending === null} onClick={() => act('commit')}>
            <Check size={16} />
            COMMIT
          </button>
          <span className="practice-transaction-state">
            {state.bDone ? '已提交' : state.pending !== null ? '修改尚未提交' : '等待写入'}
          </span>
        </section>
      </div>
      <ol className="practice-schedule" aria-label="事务操作时序">
        {state.log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <p className="experiment-status" aria-live="polite">
        {changed
          ? 'A 在同一个事务内先读到 100，后读到 120：出现不可重复读。读到的都是已提交值，因此不是脏读。'
          : state.mode === 'repeatable-read' && state.readAfterCommit && state.snapshot === 100
            ? 'B 已提交 120，A 仍按先前快照读到 100。读取稳定不代表所有并发业务问题都已解决。'
            : state.bDone && !state.readAfterCommit
              ? 'B 已提交新版本 120，A 尚未在这次提交之后读取。'
              : `当前已提交余额为 ${state.committed}，A 已读取 ${state.reads.length} 次。B 的未提交修改不会被 A 读到。`}
      </p>
    </Experiment>
  );
}
