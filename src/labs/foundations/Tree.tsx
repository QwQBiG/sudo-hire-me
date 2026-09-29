import { SelectField } from '../../components/SelectField';
import { useEffect, useState } from 'react';
import { Pause, Play, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { demoTree, treeTraversal } from '../../domain/foundations.mjs';
import type { LabProps } from '../../types';
import './foundations.css';

const modes = { pre: '前序：根 → 左 → 右', in: '中序：左 → 根 → 右', post: '后序：左 → 右 → 根' };

export default function Tree({ reducedMotion }: LabProps) {
  const [order, setOrder] = useState<keyof typeof modes>('pre');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [guess, setGuess] = useState(false);
  const [feedback, setFeedback] = useState('');
  const sequence = treeTraversal(order);
  const nodes = Object.entries(demoTree);
  const done = step === sequence.length;
  useEffect(() => {
    if (!playing || done || reducedMotion) return;
    const timer = window.setTimeout(() => setStep((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [playing, step, done, reducedMotion]);
  const reset = () => {
    setStep(0);
    setPlaying(false);
    setFeedback('');
  };
  const choose = (id: string) => {
    if (!guess || done) return;
    if (sequence[step] === id) {
      setFeedback(`正确，下一个被访问的是 ${id}。`);
      setStep(step + 1);
    } else setFeedback(`${id} 还不是当前答案。按“${modes[order]}”递归处理当前子树。`);
  };
  return (
    <Experiment
      title="沿着二叉树找访问顺序"
      subtitle="左右子树位置固定，每次标记一个真正被访问的节点；字母只作标签，不代表排序规则。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          遍历规则
          <SelectField
            value={order}
            onChange={(e) => {
              setOrder(e.target.value as keyof typeof modes);
              reset();
            }}
          >
            {Object.entries(modes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </SelectField>
        </label>
        <label>
          <input
            type="checkbox"
            checked={guess}
            onChange={(e) => {
              setGuess(e.target.checked);
              reset();
            }}
          />
          预测下一个节点
        </label>
      </div>
      <div className="f-tree-scene">
        <svg
          viewBox="0 0 600 280"
          role="img"
          aria-label="A 的左孩子 B、右孩子 C；B 的孩子 D、E；C 的右孩子 F"
        >
          {nodes.flatMap(([id, node]) =>
            [node.left, node.right].filter(Boolean).map((child) => {
              const target = demoTree[child as keyof typeof demoTree];
              return (
                <line
                  key={`${id}-${child}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  className="f-tree-edge"
                />
              );
            }),
          )}
        </svg>
        {nodes.map(([id, node]) => {
          const visited = sequence.slice(0, step).includes(id);
          const active = sequence[step - 1] === id;
          return (
            <button
              key={id}
              className={`f-tree-node ${visited ? 'visited' : ''} ${active ? 'active' : ''}`}
              style={{ left: `${node.x / 6}%`, top: `${node.y / 2.8}%` }}
              aria-label={`节点 ${id}${visited ? '，已访问' : ''}`}
              disabled={!guess || done || visited}
              onClick={() => choose(id)}
            >
              {id}
              {visited && <small>{sequence.indexOf(id) + 1}</small>}
            </button>
          );
        })}
      </div>
      <div className="f-tree-output" aria-label="已访问序列">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={i < step ? 'filled' : ''}>
            {sequence[i] && i < step ? sequence[i] : '?'}
          </span>
        ))}
      </div>
      {!guess && (
        <div className="experiment-controls">
          <button
            className="primary"
            disabled={done || (playing && !reducedMotion)}
            onClick={() => setStep(step + 1)}
          >
            <StepForward size={16} />
            访问下一个
          </button>
          <button
            className="secondary"
            disabled={done || reducedMotion}
            onClick={() => setPlaying(!playing)}
          >
            {playing && !done ? <Pause size={16} /> : <Play size={16} />}
            {playing && !done ? '暂停' : '播放'}
          </button>
          {reducedMotion && <span>减少动效已开启，保留单步访问。</span>}
        </div>
      )}
      <p className="experiment-status" aria-live="polite">
        {guess
          ? feedback || `访问位置尚未确定；当前规则为${modes[order]}。`
          : step
            ? `第 ${step} 次访问：${sequence[step - 1]}。`
            : modes[order]}
        {done ? ` 完整序列：${sequence.join(' → ')}。` : ''}
      </p>
    </Experiment>
  );
}
