import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  MessageSquare,
  RotateCcw,
  X,
} from 'lucide-react';
import { Markdown } from './Markdown';
import type { Lesson } from '../types';

export function Quiz({
  lesson,
  onAnswer,
  note,
  onNoteChange,
  passed,
}: {
  lesson: Lesson;
  onAnswer: (correct: boolean) => void;
  note: string;
  onNoteChange: (note: string) => void;
  passed: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState(false);
  const correct = selected === lesson.quiz.answer;
  return (
    <section className="challenge">
      <div className="section-heading">
        <span className="eyebrow">CHECKPOINT</span>
        <span className="reward">{passed ? '已获得 100 XP' : '+100 XP · 首次答对'}</span>
      </div>
      <h2>检验你的理解</h2>
      <p className="question">{lesson.quiz.prompt}</p>
      <div className="challenge-status" aria-live="polite">
        <span>
          {submitted
            ? correct
              ? '选择题已通过'
              : '需要再想一想'
            : selected === null
              ? '尚未选择'
              : `已选 ${String.fromCharCode(65 + selected)}`}
        </span>
        <div aria-hidden="true">
          {['判断', '验证', '表达'].map((name, i) => (
            <span
              key={name}
              className={
                (i === 0 && selected !== null) || (i === 1 && submitted) || (i === 2 && note.trim())
                  ? 'reached'
                  : ''
              }
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <fieldset disabled={submitted}>
        <legend className="sr-only">选择一个答案</legend>
        {lesson.quiz.options.map((option, index) => (
          <label
            key={option}
            className={`choice ${selected === index ? 'selected' : ''} ${submitted && index === lesson.quiz.answer ? 'correct' : ''} ${submitted && selected === index && !correct ? 'incorrect' : ''}`}
          >
            <input
              type="radio"
              name="answer"
              checked={selected === index}
              onChange={() => setSelected(index)}
            />
            <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
            {submitted && index === lesson.quiz.answer && <Check size={18} />}
          </label>
        ))}
      </fieldset>
      {!submitted ? (
        <button
          className="primary"
          disabled={selected === null}
          onClick={() => {
            setSubmitted(true);
            onAnswer(correct);
          }}
        >
          提交答案 <ArrowRight size={17} />
        </button>
      ) : (
        <div className={`feedback ${correct ? 'success' : 'retry'}`} role="status">
          <h3>
            {correct ? <Check size={20} /> : <X size={20} />}
            {correct ? '回答正确。再把理由说出来。' : '差一点，看看推理在哪一步不同。'}
          </h3>
          <Markdown>{lesson.quiz.explanation}</Markdown>
          <button
            className="secondary"
            onClick={() => {
              setSubmitted(false);
              setSelected(null);
            }}
          >
            <RotateCcw size={16} />
            再练一次
          </button>
        </div>
      )}
      <div className="open-question">
        <h3>
          <MessageSquare size={19} />
          试着口述
        </h3>
        <Markdown>
          {lesson.sections.find((s) => s.title === '开放题')?.markdown ??
            '不用背原句，用自己的话解释这道题的原理。'}
        </Markdown>
        <label className="oral-draft" htmlFor="oral-draft">
          <span>我的理解</span>
          <textarea
            id="oral-draft"
            maxLength={5000}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="定义、原因、例子和适用边界……"
          />
          <small>{note.length} / 5000</small>
        </label>
        <button
          className="oral-reference-toggle"
          aria-expanded={reference}
          aria-controls="oral-reference"
          onClick={() => setReference(!reference)}
        >
          <BookOpen size={17} />
          参考短答
          <ChevronDown size={16} />
        </button>
        {reference && (
          <div id="oral-reference" className="oral-reference">
            <Markdown>
              {lesson.sections.find((section) => section.title === '面试回答')?.markdown ?? ''}
            </Markdown>
          </div>
        )}
      </div>
    </section>
  );
}
