import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  LockKeyhole,
  ShieldCheck,
  ShieldOff,
  Terminal,
  Wallet,
} from 'lucide-react';
import { Bench, Choice, Feedback } from './Bench';
import { applyAccount, MAX_BALANCE } from '../../domain/account-workbench.mjs';
import { SignalRoute, type Signal } from './SignalRoute';

export default function Account() {
  const [balance, setBalance] = useState(100);
  const [amount, setAmount] = useState('120');
  const [mode, setMode] = useState('guarded');
  const [history, setHistory] = useState<
    { call: string; before: number; after: number; accepted: boolean }[]
  >([]);
  const [message, setMessage] = useState(
    '账户已有 100 分。尝试扣款 120 分，观察返回值与余额是否一起变化。',
  );
  const [revision, setRevision] = useState(0);
  const [signal, setSignal] = useState<Signal | null>(null);
  const valid = balance >= 0;
  function reset() {
    setBalance(100);
    setAmount('120');
    setHistory([]);
    setMessage('账户已恢复到 100 分。');
    setRevision(0);
    setSignal(null);
  }
  function run(operation: 'withdraw' | 'deposit') {
    const result = applyAccount(
      balance,
      operation,
      amount.trim() === '' ? NaN : Number(amount),
      mode === 'guarded',
    );
    setHistory((items) =>
      [
        {
          call: `${operation}(${amount})`,
          before: balance,
          after: result.balance,
          accepted: result.accepted,
        },
        ...items,
      ].slice(0, 6),
    );
    setBalance(result.balance);
    setMessage(result.reason);
    setRevision((n) => n + 1);
    setSignal({
      id: revision + 1,
      kind: result.accepted ? 'send' : 'blocked',
      label: `${operation}(${amount}) → ${result.accepted} · cents = ${result.balance}`,
    });
  }
  return (
    <Bench
      title="守住账户的边界"
      subtitle="单线程 · Java int · 单位：分 · 可执行状态模型"
      onReset={reset}
      className="account-bench"
    >
      <Choice
        label="账户实现"
        value={mode}
        options={[
          ['guarded', '受控方法'],
          ['unguarded', '漏洞：只写 private'],
        ]}
        onChange={(value) => {
          setMode(value);
          reset();
        }}
      />
      <div className="account-stage">
        <div className="account-console">
          <div className="bench-label">
            <Terminal size={16} /> 调用方
          </div>
          <label htmlFor="account-amount">本次金额（整数分）</label>
          <input
            id="account-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="account-actions">
            <button className="primary" onClick={() => run('withdraw')}>
              <ArrowUpRight size={17} /> 扣款
            </button>
            <button className="secondary" onClick={() => run('deposit')}>
              <ArrowDownLeft size={17} /> 存入
            </button>
          </div>
          <div className="account-boundaries">
            <span>边界样本</span>
            {[0, -1, 100, 120, MAX_BALANCE].map((n) => (
              <button key={n} onClick={() => setAmount(String(n))}>
                <code>{n}</code>
              </button>
            ))}
          </div>
        </div>
        <div
          className={`account-gate ${mode}`}
          aria-label={mode === 'guarded' ? '校验开启' : '校验缺失'}
        >
          {mode === 'guarded' ? <ShieldCheck size={36} /> : <ShieldOff size={36} />}
          <b>{mode === 'guarded' ? '校验入口' : '无校验'}</b>
          <span>amount &gt; 0</span>
          <span>余额 / 溢出检查</span>
          <i />
        </div>
        <div className={`account-vault ${valid ? '' : 'broken'}`}>
          <div className="bench-label">
            <LockKeyhole size={16} /> Account · private
          </div>
          <Wallet size={28} />
          <span>cents</span>
          <output key={revision}>{balance.toLocaleString('en-US')}</output>
          <div className="account-invariant">
            {valid ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}{' '}
            {valid ? '不变量成立' : '不变量已被破坏'}
            <code>cents ≥ 0</code>
          </div>
        </div>
      </div>
      <SignalRoute
        signal={signal}
        nodes={['调用方', mode === 'guarded' ? '参数与状态校验' : '缺失校验', 'Account.cents']}
      />
      <Feedback good={valid}>{message}</Feedback>
      <div className="account-ledger">
        <div className="bench-label">
          调用记录 <span>返回 false 时，状态也必须保持原样</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>调用</th>
              <th>返回值</th>
              <th>余额变化</th>
            </tr>
          </thead>
          <tbody>
            {history.length ? (
              history.map((item, i) => (
                <tr key={`${revision}-${i}`}>
                  <td>
                    <code>{item.call}</code>
                  </td>
                  <td className={item.accepted ? 'bench-true' : 'bench-false'}>
                    {String(item.accepted)}
                  </td>
                  <td>
                    <code>
                      {item.before} → {item.after}
                    </code>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="bench-empty">
                  等待第一笔操作
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Bench>
  );
}
