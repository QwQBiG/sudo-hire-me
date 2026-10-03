import { useState } from 'react';
import { ArrowDownToLine, ArrowRight, HardDriveDownload, Power, SquarePen } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { advanceIoBuffer, createIoBufferState } from '../../domain/io-buffer.mjs';
import './io-buffer.css';
import './systems-quality.css';

export default function IoBuffer() {
  const [state, setState] = useState(() => createIoBufferState());
  const act = (action: string) => setState((previous) => advanceIoBuffer(previous, action));

  return (
    <Experiment
      title="ABC 写入路径"
      subtitle="普通文件的最小保证模型；不模拟内核后台回写，也不执行真实磁盘 I/O。"
      className="io-buffer-lab"
      onReset={() => setState(createIoBufferState())}
    >
      <div className="iob-stages" aria-label="文件数据在三层中的状态">
        <div className="iob-stage iob-user" data-filled={Boolean(state.user)}>
          <small>01 · 应用内</small>
          <strong>stdio 缓冲</strong>
          <code>{state.user || '空'}</code>
          <span>用户态</span>
        </div>
        <ArrowRight size={20} aria-hidden="true" />
        <div className="iob-stage iob-kernel" data-filled={Boolean(state.kernel)}>
          <small>02 · 系统内</small>
          <strong>内核页缓存</strong>
          <code>{state.kernel || '空'}</code>
          <span>{state.dirty ? '脏 · 待同步' : state.kernel ? '已同步' : '暂无数据'}</span>
        </div>
        <ArrowRight size={20} aria-hidden="true" />
        <div className="iob-stage iob-disk" data-filled={Boolean(state.disk)}>
          <small>03 · 持久层</small>
          <strong>已确认持久</strong>
          <code>{state.disk || '空'}</code>
          <span>本模型的最小保证</span>
        </div>
      </div>
      <div className="iob-actions" role="group" aria-label="文件写入操作">
        <button disabled={Boolean(state.source) || state.crashed} onClick={() => act('fprintf')}>
          <SquarePen size={16} />
          fprintf("ABC")
        </button>
        <button disabled={Boolean(state.source) || state.crashed} onClick={() => act('write')}>
          <ArrowDownToLine size={16} />
          write(2) "ABC"
        </button>
        <button disabled={state.crashed} onClick={() => act('fflush')}>
          fflush(stream)
        </button>
        <button disabled={state.crashed} onClick={() => act('fsync')}>
          <HardDriveDownload size={16} />
          fsync(fd)
        </button>
        <button disabled={state.crashed} onClick={() => act('crash')}>
          <Power size={16} />
          模拟系统崩溃
        </button>
      </div>
      <div className="iob-feedback" aria-live="polite">
        <strong>
          {state.crashed
            ? '重启后'
            : state.dirty
              ? '仍有未同步修改'
              : state.disk
                ? 'ABC 已确认持久'
                : '尚无持久化保证'}
        </strong>
        <p>{state.message}</p>
      </div>
      <div className="iob-history">
        <strong>操作记录</strong>
        {state.events.length ? (
          <ol>
            {state.events.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        ) : (
          <p>尚未操作。</p>
        )}
      </div>
    </Experiment>
  );
}
