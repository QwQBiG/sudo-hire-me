import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { createPredictor, observeBranch } from '../../domain/branch-predict.mjs';
import './branch-predict.css';

interface Outcome {
  predicted: boolean;
  taken: boolean;
  correct: boolean;
  before: number;
  after: number;
}
interface Predictor {
  bits: number;
  state: number;
  correct: number;
  total: number;
  history: Outcome[];
}

const twoBitLabels = ['强不跳', '弱不跳', '弱跳', '强跳'];

export default function BranchPredict() {
  const [one, setOne] = useState<Predictor>(() => createPredictor(1));
  const [two, setTwo] = useState<Predictor>(() => createPredictor(2));
  const latest = one.history.at(-1);

  function record(taken: boolean) {
    setOne(observeBranch(one, taken));
    setTwo(observeBranch(two, taken));
  }

  return (
    <Experiment
      className="branch-predict-lab"
      title="同一串分支，两种预测器"
      subtitle="固定一条分支：1 位记住上次结果；2 位采用 0–3 饱和计数，初始为弱不跳。点击实际结果，先预测再更新。"
      onReset={() => {
        setOne(createPredictor(1));
        setTwo(createPredictor(2));
      }}
    >
      <div className="branch-predict-controls">
        <button type="button" onClick={() => record(true)}>
          实际：跳转 T
        </button>
        <button type="button" onClick={() => record(false)}>
          实际：不跳 N
        </button>
      </div>
      <div className="branch-predict-lanes">
        <div>
          <small>1 位预测</small>
          <strong>{one.state ? '下次预测 T' : '下次预测 N'}</strong>
          <span>
            正确 {one.correct} / {one.total}
          </span>
        </div>
        <div>
          <small>2 位预测</small>
          <strong>{twoBitLabels[two.state]}</strong>
          <span>
            正确 {two.correct} / {two.total}
          </span>
        </div>
      </div>
      <div className="branch-predict-states" aria-label="两位饱和计数器状态">
        {twoBitLabels.map((label, index) => (
          <span key={label} className={two.state === index ? 'active' : ''}>
            {index}
            <small>{label}</small>
          </span>
        ))}
      </div>
      <div className="branch-predict-history" aria-label="分支结果与预测历史">
        {one.history.map((event, index) => (
          <div
            key={index}
            className={event.correct ? 'correct' : 'wrong'}
            title={`第 ${index + 1} 次：实际 ${event.taken ? 'T' : 'N'}，1 位预测 ${event.predicted ? 'T' : 'N'}，2 位预测 ${two.history[index].predicted ? 'T' : 'N'}`}
          >
            <strong>{event.taken ? 'T' : 'N'}</strong>
            <small>
              1位{event.correct ? '✓' : '×'} 2位{two.history[index].correct ? '✓' : '×'}
            </small>
          </div>
        ))}
      </div>
      <p className="experiment-status" role="status">
        {latest
          ? `本次实际 ${latest.taken ? '跳' : '不跳'}；1 位${latest.correct ? '预测正确' : '预测错误'}，2 位${two.history.at(-1)?.correct ? '预测正确' : '预测错误'}。`
          : '按 T、T、T、N、T，观察偶发一次不跳后两种预测器的差异。'}
      </p>
    </Experiment>
  );
}
