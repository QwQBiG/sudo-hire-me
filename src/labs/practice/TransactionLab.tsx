import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Play, Undo2 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { newTransaction, transact } from '../../domain/practice.mjs';
import './practice.css';
import './practice-quality.css';

export default function TransactionLab() {
  const [state, setState] = useState(newTransaction);
  const [amount, setAmount] = useState(300);
  const act = (action: string) => setState((current) => transact(current, action, amount));
  const reset = () => {
    setState(newTransaction());
    setAmount(300);
  };
  return (
    <Experiment
      className="practice-lab"
      title="一笔转账的提交边界"
      subtitle="事务教学模型；约束失败按 SQLite 默认 ABORT 处理，应用禁止提交未完成的转账。金额单位为分。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          转账金额
          <SelectField
            value={amount}
            disabled={!!state.draft}
            onChange={(event) => setAmount(Number(event.target.value))}
          >
            <option value={100}>100</option>
            <option value={300}>300</option>
            <option value={1200}>1200（余额不足）</option>
          </SelectField>
        </label>
        <button disabled={!!state.draft} onClick={() => act('begin')}>
          <Play size={16} />
          BEGIN
        </button>
      </div>
      <div className="practice-transfer experiment-scene" data-stage={state.stage}>
        {[0, 1].map((account) => (
          <div className="practice-account" key={account}>
            <small>账户 {account + 1}</small>
            <strong>{(state.draft ?? state.committed)[account]}</strong>
            <span>已提交余额 {state.committed[account]}</span>
            <div className="practice-balance-track">
              <i
                style={{
                  width: `${Math.min(100, (state.draft ?? state.committed)[account] / 15)}%`,
                }}
              />
            </div>
          </div>
        ))}
        <ArrowRight className="practice-transfer-arrow" aria-label="账户1转给账户2" />
      </div>
      <div className="experiment-controls practice-actions">
        <button disabled={state.stage !== 'begun'} onClick={() => act('debit')}>
          <ArrowDown size={16} />
          扣款
        </button>
        <button disabled={state.stage !== 'debited'} onClick={() => act('credit')}>
          <ArrowUp size={16} />
          加款
        </button>
        <button disabled={state.stage !== 'credited'} onClick={() => act('commit')}>
          <Check size={16} />
          COMMIT
        </button>
        <button disabled={!state.draft} onClick={() => act('rollback')}>
          <Undo2 size={16} />
          ROLLBACK
        </button>
      </div>
      <div className="experiment-metrics">
        <div className="metric">
          <span>事务内总额</span>
          <strong>{(state.draft ?? state.committed).reduce((a, b) => a + b, 0)}</strong>
        </div>
        <div className="metric">
          <span>已提交总额</span>
          <strong>{state.committed.reduce((a, b) => a + b, 0)}</strong>
        </div>
        <div className="metric">
          <span>事务状态</span>
          <strong>
            {state.stage === 'failed' ? '语句失败' : state.draft ? '未提交' : '已结束'}
          </strong>
        </div>
      </div>
      <p className="experiment-status" aria-live="polite">
        {state.message}
      </p>
    </Experiment>
  );
}
