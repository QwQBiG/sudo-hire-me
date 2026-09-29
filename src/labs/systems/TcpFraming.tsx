import { useState } from 'react';
import { ArrowRight, PlugZap } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  closeFramingStream,
  createFramingState,
  framingChunks,
  framingExpectedLength,
  framingMaxLength,
  pushFramingChunk,
} from '../../domain/tcp-framing.mjs';
import './mechanism-labs.css';

function hex(bytes: number[]) {
  return bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export default function TcpFraming() {
  const [state, setState] = useState(() => createFramingState());
  const next = framingChunks[state.chunksSeen];
  const expected = framingExpectedLength(state.buffer);
  return (
    <Experiment
      title="TCP 长度前缀拆帧台"
      subtitle="2 字节大端长度 · 最大正文 8 字节 · 读取边界任意"
      className="framing-lab"
      onReset={() => setState(createFramingState())}
    >
      <div className="framing-stream" aria-label="原始字节流">
        {framingChunks.map((chunk, index) => (
          <div key={index} data-seen={index < state.chunksSeen}>
            <small>read {index + 1}</small>
            <code>{hex(chunk)}</code>
          </div>
        ))}
      </div>
      <div className="mechanism-actions">
        <button
          disabled={!next || state.closed || Boolean(state.error)}
          onClick={() => next && setState((s) => pushFramingChunk(s, next))}
        >
          <ArrowRight size={15} /> 送入下一块
        </button>
        <button disabled={state.closed} onClick={() => setState(closeFramingStream)}>
          <PlugZap size={15} /> 模拟 EOF
        </button>
        <button
          disabled={state.closed || Boolean(state.error)}
          onClick={() => setState((s) => pushFramingChunk(s, [0, framingMaxLength + 1]))}
        >
          注入超长帧头
        </button>
      </div>
      <div className="framing-state">
        <section>
          <strong>未消费缓冲区</strong>
          <code>{hex(state.buffer) || '∅'}</code>
          <small>
            {expected === null ? '头部还不足 2 字节' : `当前帧正文需要 ${expected} 字节`}
          </small>
        </section>
        <section>
          <strong>已解析消息</strong>
          <ol>
            {state.messages.map((message, index) => (
              <li key={`${index}-${message}`}>{message || '空消息'}</li>
            ))}
          </ol>
        </section>
      </div>
      <div className="mechanism-result" aria-live="polite">
        <strong>{state.error ? '解析失败' : state.closed ? '连接已关闭' : '解析状态'}</strong>
        <p>{state.error || state.message}</p>
      </div>
    </Experiment>
  );
}
