import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { StepBack, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { heapDatasets, removeMinFrames } from '../../domain/heap.mjs';
import './heap.css';

const positions = [
  [300, 45],
  [155, 130],
  [445, 130],
  [80, 220],
  [225, 220],
  [375, 220],
  [525, 220],
];

export default function Heap() {
  const [dataset, setDataset] = useState<keyof typeof heapDatasets>('first');
  const [step, setStep] = useState(0);
  const { removed, frames } = removeMinFrames(dataset);
  const frame = frames[step];
  const reset = () => setStep(0);
  return (
    <Experiment
      title="把最小值从堆顶取走"
      subtitle="数组下标从 0 开始；每一步显示删除堆顶后的下沉过程。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          初始最小堆
          <SelectField
            value={dataset}
            onChange={(event) => {
              setDataset(event.target.value as keyof typeof heapDatasets);
              reset();
            }}
          >
            <option value="first">2、4、3、8、6、5、7</option>
            <option value="second">1、3、2、9、7、6、4</option>
          </SelectField>
        </label>
        <span className="heap-step">
          {step + 1} / {frames.length}
        </span>
      </div>
      <div className="foundation-heap-map" aria-label="最小堆的树形结构">
        <svg viewBox="0 0 600 270" preserveAspectRatio="none" aria-hidden="true">
          {frame.values.slice(1).map((_: number, offset: number) => {
            const index = offset + 1;
            const parent = Math.floor((index - 1) / 2);
            return (
              <line
                key={index}
                x1={positions[parent][0]}
                y1={positions[parent][1]}
                x2={positions[index][0]}
                y2={positions[index][1]}
                data-active={frame.active === index || frame.active === parent}
              />
            );
          })}
        </svg>
        {frame.values.map((value: number, index: number) => (
          <div
            className="heap-node"
            data-active={frame.active === index}
            key={index}
            style={{ left: `${positions[index][0] / 6}%`, top: `${positions[index][1] / 2.7}%` }}
          >
            <small>下标 {index}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          当前处理下标 <strong>{frame.active ?? '—'}</strong>
        </span>
        {frame.active !== null && frame.active !== undefined && (
          <span>
            子节点：
            {[2 * frame.active + 1, 2 * frame.active + 2]
              .filter((index) => index < frame.values.length)
              .join('、') || '无'}
          </span>
        )}
        <span>
          {step === 0
            ? '初始最小堆，准备删除根节点'
            : step === frames.length - 1
              ? '下沉完成，最小堆性质恢复'
              : '删除后需沿子节点修复'}
        </span>
      </div>
      <div className="heap-array" aria-label="数组存储顺序">
        {frame.values.map((value: number, index: number) => (
          <span data-active={frame.active === index} key={index}>
            <small>{index}</small>
            <strong>{value}</strong>
          </span>
        ))}
      </div>
      <div className="experiment-metrics heap-metrics">
        <div className="metric">
          <small>取出的最小值</small>
          <strong>{step ? removed : '—'}</strong>
        </div>
        <div className="metric">
          <small>键比较</small>
          <strong>{frame.comparisons}</strong>
        </div>
      </div>
      <div className="experiment-controls heap-actions">
        <button className="secondary" disabled={!step} onClick={() => setStep(step - 1)}>
          <StepBack size={16} />
          上一步
        </button>
        <button
          className="primary"
          disabled={step === frames.length - 1}
          onClick={() => setStep(step + 1)}
        >
          <StepForward size={16} />
          下一步
        </button>
      </div>
      <p className="experiment-status" role="status">
        {frame.note} 父节点 i 的左右子节点下标分别是 2i+1、2i+2。
      </p>
    </Experiment>
  );
}
