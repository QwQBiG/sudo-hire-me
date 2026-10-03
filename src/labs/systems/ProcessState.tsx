import { useId, useLayoutEffect, useRef, useState } from 'react';
import { BellRing, HardDriveDownload, Play, Square, Timer, UserPlus } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  advanceProcessState,
  createProcessState,
  processEvents,
  processPhases,
} from '../../domain/process-state.mjs';
import './process-state.css';
import './systems-quality.css';

const eventIcons = [UserPlus, Play, HardDriveDownload, BellRing, Timer, Square];

export default function ProcessState() {
  const [state, setState] = useState(() => createProcessState());
  const marker = useId().replaceAll(':', '');
  const map = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const element = map.current;
    if (!element) return;
    const measure = () => setCompact(element.clientWidth < 430);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const current = processPhases.find(({ id }) => id === state.phase);
  const [lastEvent, setLastEvent] = useState('');
  const positions: Record<string, [number, number]> = {
    new: compact ? [50, 100] : [60, 100],
    ready: compact ? [175, 100] : [190, 100],
    running: compact ? [300, 100] : [340, 100],
    terminated: compact ? [300, 235] : [470, 100],
    blocked: compact ? [150, 235] : [265, 235],
  };
  function act(event: (typeof processEvents)[number]) {
    setLastEvent(state.phase === event.from ? event.id : '');
    setState((previous) => advanceProcessState(previous, event.id));
  }

  return (
    <Experiment
      title="进程状态机"
      subtitle="五状态教学模型 · 单个执行流 · I/O 完成只恢复就绪资格"
      className="process-state-lab"
      onReset={() => {
        setState(createProcessState());
        setLastEvent('');
      }}
    >
      <div className="ps-map" ref={map}>
        <svg
          viewBox={compact ? '0 0 350 295' : '0 0 530 295'}
          role="img"
          aria-label={`进程状态图；当前${current?.label}。运行可退回就绪或等待 I/O，I/O 完成只返回就绪。`}
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" />
            </marker>
          </defs>
          {(compact
            ? [
                ['admit', 'M95 100H130', 112, 82, '创建'],
                ['dispatch', 'M220 100H255', 237, 82, '调度'],
                ['exit', 'M300 130V205', 321, 178, '完成'],
                ['preempt', 'M300 70C300 25 175 25 175 70', 237, 29, '时间片结束'],
                ['block', 'M270 130C270 160 215 185 180 205', 215, 172, '等待 I/O'],
                ['wake', 'M150 205C110 185 115 158 150 130', 92, 177, 'I/O 完成'],
              ]
            : [
                ['admit', 'M105 100H145', 125, 83, '创建'],
                ['dispatch', 'M235 100H295', 265, 83, '调度'],
                ['exit', 'M385 100H425', 405, 83, '完成'],
                ['preempt', 'M340 70C340 22 190 22 190 70', 265, 25, '时间片结束'],
                ['block', 'M340 130C340 175 300 175 285 205', 362, 177, '等待 I/O'],
                ['wake', 'M245 205C230 175 190 175 190 130', 158, 177, 'I/O 完成'],
              ]
          ).map(([id, d, x, y, label]) => (
            <g key={id}>
              <path d={String(d)} data-active={lastEvent === id} markerEnd={`url(#${marker})`} />
              <text x={Number(x)} y={Number(y)} textAnchor="middle" className="ps-route-label">
                {label}
              </text>
            </g>
          ))}
          {processPhases.map((phase) => {
            const [x, y] = positions[phase.id];
            return (
              <g key={phase.id} data-active={state.phase === phase.id}>
                <rect x={x - 45} y={y - 30} width="90" height="60" rx="6" />
                <text x={x} y={y + 5} textAnchor="middle">
                  {phase.label}
                </text>
                {state.phase === phase.id && (
                  <circle className="ps-process-token" cx={x} cy={y + 21} r="4" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ps-center" aria-live="polite">
        <span>当前状态</span>
        <strong>{current?.label}</strong>
        <p>
          {current?.reason}。{state.message}
        </p>
      </div>
      <div className="ps-actions" role="group" aria-label="触发进程事件">
        {processEvents.map((event, index) => {
          const Icon = eventIcons[index];
          return (
            <button
              key={event.id}
              data-valid={state.phase === event.from}
              title={`${event.label}：${processPhases.find(({ id }) => id === event.from)?.label} → ${processPhases.find(({ id }) => id === event.to)?.label}`}
              onClick={() => act(event)}
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
