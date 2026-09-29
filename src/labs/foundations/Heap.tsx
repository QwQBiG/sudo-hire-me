import { useState } from 'react';
import { StepBack, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { heapDatasets, removeMinFrames } from '../../domain/heap.mjs';
import './heap.css';

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
          <select
            value={dataset}
            onChange={(event) => {
              setDataset(event.target.value as keyof typeof heapDatasets);
              reset();
            }}
          >
            <option value="first">2、4、3、8、6、5、7</option>
            <option value="second">1、3、2、9、7、6、4</option>
          </select>
        </label>
        <span className="heap-step">
          {step + 1} / {frames.length}
        </span>
      </div>
      <div className="heap-scene" aria-label="最小堆的树形结构">
        {[0, 1, 2].map((level) => (
          <div className="heap-level" key={level}>
            {frame.values
              .slice(2 ** level - 1, 2 ** (level + 1) - 1)
              .map((value: number, offset: number) => {
                const index = 2 ** level - 1 + offset;
                return (
                  <div className="heap-node" data-active={frame.active === index} key={index}>
                    <small>下标 {index}</small>
                    <strong>{value}</strong>
                  </div>
                );
              })}
          </div>
        ))}
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
