import { useState } from 'react';
import { Clock3, PlugZap } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback, Meter } from './Bench';
import './workbench-quality.css';

export default function Resilience({ lesson }: LabProps) {
  const s = lesson.slug;
  const [mode, setMode] = useState('first');
  const [attempt, setAttempt] = useState(0);
  const [time, setTime] = useState(0);
  const [state, setState] = useState('closed');
  const [healthy, setHealthy] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [a, setA] = useState(300);
  const [b, setB] = useState(300);
  const [note, setNote] = useState('更改失败条件与保护策略，观察请求结果。');
  function reset() {
    setAttempt(0);
    setTime(0);
    setState('closed');
    setHistory([]);
    setHealthy(false);
    setNote('状态已重置。');
  }
  if (s === 'timeouts-deadlines') {
    const remaining = Math.max(0, 500 - a);
    const allowed = mode === 'first' ? 500 : remaining;
    const elapsed = a + Math.min(b, allowed);
    return (
      <Bench
        title="让调用链共用一个截止时间"
        subtitle="串行调用 A 后调用 B；总预算 500 ms，忽略网络外的额外开销。"
        onReset={() => {
          reset();
          setA(300);
          setB(300);
        }}
      >
        <Choice
          label="预算传播"
          value={mode}
          options={[
            ['first', '每跳重新给 500 ms'],
            ['deadline', '共享总截止时间'],
          ]}
          onChange={setMode}
        />
        <div className="bench-controls">
          <label>
            A 耗时 {a} ms
            <input
              type="range"
              min={100}
              max={500}
              step={50}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
            />
          </label>
          <label>
            B 所需 {b} ms
            <input
              type="range"
              min={100}
              max={500}
              step={50}
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="quality-path">
          <code>A 结束于 {a} ms</code>
          <span>→</span>
          <code>B 等待 {Math.min(b, allowed)} ms</code>
          <output className={b > allowed ? 'blocked' : ''}>
            {b > allowed ? 'B 未完成，停止本地等待' : 'B 完成'}
          </output>
        </div>
        <div className="deadline-timeline">
          <div style={{ width: `${a / 10}%` }}>A · {a}</div>
          <div
            className={b > allowed ? 'expired' : ''}
            style={{ width: `${Math.min(b, allowed) / 10}%` }}
          >
            {allowed > 0 ? `B · ${Math.min(b, allowed)}` : ''}
          </div>
          <i style={{ left: '50%' }}>500 ms</i>
        </div>
        <div className="bench-grid">
          <div className="bench-stat">
            <small>B 可用预算</small>
            <strong>{allowed} ms</strong>
          </div>
          <div className="bench-stat">
            <small>实际总耗时</small>
            <strong>{elapsed} ms</strong>
          </div>
        </div>
        <Feedback good={elapsed <= 500}>
          {mode === 'first'
            ? '每跳单独看都没超时，整体仍可能超过调用方的 500 ms 预算。'
            : b > allowed
              ? 'B 的所需时间超过剩余预算，在截止时间处终止等待。'
              : '两个调用都能在统一截止时间之前完成。'}{' '}
          取消等待不代表远端副作用一定停止，需要额外取消协议与幂等处理。
        </Feedback>
      </Bench>
    );
  }
  if (s === 'retry-exponential-backoff')
    return (
      <Bench
        title="把重试散开，给下游恢复时间"
        subtitle="基准 100 ms，上限 1600 ms；抖动用固定样本展示，真实客户端应独立随机取样。"
        onReset={reset}
      >
        <Choice
          label="重试策略"
          value={mode}
          options={[
            ['first', '固定 100 ms'],
            ['backoff', '指数退避'],
            ['jitter', '指数退避 + 抖动'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="retry-bars">
          {!history.length && (
            <div>
              <span>#1</span>
              <i style={{ width: '6.25%' }} />
              <b>下一次上限 100 ms</b>
            </div>
          )}
          {history.map((delay, i) => (
            <div key={i}>
              <span>#{i + 1}</span>
              <i style={{ width: `${Math.max(2, delay / 16)}%` }} />
              <b>{delay} ms</b>
            </div>
          ))}
        </div>
        <div className="quality-observation">
          <div>
            <small>已安排重试</small>
            <output>{attempt} / 6</output>
          </div>
          <div>
            <small>下一次等待上限</small>
            <output>
              {attempt >= 6
                ? '次数预算耗尽'
                : `${mode === 'first' ? 100 : Math.min(1600, 100 * 2 ** attempt)} ms`}
            </output>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={attempt >= 6}
            onClick={() => {
              const ceiling = mode === 'first' ? 100 : Math.min(1600, 100 * 2 ** attempt);
              const delay =
                mode === 'jitter'
                  ? Math.round(ceiling * [0.35, 0.8, 0.2, 0.65, 0.45, 0.9][attempt])
                  : ceiling;
              setAttempt(attempt + 1);
              setHistory([...history, delay]);
              setTime(time + delay);
              setNote(
                `第 ${attempt + 1} 次失败后安排 ${delay} ms 等待。重试还必须受总预算、次数和错误类型限制。`,
              );
            }}
          >
            失败一次，安排重试
          </button>
        </div>
        <Meter label={`累计等待 ${time} ms · 本轮最多 6 次`} value={attempt} max={6} />
        <Feedback>{note} 业务副作用不会因为加了退避就自动幂等。</Feedback>
      </Bench>
    );
  function request() {
    if (state === 'open') return setNote('熔断器开启，请求在本地被拒绝，没有继续消耗下游资源。');
    if (healthy) {
      setAttempt(0);
      setState('closed');
      setNote('调用成功，计数清零，恢复正常通路。');
    } else {
      const n = attempt + 1;
      setAttempt(n);
      if (n >= 3 || state === 'half') {
        setState('open');
        setTime(0);
      }
      setNote(
        n >= 3 || state === 'half'
          ? '失败达到阈值或探测失败，重新开启熔断。'
          : `连续失败 ${n}/3，尚未达到阈值。`,
      );
    }
  }
  return (
    <Bench
      title="让熔断器决定是否继续调用"
      subtitle="连续失败阈值 3；开启后冷却 10 秒，再允许单个探测请求。"
      onReset={reset}
    >
      <label>
        <input type="checkbox" checked={healthy} onChange={(e) => setHealthy(e.target.checked)} />
        下游已恢复
      </label>
      <div className="breaker-states">
        {[
          ['closed', 'Closed · 正常'],
          ['open', 'Open · 拒绝'],
          ['half', 'Half-open · 探测'],
        ].map(([id, name]) => (
          <div key={id} className={state === id ? 'active' : ''}>
            <PlugZap size={28} />
            <strong>{name}</strong>
          </div>
        ))}
      </div>
      <div className="quality-observation">
        <div>
          <small>下一个请求</small>
          <output>
            {state === 'open'
              ? '本地拒绝，不触达下游'
              : state === 'half'
                ? '只放行一个探测'
                : '正常放行'}
          </output>
        </div>
        <div>
          <small>失败计数</small>
          <output>{attempt} / 3</output>
        </div>
        <div>
          <small>本轮冷却</small>
          <output>{state === 'closed' ? '未开启' : `${Math.min(time, 10)} / 10 s`}</output>
        </div>
      </div>
      <div className="bench-actions">
        <button className="primary" onClick={request}>
          {state === 'half' ? '发送一个探测请求' : '发起请求'}
        </button>
        <button
          className="secondary"
          disabled={state !== 'open'}
          onClick={() => {
            const next = time + 5;
            setTime(next);
            if (next >= 10) setState('half');
            setNote(
              next >= 10
                ? '冷却结束，进入半开；只放行有限探测，不能马上放开全部流量。'
                : `已冷却 ${next}/10 秒。`,
            );
          }}
        >
          <Clock3 size={16} />
          冷却 +5 秒
        </button>
      </div>
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
