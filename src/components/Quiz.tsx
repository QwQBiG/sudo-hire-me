import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { Markdown } from './Markdown';
import type { Lesson } from '../types';

export function Quiz({
  lesson,
  onAnswer,
}: {
  lesson: Lesson;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === lesson.quiz.answer;
  return (
    <section className="challenge">
      <div className="section-heading">
        <span className="eyebrow">CHECKPOINT</span>
        <span className="reward">+100 XP · 首次答对</span>
      </div>
      <h2>检验你的理解</h2>
      <p className="question">{lesson.quiz.prompt}</p>
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
            <span className="choice-letter">{'ABCD'[index]}</span>
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
        <h3>试着口述</h3>
        <Markdown>
          {lesson.sections.find((s) => s.title === '开放题')?.markdown ??
            '不用背原句，用自己的话解释这道题的原理。'}
        </Markdown>
      </div>
    </section>
  );
}
