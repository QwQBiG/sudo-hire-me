import { useState } from 'react';
import { Check, CornerDownRight } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';

export default function DynamicProgramming({ lesson }: LabProps) {
  const lcs = lesson.slug === 'dynamic-programming-lcs';
  const rows = lcs ? 5 : 1;
  const cols = 7;
  const initial = () =>
    Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j): number | null =>
        lcs ? (i === 0 || j === 0 ? 0 : null) : j < 2 ? 1 : null,
      ),
    );
  const [table, setTable] = useState(initial);
  const [cell, setCell] = useState<[number, number]>(lcs ? [1, 1] : [0, 2]);
  const [answer, setAnswer] = useState('');
  const [incorrect, setIncorrect] = useState(false);
  const solved =
    table.flat().filter((value) => value !== null).length - (lcs ? rows + cols - 1 : 2);
  const total = lcs ? (rows - 1) * (cols - 1) : cols - 2;
  const [note, setNote] = useState('选择空格，使用已完成的依赖计算它的值。');
  const a = 'ABCD';
  const b = 'ACBDEF';
  const [i, j] = cell;
  const dependencies = lcs
    ? a[i - 1] === b[j - 1]
      ? [[i - 1, j - 1]]
      : [
          [i - 1, j],
          [i, j - 1],
        ]
    : [
        [0, j - 1],
        [0, j - 2],
      ];
  const ready = dependencies.every(
    ([r, c]) => table[r]?.[c] !== null && table[r]?.[c] !== undefined,
  );
  const expected = ready
    ? lcs
      ? a[i - 1] === b[j - 1]
        ? table[i - 1][j - 1]! + 1
        : Math.max(table[i - 1][j]!, table[i][j - 1]!)
      : table[0][j - 1]! + table[0][j - 2]!
    : null;
  const formula = lcs
    ? a[i - 1] === b[j - 1]
      ? `'${a[i - 1]}' == '${b[j - 1]}' → dp[${i - 1}][${j - 1}] + 1`
      : `'${a[i - 1]}' != '${b[j - 1]}' → max(dp[${i - 1}][${j}], dp[${i}][${j - 1}])`
    : `ways[${j}] = ways[${j - 1}] + ways[${j - 2}]`;
  return (
    <Bench
      title={lcs ? '把子序列答案填进依赖网格' : '用已经解决的小问题搭起楼梯'}
      subtitle={
        lcs
          ? '固定字符串 ABCD 与 ACBDEF；dp[i][j] 记录两个前缀的 LCS 长度。'
          : '每次只能上 1 级或 2 级；约定 ways[0] = 1，ways[1] = 1。'
      }
      onReset={() => {
        setTable(initial());
        setAnswer('');
        setIncorrect(false);
        setCell(lcs ? [1, 1] : [0, 2]);
        setNote('网格已清空，边界条件保留。');
      }}
    >
      <div className="scene-score">
        <span>
          已解子问题{' '}
          <b>
            {solved} / {total}
          </b>
        </span>
        <span>
          {lcs ? '最终 LCS 长度' : '到达第 6 级的方案数'}{' '}
          <b data-readout>{table[rows - 1][cols - 1] ?? '?'}</b>
        </span>
      </div>
      <div
        className="dp-board"
        style={{ gridTemplateColumns: `28px repeat(${cols},minmax(0,1fr))` }}
      >
        <span />
        {Array.from({ length: cols }, (_, c) => (
          <span className="dp-axis" key={`h-${c}`}>
            {lcs ? (c === 0 ? '∅' : b[c - 1]) : c}
          </span>
        ))}
        {table.map((row, r) => (
          <div className="dp-row" key={r}>
            <span className="dp-axis">{lcs ? (r === 0 ? '∅' : a[r - 1]) : 'ways'}</span>
            {row.map((v, c) => (
              <button
                key={c}
                className={`${i === r && j === c ? 'selected' : ''} ${dependencies.some(([dr, dc]) => dr === r && dc === c) ? 'dependency' : ''} ${v !== null ? 'filled' : ''}`}
                disabled={lcs ? r === 0 || c === 0 : c < 2}
                onClick={() => {
                  setCell([r, c]);
                  setAnswer('');
                  setIncorrect(false);
                }}
                aria-label={`dp ${r} ${c}，${v ?? '待填'}`}
                data-readout
              >
                {v ?? '?'}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="dp-dependencies">
        {dependencies.map(([r, c]) => (
          <span key={`${r}-${c}`} className={table[r]?.[c] === null ? 'missing' : ''}>
            <small>{lcs ? `dp[${r}][${c}]` : `ways[${c}]`}</small>
            <strong>{table[r]?.[c] ?? '?'}</strong>
          </span>
        ))}
        <CornerDownRight size={19} />
        <span className="target">
          <small>{lcs ? `dp[${i}][${j}]` : `ways[${j}]`}</small>
          <strong>{table[i][j] ?? '?'}</strong>
        </span>
      </div>
      <div className="dp-equation">
        <CornerDownRight size={20} />
        <code>{formula}</code>
      </div>
      <form
        className="dp-entry"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return setNote('依赖格还未完成，先计算高亮位置。');
          if (answer.trim() === '' || Number(answer) !== expected) {
            setIncorrect(true);
            return setNote(
              lcs
                ? '这个值不符合递推关系，请检查高亮依赖以及相同 / 不同字符的分支。'
                : '这个值不符合递推关系：最后一步来自前一级或前两级，把两个高亮格的方案数相加。',
            );
          }
          setIncorrect(false);
          const nextTable = table.map((row, r) =>
            row.map((v, c) => (r === i && c === j ? expected : v)),
          );
          setTable(nextTable);
          const next = nextTable
            .flatMap((row, r) => row.map((value, c) => ({ value, r, c })))
            .find((entry) => entry.value === null);
          if (next) setCell([next.r, next.c]);
          setAnswer('');
          setNote(
            `${lcs ? `dp[${i}][${j}]` : `ways[${j}]`} = ${expected} 已写入，它可以被更大的子问题复用。`,
          );
        }}
      >
        <label>
          这个格子的值
          <input type="number" min={0} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </label>
        <button className="primary">
          <Check size={16} />
          写入并检查
        </button>
      </form>
      <Feedback good={ready && !incorrect}>{note}</Feedback>
    </Bench>
  );
}
