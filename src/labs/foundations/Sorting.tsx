import { useEffect, useState } from 'react';
import { Pause, Play, StepBack, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { sortingDatasets, sortingFrames } from '../../domain/sorting.mjs';
import type { LabProps } from '../../types';
import './sorting.css';

const datasetNames = {
  equal: '相同键 · 2a、2b、1、3',
  sorted: '已经有序 · 1、2a、2b、3',
  reversed: '逆序 · 4、3、2、1',
};

export default function Sorting({ reducedMotion }: LabProps) {
  const [dataset, setDataset] = useState<keyof typeof datasetNames>('equal');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const insertion = sortingFrames('insertion', dataset);
  const selection = sortingFrames('selection', dataset);
  const finished = step === insertion.length - 1;

  useEffect(() => {
    if (!playing || finished || reducedMotion) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [playing, step, finished, reducedMotion]);

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };
  const lanes = [
    { name: '插入排序', kind: 'insertion', frame: insertion[step], metric: '搬移次数' },
    { name: '选择排序', kind: 'selection', frame: selection[step], metric: '交换次数' },
  ];
  const labels = (items: (typeof insertion)[number]['values']) =>
    items.map((item: { key: number; tag: string }) => `${item.key}${item.tag}`);
  const original = sortingDatasets[dataset];
  const equalOrder = (items: (typeof insertion)[number]['values']) =>
    labels(items.filter((item: { key: number }) => item.key === 2)).join(' → ');

  return (
    <Experiment
      title="让相同的键带着原始顺序跑一遍"
      subtitle="并排执行两种具体实现；每次前进一步是一次外层循环，不是同样长的机器时间。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          输入序列
          <select
            value={dataset}
            onChange={(event) => {
              setDataset(event.target.value as keyof typeof datasetNames);
              reset();
            }}
          >
            {Object.entries(datasetNames).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span className="sort-origin">原始编号 {labels(original).join(' · ')}</span>
      </div>
      <div
        className="sort-progress"
        aria-label={`已完成 ${step} 轮，共 ${insertion.length - 1} 轮`}
      >
        {insertion.slice(1).map((_, index) => (
          <span key={index} data-done={index < step} />
        ))}
      </div>
      <div className="sort-lanes">
        {lanes.map(({ name, kind, frame, metric }) => (
          <section className={`sort-lane ${kind}`} key={kind} aria-label={name}>
            <header>
              <h3>{name}</h3>
              <span>{step === 0 ? '待开始' : `第 ${step} 轮`}</span>
            </header>
            <div className="sort-bars" role="list" aria-label={`${name}当前顺序`}>
              {frame.values.map((item: { key: number; tag: string }, index: number) => (
                <div
                  role="listitem"
                  aria-label={`位置 ${index}，键 ${item.key}${item.tag ? `，原始编号 ${item.tag}` : ''}`}
                  className="sort-bar"
                  data-focus={frame.focus === index}
                  key={`${item.key}${item.tag}`}
                >
                  <div style={{ height: `${35 + item.key * 22}px` }} />
                  <strong>
                    {item.key}
                    {item.tag && <small>{item.tag}</small>}
                  </strong>
                </div>
              ))}
            </div>
            <p>{frame.note}</p>
            <div className="sort-metrics">
              <span>
                键比较 <strong>{frame.comparisons}</strong>
              </span>
              <span>
                {metric} <strong>{frame.changes}</strong>
              </span>
            </div>
            {dataset !== 'reversed' && <output>键 2 的先后：{equalOrder(frame.values)}</output>}
          </section>
        ))}
      </div>
      <div className="experiment-controls sort-actions">
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(step - 1);
          }}
        >
          <StepBack size={16} />
          上一轮
        </button>
        <button
          className="primary"
          disabled={finished || (playing && !reducedMotion)}
          onClick={() => setStep(step + 1)}
        >
          <StepForward size={16} />
          下一轮
        </button>
        <button
          className="secondary"
          disabled={finished || reducedMotion}
          onClick={() => setPlaying(!playing)}
        >
          {playing && !finished ? <Pause size={16} /> : <Play size={16} />}
          {playing && !finished ? '暂停' : '播放'}
        </button>
      </div>
      <p className="experiment-status" role="status">
        {step === 0
          ? '先观察相同键 2a 与 2b 的原始次序，再让两种算法各执行一轮。'
          : dataset === 'equal' && step >= 1
            ? `选择排序的首轮交换把 2a 移到 2b 后面；插入排序只移动严格更大的键，仍保持 2a 在 2b 前。`
            : `已完成 ${step} 轮。比较次数与数据搬移、交换次数是不同指标，不能直接相加当作运行时间。`}
        {reducedMotion ? ' 减少动效模式仍可手动前进。' : ''}
      </p>
    </Experiment>
  );
}
