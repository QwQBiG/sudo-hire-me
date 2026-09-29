import { useState } from 'react';
import { BellRing, HardDriveDownload, Play, Square, Timer, UserPlus } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  advanceProcessState,
  createProcessState,
  processEvents,
  processPhases,
} from '../../domain/process-state.mjs';
import './process-state.css';

const eventIcons = [UserPlus, Play, HardDriveDownload, BellRing, Timer, Square];

export default function ProcessState() {
  const [state, setState] = useState(() => createProcessState());
  const current = processPhases.find(({ id }) => id === state.phase);

  return (
    <Experiment
      title="进程状态机"
      subtitle="五状态教学模型 · 单个执行流 · I/O 完成只恢复就绪资格"
      className="process-state-lab"
      onReset={() => setState(createProcessState())}
    >
      <div className="ps-rail" role="list" aria-label="进程的五种教学状态">
        {processPhases.map((phase, index) => (
          <div
            className="ps-node"
            data-active={state.phase === phase.id}
            key={phase.id}
            role="listitem"
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{phase.label}</strong>
            <small>{phase.reason}</small>
          </div>
        ))}
      </div>
      <div className="ps-center" aria-live="polite">
        <span>当前状态</span>
        <strong>{current?.label}</strong>
        <p>{state.message}</p>
      </div>
      <div className="ps-actions" role="group" aria-label="触发进程事件">
        {processEvents.map((event, index) => {
          const Icon = eventIcons[index];
          return (
            <button
              key={event.id}
              data-valid={state.phase === event.from}
              title={`${event.label}：${processPhases.find(({ id }) => id === event.from)?.label} → ${processPhases.find(({ id }) => id === event.to)?.label}`}
              onClick={() => setState((previous) => advanceProcessState(previous, event.id))}
            >
              <Icon size={16} aria-hidden="true" />
              {event.label}
            </button>
          );
        })}
      </div>
      <div className="ps-history">
        <strong>已发生的转换</strong>
        {state.events.length ? (
          <ol>
            {state.events.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        ) : (
          <p>尚未发生转换。</p>
        )}
      </div>
    </Experiment>
  );
}
