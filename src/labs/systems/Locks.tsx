import { useId, useState } from 'react';
import { LockKeyhole, Unlock } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { isDeadlocked, requestLock } from '../../domain/systems.mjs';
import './systems.css';

export default function Locks() {
  const [owners, setOwners] = useState([-1, -1]);
  const [waiting, setWaiting] = useState([-1, -1]);
  const [ordered, setOrdered] = useState(false);
  const [message, setMessage] = useState('每把锁只有一个实例。申请顺序由你决定。');
  const marker = useId().replaceAll(':', '');
  const deadlocked = isDeadlocked(owners, waiting);
  const reset = () => {
    setOwners([-1, -1]);
    setWaiting([-1, -1]);
    setMessage('从两把空闲锁重新开始。');
  };
  const acquire = (thread: number, resource: number) => {
    const next = requestLock(owners, waiting, thread, resource, ordered);
    setOwners(next.owners);
    setWaiting(next.waiting);
    setMessage(next.message);
  };
  const release = (thread: number) => {
    setOwners(owners.map((owner) => (owner === thread ? -1 : owner)));
    setWaiting(
      waiting.map((resource, index) =>
        index === thread || (resource !== -1 && owners[resource] === thread) ? -1 : resource,
      ),
    );
    setMessage('该线程完成并释放所有持有锁；等待者恢复到可重新申请状态。');
  };
  return (
    <Experiment
      title="锁与等待关系图"
      subtitle="两个线程、两把单实例锁 · 阻塞线程无法主动执行释放"
      onReset={reset}
    >
      <div className="experiment-controls sys-controls">
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={ordered}
            onChange={(event) => {
              setOrdered(event.target.checked);
              reset();
            }}
          />
          统一获取顺序：X → Y（重新开始）
        </label>
      </div>
      <div className="experiment-scene">
        <svg
          className="sys-lock-graph"
          viewBox="0 0 500 225"
          role="img"
          aria-label={`资源分配图。X 由 ${owners[0] === -1 ? '无人' : ['A', 'B'][owners[0]]} 持有，Y 由 ${owners[1] === -1 ? '无人' : ['A', 'B'][owners[1]]} 持有。${deadlocked ? '已形成死锁' : '未形成等待环'}`}
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill="#a33e6c" />
            </marker>
          </defs>
          {[0, 1].map(
            (resource) =>
              owners[resource] !== -1 && (
                <line
                  key={`own${resource}`}
                  x1={170 + resource * 160}
                  y1={75}
                  x2={owners[resource] === 0 ? 75 : 425}
                  y2={158}
                  stroke="#a33e6c"
                  strokeWidth="2"
                  markerEnd={`url(#${marker})`}
                />
              ),
          )}
          {[0, 1].map(
            (thread) =>
              waiting[thread] !== -1 && (
                <line
                  key={`wait${thread}`}
                  x1={thread === 0 ? 75 : 425}
                  y1={155}
                  x2={170 + waiting[thread] * 160}
                  y2={78}
                  stroke="#a33e6c"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  markerEnd={`url(#${marker})`}
                />
              ),
          )}
          {['X', 'Y'].map((lock, index) => (
            <g key={lock}>
              <rect x={140 + index * 160} y="28" width="60" height="48" rx="5" fill="#e9e0f2" />
              <text x={170 + index * 160} y="58" textAnchor="middle">
                锁 {lock}
              </text>
            </g>
          ))}
          {['A', 'B'].map((thread, index) => (
            <g key={thread}>
              <circle cx={index === 0 ? 65 : 435} cy="175" r="30" fill="#e2eef8" />
              <text x={index === 0 ? 65 : 435} y="180" textAnchor="middle">
                {thread}
              </text>
            </g>
          ))}
          <text className="sys-edge-label" x="250" y="202" textAnchor="middle">
            实线：锁 → 持有者　虚线：线程 → 等待的锁
          </text>
        </svg>
        <p className={`sys-lock-summary ${deadlocked ? 'sys-warning' : ''}`}>
          {deadlocked
            ? 'A → B → A：双方都在等对方释放，已经死锁。'
            : '尚未形成死锁；等待不一定等于死锁。'}
        </p>
        <div className="sys-threads">
          {['A', 'B'].map((thread, index) => (
            <div className="sys-thread" key={thread}>
              <h3>
                线程 {thread} ·{' '}
                {waiting[index] === -1 ? '可执行' : `等待 ${['X', 'Y'][waiting[index]]}`}
              </h3>
              <div className="sys-actions">
                {['X', 'Y'].map((lock, resource) => (
                  <button
                    key={lock}
                    disabled={waiting[index] !== -1 || owners[resource] === index}
                    onClick={() => acquire(index, resource)}
                  >
                    <LockKeyhole size={14} />
                    申请 {lock}
                  </button>
                ))}
                <button
                  disabled={waiting[index] !== -1 || !owners.includes(index)}
                  onClick={() => release(index)}
                >
                  <Unlock size={14} />
                  完成并释放
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="experiment-status" role="status">
        {message}
        {deadlocked && ' 须重置后重新规划锁顺序；本模型没有超时或外部恢复。'}
      </p>
    </Experiment>
  );
}
