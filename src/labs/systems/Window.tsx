import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowDownToLine, RotateCw, Send } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  advanceWindow,
  canDeliver,
  canRetransmit,
  canSend,
  createWindowState,
  segmentData,
  windowSequence,
} from '../../domain/tcp-window.mjs';
import './window.css';
import './systems-quality.css';

export default function Window() {
  const [state, setState] = useState(() => createWindowState());
  const act = (action: 'send' | 'deliver' | 'retransmit') =>
    setState((current) => advanceWindow(current, action));
  const acknowledge = windowSequence(state.acked);
  const rightEdge = acknowledge + state.windowBytes;
  const stateOf = (index: number) => {
    if (index < state.acked) return 'acked';
    if (state.received.includes(index)) return 'buffered';
    if (state.queue.includes(index)) return 'network';
    if (index < state.next) return 'missing';
    return 'unsent';
  };
  const stateNames = {
    acked: '累计确认',
    buffered: '乱序暂存',
    network: '在途',
    missing: '未到达',
    unsent: '未发送',
  };

  return (
    <Experiment
      title="发送窗口里的八个字节"
      subtitle="连接已建立，单方向发送 ABCDEFGH；每段 2 B，收到一段就立即反馈累计 ACK。"
      onReset={() => setState(createWindowState(state.windowBytes, state.dropFirst))}
    >
      <div className="experiment-controls window-controls">
        <label>
          固定发送窗口上限
          <SelectField
            value={state.windowBytes}
            onChange={(event) =>
              setState(createWindowState(Number(event.target.value), state.dropFirst))
            }
          >
            <option value={2}>2 B · 一段</option>
            <option value={4}>4 B · 两段</option>
          </SelectField>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.dropFirst}
            onChange={(event) =>
              setState(createWindowState(state.windowBytes, event.target.checked))
            }
          />
          丢失第一段的首次发送
        </label>
      </div>
      <div className="window-metrics experiment-metrics">
        <div className="metric">
          <small>下一个新数据 seq</small>
          <strong>{windowSequence(state.next)}</strong>
        </div>
        <div className="metric">
          <small>累计 ACK</small>
          <strong>{acknowledge}</strong>
        </div>
        <div className="metric">
          <small>新数据窗口右边界</small>
          <strong>{rightEdge}</strong>
        </div>
      </div>
      <div className="window-legend" aria-hidden="true">
        {Object.entries(stateNames).map(([value, name]) => (
          <span key={value} data-state={value}>
            {name}
          </span>
        ))}
      </div>
      <div className="window-bytes" role="list" aria-label="按序号排列的八个数据字节">
        {Array.from({ length: 8 }, (_, offset) => {
          const index = Math.floor(offset / 2);
          const status = stateOf(index);
          return (
            <div
              role="listitem"
              key={offset}
              className="window-byte"
              data-state={status}
              aria-label={`序号 ${1000 + offset}，字节 ${segmentData[index][offset % 2]}，${stateNames[status]}`}
            >
              <small>{1000 + offset}</small>
              <strong>{segmentData[index][offset % 2]}</strong>
            </div>
          );
        })}
      </div>
      <div className="window-exchange">
        <section>
          <h3>发送方</h3>
          <p>
            未确认：
            {state.next === state.acked
              ? '无'
              : segmentData.slice(state.acked, state.next).join(' · ')}
          </p>
          <p>
            新数据只能落在 [{acknowledge}, {rightEdge}) 内。
          </p>
        </section>
        <div className="window-link" aria-hidden="true">
          →<span>报文</span>←<span>ACK</span>
        </div>
        <section>
          <h3>接收方</h3>
          <p>
            在途：
            {state.queue.length
              ? state.queue.map((index: number) => segmentData[index]).join(' · ')
              : '无'}
          </p>
          <p>
            乱序暂存：
            {state.received
              .filter((index: number) => index >= state.acked)
              .map((index: number) => segmentData[index])
              .join(' · ') || '无'}
          </p>
        </section>
      </div>
      <div className="experiment-controls window-actions">
        <button className="primary" disabled={!canSend(state)} onClick={() => act('send')}>
          <Send size={16} />
          发送下一段
        </button>
        <button className="secondary" disabled={!canDeliver(state)} onClick={() => act('deliver')}>
          <ArrowDownToLine size={16} />
          接收在途段
        </button>
        <button
          className="secondary"
          disabled={!canRetransmit(state)}
          onClick={() => act('retransmit')}
        >
          <RotateCw size={16} />
          模拟超时重传
        </button>
      </div>
      <ol className="window-events" aria-label="报文与确认记录" aria-live="polite">
        {state.events.length ? (
          state.events
            .slice(-6)
            .map((event: string, index: number) => (
              <li key={`${state.events.length}-${index}`}>{event}</li>
            ))
        ) : (
          <li>尚未发送应用数据。</li>
        )}
      </ol>
      <p className="experiment-status" role="status">
        {state.message} {state.acked === segmentData.length ? '八个字节均已累计确认。' : ''}{' '}
        此模型窗口固定，省略接收窗口动态通告、拥塞窗口和真实计时器。
      </p>
    </Experiment>
  );
}
