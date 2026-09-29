import { useState } from 'react';
import { Check, Filter, ListFilter, X } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { assessTraceClaim, traceClaims, visibleTraceEvents } from '../../domain/log-trace.mjs';
import type { LabProps } from '../../types';
import './log-trace.css';

export default function LogTrace(_props: LabProps) {
  const [request, setRequest] = useState('all');
  const [focused, setFocused] = useState('');
  const [claim, setClaim] = useState('');
  const events = visibleTraceEvents(request);
  const selectedEvent = events.find((item) => `${item.at}-${item.request}` === focused);
  const result = claim ? assessTraceClaim(claim) : null;
  return (
    <Experiment
      className="log-trace-lab"
      title="从交错日志还原一次请求"
      subtitle="三条请求共享同一时间线。先筛出目标，再选出日志真正支持的结论。"
      onReset={() => {
        setRequest('all');
        setFocused('');
        setClaim('');
      }}
    >
      <div className="log-trace-layout">
        <section className="log-trace-console" aria-label="请求事件日志">
          <header>
            <span>
              <ListFilter size={16} /> 请求日志
            </span>
            <small>{events.length} 条事件</small>
          </header>
          <div className="log-trace-filters" aria-label="按请求筛选">
            <Filter size={15} />
            {['all', 'R17', 'R18', 'R19'].map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={request === id}
                className={request === id ? 'is-active' : ''}
                onClick={() => {
                  setRequest(id);
                  setFocused('');
                }}
              >
                {id === 'all' ? '全部' : id}
              </button>
            ))}
          </div>
          <div className="log-trace-events">
            {events.map((item) => {
              const key = `${item.at}-${item.request}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={`${focused === key ? 'is-focused' : ''} level-${item.level.toLowerCase()}`}
                  aria-pressed={focused === key}
                  onClick={() => setFocused(key)}
                >
                  <time>{item.at.slice(3)}</time>
                  <span className="log-trace-request">{item.request}</span>
                  <span className="log-trace-level">{item.level}</span>
                  <span className="log-trace-event">{item.event}</span>
                </button>
              );
            })}
          </div>
          <p className="log-trace-detail">
            {selectedEvent
              ? `${selectedEvent.request} · ${selectedEvent.event}：${selectedEvent.detail}`
              : '点选一条事件，查看它记录的具体信息。'}
          </p>
        </section>
        <section className="log-trace-claims" aria-label="证据判断">
          <span className="log-trace-eyebrow">EVIDENCE CHECK</span>
          <h4>哪句话有足够证据？</h4>
          <p>一条日志能定位失败阶段，但不一定能证明整个系统的根因。</p>
          <div>
            {traceClaims.map((item) => (
              <button
                key={item.id}
                type="button"
                className={claim === item.id ? 'is-selected' : ''}
                aria-pressed={claim === item.id}
                onClick={() => setClaim(item.id)}
              >
                {item.text}
              </button>
            ))}
          </div>
          <div
            className={`log-trace-feedback ${result?.supported ? 'is-supported' : ''}`}
            aria-live="polite"
          >
            {result ? (
              <>
                <span>{result.supported ? <Check size={16} /> : <X size={16} />}</span>
                {result.reason}
              </>
            ) : (
              '选择一句结论，检查它是否超出了日志能证明的范围。'
            )}
          </div>
        </section>
      </div>
    </Experiment>
  );
}
