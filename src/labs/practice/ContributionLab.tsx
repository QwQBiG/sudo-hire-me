import { useState } from 'react';
import { ArrowRight, Check, CircleHelp, FileCheck2 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { assessContribution, contributionCases } from '../../domain/contribution.mjs';
import type { LabProps } from '../../types';
import './contribution.css';
import './practice-quality.css';

export default function ContributionLab({ lesson }: LabProps) {
  const initial = lesson.slug === 'open-source-contribution-story' ? 2 : 0;
  const [index, setIndex] = useState(initial);
  const [selected, setSelected] = useState('');
  const [solved, setSolved] = useState<string[]>([]);
  const scene = contributionCases[index];
  const result = selected ? assessContribution(scene.id, selected) : null;
  const reset = () => {
    setIndex(initial);
    setSelected('');
    setSolved([]);
  };
  const choose = (id: string) => {
    setSelected(id);
    if (assessContribution(scene.id, id).supported) {
      setSolved((old) => (old.includes(scene.id) ? old : [...old, scene.id]));
    }
  };
  return (
    <Experiment
      className="contribution-lab"
      title="把主张放到证据旁边"
      subtitle="阅读这组虚构记录，再挑出有证据支持、范围也准确的一句话。"
      onReset={reset}
    >
      <div className="contribution-progress">
        <span>
          证据判断 {solved.length}/{contributionCases.length}
        </span>
        <progress
          max={contributionCases.length}
          value={solved.length}
          aria-label="已完成的情境数量"
        />
      </div>
      <div className="contribution-tabs" role="group" aria-label="选择练习情境">
        {contributionCases.map((item, position) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={position === index}
            className={position === index ? 'is-current' : ''}
            onClick={() => {
              setIndex(position);
              setSelected('');
            }}
          >
            <span>{String(position + 1).padStart(2, '0')}</span>
            {item.title}
            {solved.includes(item.id) && <Check size={14} aria-label="已完成" />}
          </button>
        ))}
      </div>
      <p className="contribution-prompt">{scene.prompt}</p>
      <div className="contribution-layout">
        <section className="contribution-evidence" aria-label="已知证据">
          <h4>
            <FileCheck2 size={17} /> 已知记录
          </h4>
          {scene.evidence.map((item) => (
            <div key={item.id} className={result?.evidence.includes(item.id) ? 'is-relevant' : ''}>
              <small>{item.type}</small>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
        <section className="contribution-claims" aria-label="可选表述">
          <h4>
            <CircleHelp size={17} /> 哪句话站得住？
          </h4>
          {scene.claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              className={selected === claim.id ? 'is-selected' : ''}
              aria-pressed={selected === claim.id}
              onClick={() => choose(claim.id)}
            >
              <span>{claim.text}</span>
              {selected === claim.id && <ArrowRight size={17} />}
            </button>
          ))}
        </section>
      </div>
      <div
        className={`contribution-feedback ${result?.supported ? 'is-supported' : ''}`}
        aria-live="polite"
      >
        {result ? (
          <>
            <strong>{result.supported ? '这句话与证据相符' : '这句话越过了证据边界'}</strong>
            <p>{result.reason}</p>
          </>
        ) : (
          <p>选择一句表述，左侧会标出判断时用到的证据。</p>
        )}
      </div>
      {result?.supported && index < contributionCases.length - 1 && (
        <button
          className="contribution-next"
          type="button"
          onClick={() => {
            setIndex(index + 1);
            setSelected('');
          }}
        >
          下一种情境 <ArrowRight size={16} />
        </button>
      )}
    </Experiment>
  );
}
