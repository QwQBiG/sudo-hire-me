import { useState } from 'react';
import { Play } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { advanceRace, initialRace } from '../../domain/systems.mjs';
import './systems.css';

export default function Race() {
  const [locked, setLocked] = useState(false);
  const [state, setState] = useState(initialRace);
  const done = state.phases.every((phase) => phase === 3);
  return (
    <Experiment
      title="亲手调度两个线程"
      subtitle="单次读写不可分割的交错模型 · 不代表 C++ 数据竞争的全部可能结果"
      onReset={() => setState(initialRace())}
    >
      <div className="experiment-controls sys-controls">
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={locked}
            onChange={(event) => {
              setLocked(event.target.checked);
              setState(initialRace());
            }}
          />
          用同一把锁保护完整读改写
        </label>
      </div>
      <div className="experiment-scene">
        <div className="sys-counter">
          <span>共享 count</span>
          <strong>{state.shared}</strong>
          <span>
            {locked
              ? `锁：${state.owner === -1 ? '空闲' : state.owner === 0 ? 'A 持有' : 'B 持有'}`
              : '未加锁'}
          </span>
        </div>
        <div className="sys-threads">
          {['A', 'B'].map((name, thread) => (
            <div className="sys-thread" key={name}>
              <h3>线程 {name}</h3>
              <code>local = {state.phases[thread] === 0 ? '?' : state.locals[thread]}</code>
              <div className="sys-phases">
                {['读取 count', 'local 加一', '写回 count', '完成'].map((phase, index) => (
                  <span key={phase} data-active={state.phases[thread] === index}>
                    {phase}
                  </span>
                ))}
              </div>
              <div className="sys-actions">
                <button
                  disabled={state.phases[thread] === 3}
                  onClick={() => setState((current) => advanceRace(current, thread, locked))}
                >
                  <Play size={15} />
                  执行线程 {name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="experiment-status" role="status">
        {state.message}
        {done &&
          (state.shared === 2
            ? ' 两次更新均保留；无锁时一次正确结果仍不能证明所有交错正确。'
            : ' 两次加一只剩一次：较晚写回覆盖了另一线程的更新。')}
      </p>
    </Experiment>
  );
}
