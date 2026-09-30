import { useState } from 'react';
import { GitBranch, GitMerge, RotateCcw } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';

export default function GitWorkbench({ lesson }: LabProps) {
  const branches = lesson.slug === 'git-branch-merge-rebase';
  const [mode, setMode] = useState('fork');
  const [head, setHead] = useState('A+B');
  const [index, setIndex] = useState('A+B+C');
  const [working, setWorking] = useState('A+B+C+D');
  const [note, setNote] = useState(
    branches
      ? 'main 与 feature 从 A 分叉；选择整合方式，比较父子关系和提交身份。'
      : '当前 HEAD、暂存区和工作区各有不同内容。选择命令，观察它影响哪些位置。',
  );
  function reset() {
    setMode('fork');
    setHead('A+B');
    setIndex('A+B+C');
    setWorking('A+B+C+D');
    setNote('模型已恢复到初始 Git 状态。');
  }
  return (
    <Bench
      title={branches ? '让提交图说明 merge 与 rebase' : '把撤销操作落在正确的区域'}
      subtitle="只修改页面中的仓库模型，不执行真实 Git 命令。"
      onReset={reset}
    >
      {branches ? (
        <>
          <div className="git-graph">
            <svg viewBox="0 0 620 220" role="img" aria-label={`${mode} 提交关系`}>
              <path
                d={
                  mode === 'rebase'
                    ? 'M50 55 L250 55 L400 55 L550 55'
                    : 'M50 55 L250 55 M50 55 L200 150 L350 150'
                }
                fill="none"
                stroke="#bba6c5"
                strokeWidth="3"
              />
              {mode === 'merge' && (
                <path
                  d="M250 55 L550 55 M350 150 L550 55"
                  fill="none"
                  stroke="#a33e6c"
                  strokeWidth="3"
                />
              )}
              {(mode === 'rebase'
                ? [
                    [50, 55, 'A'],
                    [250, 55, 'B'],
                    [400, 55, 'C′'],
                    [550, 55, 'D′'],
                  ]
                : [
                    [50, 55, 'A'],
                    [250, 55, 'B'],
                    [200, 150, 'C'],
                    [350, 150, 'D'],
                    ...(mode === 'merge' ? [[550, 55, 'M']] : []),
                  ]
              ).map(([x, y, label]) => (
                <g key={label}>
                  <circle
                    cx={x}
                    cy={y}
                    r="22"
                    fill={label === 'M' ? '#a33e6c' : '#edf5fb'}
                    stroke="#a5bfd1"
                  />
                  <text
                    x={x}
                    y={Number(y) + 5}
                    textAnchor="middle"
                    fill={label === 'M' ? 'white' : '#36313e'}
                    fontSize="15"
                  >
                    {label}
                  </text>
                </g>
              ))}
              <text x="220" y="20" fontSize="12" fill="#756980">
                main → B
              </text>
              <text
                x={mode === 'fork' ? 310 : 490}
                y={mode === 'fork' ? 200 : 110}
                fontSize="12"
                fill="#a33e6c"
              >
                feature
              </text>
            </svg>
          </div>
          <div className="bench-actions">
            <button
              className="primary"
              onClick={() => {
                setMode('merge');
                setNote(
                  '在 feature 上合并 main：新提交 M 有父提交 D 和 B。C、D 身份保留；main 指针仍停在 B。',
                );
              }}
            >
              <GitMerge size={16} />
              feature merge main
            </button>
            <button
              className="secondary"
              onClick={() => {
                setMode('rebase');
                setNote(
                  '把 feature 的 C、D 重放到 B 后，生成 C′、D′。新父节点使提交身份改变；已经共享的历史应谨慎改写。',
                );
              }}
            >
              <GitBranch size={16} />
              feature rebase main
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="git-areas">
            {[
              ['HEAD', head],
              ['Index · 暂存区', index],
              ['Working tree', working],
            ].map(([name, value]) => (
              <div key={name}>
                <small>{name}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="bench-actions">
            <button
              className="secondary"
              onClick={() => {
                setWorking(index);
                setNote(
                  'git restore file：默认从暂存区恢复工作区，未暂存的 D 改动在这个模型中被丢弃。',
                );
              }}
            >
              restore 工作区
            </button>
            <button
              className="secondary"
              onClick={() => {
                setIndex(head);
                setNote('git restore --staged file：默认用 HEAD 恢复暂存区，工作区保留。');
              }}
            >
              restore --staged
            </button>
            <button
              className="secondary"
              onClick={() => {
                setHead('A');
                setNote('git reset --soft A：只移动当前分支 / HEAD，暂存区与工作区保持现状。');
              }}
            >
              reset --soft A
            </button>
            <button
              className="secondary"
              onClick={() => {
                setHead('A');
                setIndex('A');
                setNote('git reset A（mixed）：移动 HEAD 并更新暂存区，工作区不动。');
              }}
            >
              reset A
            </button>
            <button
              className="primary"
              onClick={() => {
                if (index !== head || working !== head)
                  return setNote(
                    '本示例要求先整理工作区与暂存区，避免把已有未提交内容混入 revert。',
                  );
                if (head !== 'A+B') return setNote('当前模型没有可撤销的 B 改动，重置实验后再试。');
                setHead('A（新提交 R）');
                setIndex('A（新提交 R）');
                setWorking('A（新提交 R）');
                setNote('revert B 创建新提交 R，内容逆转 B 的改动，B 仍保留在历史中。');
              }}
            >
              <RotateCcw size={16} />
              revert B
            </button>
          </div>
        </>
      )}
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
