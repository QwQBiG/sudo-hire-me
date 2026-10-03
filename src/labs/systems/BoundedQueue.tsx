import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, RotateCw } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  consumeBounded,
  createBoundedQueueState,
  produceBounded,
  queueCapacity,
  queueItems,
  retryBounded,
} from '../../domain/bounded-queue.mjs';
import './resilience-labs.css';
import './systems-quality.css';

export default function BoundedQueue() {
  const [state, setState] = useState(() => createBoundedQueueState());
  return (
    <Experiment
      title="两格生产—消费队列"
      subtitle="生产 A、B、C；队满的 C 不会自动进入缓冲区"
      className="bounded-queue-lab"
      onReset={() => setState(createBoundedQueueState())}
    >
      <div className="queue-flow">
        <div>
          <small>生产者下一项</small>
          <strong>{state.pending || queueItems[state.nextIndex] || '完成'}</strong>
        </div>
        <div className="queue-slots">
          {Array.from({ length: queueCapacity }, (_, index) => (
            <div key={index} data-filled={Boolean(state.queue[index])}>
              <small>槽 {index + 1}</small>
              <strong>{state.queue[index] || '空'}</strong>
            </div>
          ))}
        </div>
        <div>
          <small>已消费</small>
          <strong>{state.consumed.join(' → ') || '无'}</strong>
        </div>
      </div>
      <div className="system-capacity" data-full={state.queue.length === queueCapacity}>
        <span>{state.pending ? '生产者等待空位' : '缓冲区占用'}</span>
        <progress max={queueCapacity} value={state.queue.length} aria-label="队列占用容量" />
        <strong>
          {state.queue.length}/{queueCapacity}
        </strong>
      </div>
      <div className="resilience-actions">
        <button
          onClick={() => setState(produceBounded)}
          disabled={state.nextIndex >= queueItems.length && !state.pending}
        >
          <ArrowDownToLine size={15} /> 生产下一项
        </button>
        <button onClick={() => setState(consumeBounded)}>
          <ArrowUpFromLine size={15} /> 消费队首
        </button>
        <button onClick={() => setState(retryBounded)} disabled={!state.pending}>
          <RotateCw size={15} /> 重试等待项
        </button>
      </div>
      <div className="resilience-result" aria-live="polite">
        <strong>
          {state.pending
            ? `${state.pending} 正等待空位`
            : `队列 ${state.queue.length}/${queueCapacity}`}
        </strong>
        <p>{state.message}</p>
      </div>
    </Experiment>
  );
}
