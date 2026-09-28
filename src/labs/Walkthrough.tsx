import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Route, RotateCcw } from 'lucide-react';
import { Markdown } from '../components/Markdown';
import type { LabProps } from '../types';

export default function Walkthrough({ lesson }: LabProps) {
  const [index, setIndex] = useState(0);
  const step = lesson.steps[index];
  return (
    <section className="walkthrough" aria-label="例题逐步推演">
      <header className="walkthrough-heading">
        <span>
          <Route size={18} />
          例题推演
        </span>
        <span>
          {String(index + 1).padStart(2, '0')} / {String(lesson.steps.length).padStart(2, '0')}
        </span>
      </header>
      <ol className="step-track" aria-label="推演步骤">
        {lesson.steps.map((item, position) => (
          <li key={item.title} className={position < index ? 'visited' : ''}>
            <button
              aria-label={`第 ${position + 1} 步：${item.title}`}
              aria-current={position === index ? 'step' : undefined}
              onClick={() => setIndex(position)}
              title={item.title}
            >
              <span>{position < index ? <Check size={15} /> : position + 1}</span>
              <span>{item.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="step-stage" aria-live="polite" aria-atomic="true">
        <div key={index} className="step-content">
          <span className="eyebrow">STEP {String(index + 1).padStart(2, '0')}</span>
          <h3>{step.title}</h3>
          <Markdown>{step.markdown}</Markdown>
        </div>
      </div>
      <footer className="walkthrough-controls">
        <button
          className="icon-button"
          onClick={() => setIndex(0)}
          disabled={index === 0}
          aria-label="重新推演"
          title="重新推演"
        >
          <RotateCcw size={17} />
        </button>
        <div>
          <button
            className="icon-button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            aria-label="上一步"
            title="上一步"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="primary"
            disabled={index === lesson.steps.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            {index === lesson.steps.length - 1 ? '推演完成' : '下一步'}
            {index === lesson.steps.length - 1 ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>
        </div>
      </footer>
    </section>
  );
}
