import { useState } from 'react';
import { Play, Layers3, RotateCcw } from 'lucide-react';
import { advanceRace, initialRace } from '../domain/systems.mjs';
import './systems/systems-quality.css';

export default function Process() {
  const [locked, setLocked] = useState(false);
  const [state, setState] = useState(initialRace);
  const [history, setHistory] = useState<{ thread: number; message: string }[]>([]);
  const done = state.phases.every((phase) => phase === 3);
  const last = history.at(-1);
  const reset = () => {
    setState(initialRace());
    setHistory([]);
  };
  function run(thread: number) {
    const next = advanceRace(state, thread, locked);
    setState(next);
    setHistory((events) => [...events, { thread, message: next.message }].slice(-10));
  }
  return (
    <section className="lab" aria-label="线程交错实验">
      <header className="lab-heading">
        <span>
          <Layers3 size={18} />
          THREAD SCHEDULER
        </span>
        <span className="lab-kind">简化模型 · 非实际调度</span>
      </header>
      <div className="lab-toolbar">
        <label>
          <input
            type="checkbox"
            checked={locked}
            onChange={(event) => {
              setLocked(event.target.checked);
              reset();
            }}
          />{' '}
          同一把锁保护完整读改写
        </label>
        <span className="muted-light">两次 count + 1</span>
      </div>
      <div className="thread-board">
        <div className="shared-memory">
          <small>进程 · 共享地址空间</small>
          <span>
            count <strong data-readout>{state.shared}</strong>
          </span>
          <div>代码 / 堆 / 全局数据</div>
        </div>
        <div className="thread-lanes">
          {['A', 'B'].map((name, thread) => (
            <div className={`thread-lane ${last?.thread === thread ? 'active' : ''}`} key={name}>
              <span>线程 {name}</span>
              <small>独立的栈 / 寄存器上下文</small>
              <code>local = {state.phases[thread] === 0 ? '?' : state.locals[thread]}</code>
              <button
                className="lab-button"
                disabled={state.phases[thread] === 3}
                onClick={() => run(thread)}
              >
                <Play size={15} />{' '}
                {['读取 count', '本地加一', '写回 count', '已完成'][state.phases[thread]]}
              </button>
              <small>
                {state.phases[thread] === 3
                  ? '已完成'
                  : locked && state.owner === thread
                    ? '持有锁'
                    : locked && state.owner !== -1
                      ? '等待同一把锁'
                      : '可调度'}
              </small>
            </div>
          ))}
        </div>
      </div>
      <div className="execution-log" aria-live="polite">
        {history.length ? (
          history.map((entry, index) => (
            <div key={index}>
              <span>{index + 1}</span>
              <b>线程 {['A', 'B'][entry.thread]}</b>
              <code>{entry.message}</code>
            </div>
          ))
        ) : (
          <p>初始值为 0。两条线程分别读取、计算并写回。</p>
        )}
      </div>
      {done && (
        <p className="step-explanation">
          {locked
            ? '同一把锁使每个完整读改写互斥执行：后一线程读取前一线程的新值，本模型的两次增量都被保留。'
            : state.shared === 1
              ? '两次加一，结果却是 1：两个线程都从 0 开始计算，后一次写回覆盖了前一次。'
              : '本次顺序执行得到 2，但一次正确结果不能证明并发代码始终正确。'}
        </p>
      )}
      <footer className="lab-footer">
        <button className="icon-button" aria-label="重置线程实验" title="重置" onClick={reset}>
          <RotateCcw size={16} />
        </button>
        <span>
          {done
            ? `完成：期望 2，实际 ${state.shared}`
            : `已完成 ${state.phases.filter((phase) => phase === 3).length} / 2 个线程`}
        </span>
      </footer>
    </section>
  );
}
