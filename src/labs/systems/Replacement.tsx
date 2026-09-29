import { useState } from 'react';
import { StepBack, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { referenceTrace, replacementFrames } from '../../domain/replacement.mjs';
import './replacement.css';

export default function Replacement() {
  const [step, setStep] = useState(0);
  const fifo = replacementFrames('FIFO')[step];
  const lru = replacementFrames('LRU')[step];
  return (
    <Experiment
      title="同一串访问，两种页框命运"
      subtitle="三个空页框；访问引用串时，命中不算缺页，页框装满后才需要淘汰。"
      onReset={() => setStep(0)}
    >
      <div className="replacement-timeline" aria-label="依次访问的页号">
        {referenceTrace.map((page, index) => (
          <button
            key={index}
            data-active={step === index + 1}
            data-past={step > index + 1}
            aria-label={`第 ${index + 1} 次访问页 ${page}`}
            aria-pressed={step === index + 1}
            onClick={() => setStep(index + 1)}
          >
            <small>{index + 1}</small>
            <strong>{page}</strong>
          </button>
        ))}
      </div>
      <div className="replacement-lanes">
        {(
          [
            ['FIFO', fifo],
            ['LRU', lru],
          ] as const
        ).map(([name, frame]) => (
          <section className="replacement-lane" data-method={name} key={name}>
            <header>
              <h3>{name}</h3>
              <span>{step ? (frame.fault ? '缺页' : '命中') : '待访问'}</span>
            </header>
            <div className="replacement-frames" aria-label={`${name} 的三个页框`}>
              {frame.slots.map((page: number | null, index: number) => (
                <div key={index} data-current={step > 0 && page === frame.page}>
                  <small>页框 {index + 1}</small>
                  <strong>{page ?? '—'}</strong>
                </div>
              ))}
            </div>
            <p>{frame.note}</p>
            <div className="replacement-count">
              累计缺页 <strong>{frame.faults}</strong>
            </div>
          </section>
        ))}
      </div>
      <div className="experiment-controls replacement-actions">
        <button className="secondary" disabled={!step} onClick={() => setStep(step - 1)}>
          <StepBack size={16} />
          上一步
        </button>
        <button
          className="primary"
          disabled={step === referenceTrace.length}
          onClick={() => setStep(step + 1)}
        >
          <StepForward size={16} />
          下一次访问
        </button>
      </div>
      <p className="experiment-status" role="status">
        FIFO 按装入先后淘汰，命中不更新队列；LRU
        淘汰最久没有被访问的页。两种策略在同一输入上的缺页数不代表普遍优劣。
      </p>
    </Experiment>
  );
}
