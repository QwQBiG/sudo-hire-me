import { useState } from 'react';
import { ArrowDownToLine, ArrowLeft, CircleX, Send } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { advanceIoMode, createIoModeState } from '../../domain/io-mode.mjs';
import './io-mode.css';

const modes = [
  { id: 'blocking', title: '阻塞读', hint: '调用等待结果' },
  { id: 'nonblocking', title: '非阻塞读', hint: '立即返回状态' },
  { id: 'readiness', title: '就绪通知', hint: '先报可读再 read' },
  { id: 'async', title: '异步完成', hint: '先提交后收结果' },
];

const phaseLabels: Record<string, string> = {
  idle: '尚未读取',
  blocked: '调用中等待',
  waiting: '等待就绪',
  ready: '已就绪，未读取',
  pending: '请求已提交',
  completed: '本次已完成',
};

export default function IoMode() {
  const [state, setState] = useState(() => createIoModeState());
  const readLabel =
    state.mode === 'readiness'
      ? state.phase === 'ready'
        ? '执行 read'
        : '等待就绪'
      : state.mode === 'async'
        ? '提交读取'
        : '尝试 read';

  function changeMode(mode: string) {
    setState(createIoModeState(mode));
  }
  function act(action: string) {
    setState((previous) => advanceIoMode(previous, action));
  }

  return (
    <Experiment
      title="空管道读操作台"
      subtitle="固定读端、一个写端和消息 OK；异步列只演示提交与完成语义。"
      className="io-mode-lab"
      onReset={() => setState(createIoModeState(state.mode))}
    >
      <div className="io-modes" role="group" aria-label="选择 I/O 方式">
        {modes.map((mode) => (
          <button
            key={mode.id}
            aria-pressed={state.mode === mode.id}
            onClick={() => changeMode(mode.id)}
          >
            <strong>{mode.title}</strong>
            <small>{mode.hint}</small>
          </button>
        ))}
      </div>

      <div className="io-pipeline" aria-label="读者、管道缓冲区和写者的当前状态">
        <div className="io-actor io-reader" data-active={state.phase !== 'idle'}>
          <small>读者</small>
          <strong>{phaseLabels[state.phase]}</strong>
          <span>{state.outcome || '尚无读取结果'}</span>
        </div>
        <ArrowLeft className="io-arrow" size={19} aria-hidden="true" />
        <div className="io-buffer" data-filled={Boolean(state.buffer)}>
          <small>内核管道缓冲区</small>
          <strong>{state.buffer || '空'}</strong>
          <span>{state.buffer ? '2 字节待取' : '当前没有数据'}</span>
        </div>
        <ArrowLeft className="io-arrow" size={19} aria-hidden="true" />
        <div className="io-actor io-writer" data-open={state.writerOpen}>
          <small>写者</small>
          <strong>{state.writerOpen ? '写端打开' : '写端已关'}</strong>
          <span>{state.writerOpen ? '可写入 OK' : '不会再有新数据'}</span>
        </div>
      </div>

      <div className="io-actions">
        <button
          onClick={() => act('read')}
          disabled={state.mode !== 'nonblocking' && state.phase === 'completed'}
        >
          <ArrowDownToLine size={16} />
          {readLabel}
        </button>
        <button
          onClick={() => act('write')}
          disabled={
            !state.writerOpen ||
            Boolean(state.buffer) ||
            (state.phase === 'completed' && state.mode !== 'nonblocking')
          }
        >
          <Send size={16} />
          写入 OK
        </button>
        <button
          onClick={() => act('close')}
          disabled={
            !state.writerOpen || (state.phase === 'completed' && state.mode !== 'nonblocking')
          }
        >
          <CircleX size={16} />
          关闭写端
        </button>
        {state.mode === 'readiness' && (
          <button
            onClick={() => act('compete')}
            disabled={state.phase !== 'ready' || !state.buffer || !state.writerOpen}
          >
            另一读者抢先读
          </button>
        )}
      </div>

      <div className="io-feedback" aria-live="polite">
        <strong>{state.outcome || phaseLabels[state.phase]}</strong>
        <p>{state.message}</p>
      </div>
      <div className="io-events">
        <strong>事件记录</strong>
        {state.events.length ? (
          <ol>
            {state.events.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        ) : (
          <p>尚无事件，先尝试一次读取。</p>
        )}
      </div>
    </Experiment>
  );
}
