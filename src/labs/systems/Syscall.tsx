import { useState } from 'react';
import { Play, LockKeyhole, Terminal } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { syscallFrames } from '../../domain/syscall.mjs';
import './syscall.css';
import './systems-quality.css';

export default function Syscall() {
  const [kind, setKind] = useState<'function' | 'read'>('read');
  const [waits, setWaits] = useState(false);
  const [index, setIndex] = useState(0);
  const frames = syscallFrames(kind, waits);
  const frame = frames[index];
  const next = frames[index + 1];
  const actions: Record<string, string> = {
    body: '执行函数体',
    entry: '调用 read',
    check: '检查读取条件',
    blocked: '阻塞 A',
    switch: '调度线程 B',
    wakeup: '送入两字节，唤醒 A',
    resume: '重新调度 A',
    return: '返回调用结果',
  };

  return (
    <Experiment
      title="沿权限边界走一次调用"
      subtitle="教学时间线：普通函数留在用户态；read 可进入内核，但不一定换线程。"
      onReset={() => setIndex(0)}
      className="syscall-lab"
    >
      <div className="syscall-choices">
        <div className="segmented" aria-label="调用类型">
          <button
            aria-pressed={kind === 'function'}
            onClick={() => {
              setKind('function');
              setIndex(0);
            }}
          >
            普通函数
          </button>
          <button
            aria-pressed={kind === 'read'}
            onClick={() => {
              setKind('read');
              setIndex(0);
            }}
          >
            read 请求
          </button>
        </div>
        <label>
          <input
            type="checkbox"
            checked={waits}
            disabled={kind !== 'read'}
            onChange={(event) => {
              setWaits(event.target.checked);
              setIndex(0);
            }}
          />
          数据未就绪，需要等待
        </label>
      </div>

      <div className="syscall-stage" aria-live="polite">
        <div className="syscall-level" data-active={frame.mode === 'user'}>
          <Terminal size={20} aria-hidden="true" />
          <div>
            <small>USER MODE · 受限权限</small>
            <strong>应用线程 {frame.mode === 'user' ? frame.thread : 'A'}</strong>
          </div>
          {frame.mode === 'user' && <span className="syscall-position">当前执行</span>}
        </div>
        <div className="syscall-divider">受控入口 / 返回边界</div>
        <div className="syscall-level syscall-kernel" data-active={frame.mode === 'kernel'}>
          <LockKeyhole size={20} aria-hidden="true" />
          <div>
            <small>KERNEL MODE · 受保护权限</small>
            <strong>内核服务</strong>
          </div>
          {frame.mode === 'kernel' && <span className="syscall-position">线程 A 的请求</span>}
        </div>
      </div>

      <div className="syscall-readout" aria-live="polite" aria-atomic="true">
        <div className="syscall-count">
          <span>
            步骤 {index + 1} / {frames.length}
          </span>
          <span>线程切换 {frame.switches} 次</span>
        </div>
        <h4>{frame.summary}</h4>
        <p>{frame.detail}</p>
      </div>

      <div className="syscall-events" aria-label="已发生的调用过程">
        {frames.slice(0, index + 1).map((item, position) => (
          <div key={item.phase} data-current={position === index}>
            <small>
              {item.mode === 'user' ? '用户态' : '内核态'} · {item.thread}
            </small>
            <span>{item.summary}</span>
          </div>
        ))}
      </div>
      <div className="syscall-actions">
        <button disabled={!next} onClick={() => setIndex(index + 1)}>
          <Play size={16} /> {next ? actions[next.phase] : '调用已返回'}
        </button>
      </div>
    </Experiment>
  );
}
