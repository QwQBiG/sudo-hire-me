import { useState } from 'react';
import { ArrowRight, HardDrive, MemoryStick } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  advanceDma,
  configureDma,
  createDmaTransfer,
  doCpuWork,
  notifyDma,
} from '../../domain/dma-transfer.mjs';
import './dma-transfer.css';

interface DmaState {
  size: number;
  phase: string;
  moved: number;
  cpuWork: number;
  events: string[];
}

export default function DmaTransfer() {
  const [state, setState] = useState<DmaState>(() => createDmaTransfer());
  return (
    <Experiment
      className="dma-transfer-lab"
      title="谁在搬数据"
      subtitle="固定 4 个抽象数据块。CPU 负责配置，设备控制器推进搬运；点击 CPU 计算不会自动增加已搬运块数。"
      onReset={() => setState(createDmaTransfer())}
    >
      <div
        className="dma-transfer-path"
        aria-label={`设备已搬运 ${state.moved} / ${state.size} 块`}
      >
        <HardDrive aria-hidden="true" size={23} />
        <ArrowRight aria-hidden="true" size={20} />
        <div>
          {Array.from({ length: state.size }, (_, i) => (
            <span key={i} className={i < state.moved ? 'filled' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
        <ArrowRight aria-hidden="true" size={20} />
        <MemoryStick aria-hidden="true" size={23} />
      </div>
      <div className="foundation-dma-activity" aria-live="polite">
        <span>设备进度</span>
        <div className="foundation-capacity queue">
          {Array.from({ length: state.size }, (_, i) => (
            <i key={i} data-used={i < state.moved} />
          ))}
        </div>
        <span>CPU 独立任务</span>
        <output>{state.cpuWork} 次</output>
        <small>
          {state.phase === 'transferring'
            ? '两种进度分别推进，不代表真实时间或总线吞吐量'
            : state.phase === 'notified'
              ? '完成已确认'
              : '设备搬运与 CPU 计算分别记录'}
        </small>
      </div>
      <div className="dma-transfer-actions">
        <button
          type="button"
          disabled={state.phase !== 'idle'}
          onClick={() => setState(configureDma(state))}
        >
          1. CPU 配置并发起
        </button>
        <button
          type="button"
          disabled={state.phase !== 'transferring'}
          onClick={() => setState(advanceDma(state))}
        >
          2. 设备搬运一块
        </button>
        <button
          type="button"
          disabled={state.phase !== 'transferring'}
          onClick={() => setState(doCpuWork(state))}
        >
          CPU 做独立计算
        </button>
        <button
          type="button"
          disabled={state.phase !== 'completed'}
          onClick={() => setState(notifyDma(state))}
        >
          3. 完成通知
        </button>
      </div>
      <div className="dma-transfer-counts">
        <span>
          设备已搬{' '}
          <strong>
            {state.moved}/{state.size}
          </strong>
        </span>
        <span>
          CPU 独立计算 <strong>{state.cpuWork}</strong>
        </span>
      </div>
      <ol className="dma-transfer-events" aria-label="DMA 事件顺序">
        {state.events.map((event, index) => (
          <li key={index}>
            <small>{String(index + 1).padStart(2, '0')}</small>
            {event}
          </li>
        ))}
      </ol>
      <p className="experiment-status" role="status">
        {state.phase === 'idle'
          ? '先配置缓冲区与设备，才能开始传输。'
          : state.phase === 'transferring'
            ? `设备仍在搬运；CPU 已做 ${state.cpuWork} 次独立计算，不代表数据已完成。`
            : state.phase === 'completed'
              ? '数据块已经搬完，尚需完成通知或轮询确认后再使用结果。'
              : '完成通知已处理；实际驱动还需考虑地址映射、同步与错误处理。'}
      </p>
    </Experiment>
  );
}
