import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { operationCounts } from '../../domain/foundations.mjs';
import './foundations.css';

const curves = [
  { key: 'constant', label: '固定一次', order: 'Θ(1)', code: 'count += 1', color: '#a33e6c' },
  {
    key: 'halving',
    label: '反复减半',
    order: 'Θ(log n)',
    code: 'while (n > 0) n = floor(n / 2)',
    color: '#7562b3',
  },
  { key: 'linear', label: '扫描元素', order: 'Θ(n)', code: 'for i = 0..n-1', color: '#2e789b' },
  {
    key: 'pairs',
    label: '无序数对',
    order: 'Θ(n²)',
    code: 'for i = 0..n-1; for j = 0..i-1',
    color: '#ae7431',
  },
  {
    key: 'square',
    label: '双重全扫描',
    order: 'Θ(n²)',
    code: 'for i = 0..n-1; for j = 0..n-1',
    color: '#b95465',
  },
] as const;

export default function Complexity() {
  const [n, setN] = useState(8);
  const [selected, setSelected] = useState<(typeof curves)[number]['key']>('pairs');
  const counts = operationCounts(n);
  const curve = curves.find((item) => item.key === selected)!;
  const doubling = n <= 32 ? operationCounts(n * 2)[selected] : null;
  return (
    <Experiment
      title="把输入规模放大"
      subtitle="统计指定循环体的精确次数，不代表毫秒；图中纵轴采用 log₂(次数 + 1)。"
      onReset={() => {
        setN(8);
        setSelected('pairs');
      }}
    >
      <div className="experiment-controls">
        <label>
          输入规模 n
          <input
            type="range"
            min="1"
            max="64"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <output>{n}</output>
        </label>
      </div>
      <svg
        className="f-growth-chart"
        viewBox="0 0 620 230"
        role="img"
        aria-label={`规模 ${n} 的操作数增长曲线，当前选择 ${curve.label}`}
      >
        {[0, 4, 8, 12].map((power) => (
          <g key={power}>
            <line
              x1="42"
              x2="596"
              y1={200 - power * 14}
              y2={200 - power * 14}
              className="f-chart-grid"
            />
            <text x="4" y={204 - power * 14}>
              {2 ** power - 1}
            </text>
          </g>
        ))}
        {curves.map((item) => (
          <polyline
            key={item.key}
            fill="none"
            stroke={item.color}
            strokeWidth={item.key === selected ? 3.5 : 1.5}
            opacity={item.key === selected ? 1 : 0.45}
            points={Array.from(
              { length: 64 },
              (_, i) =>
                `${42 + i * 8.65},${200 - Math.log2(operationCounts(i + 1)[item.key] + 1) * 14}`,
            ).join(' ')}
          />
        ))}
        <line
          x1={42 + (n - 1) * 8.65}
          x2={42 + (n - 1) * 8.65}
          y1="24"
          y2="202"
          className="f-chart-cursor"
        />
        <circle
          cx={42 + (n - 1) * 8.65}
          cy={200 - Math.log2(counts[selected] + 1) * 14}
          r="5"
          fill={curve.color}
        />
        <text x="42" y="224">
          1
        </text>
        <text x="575" y="224">
          n = 64
        </text>
      </svg>
      <div className="f-growth-options">
        {curves.map((item) => (
          <button
            key={item.key}
            aria-pressed={selected === item.key}
            onClick={() => setSelected(item.key)}
          >
            <i style={{ background: item.color }} />
            <span>
              {item.label}
              <small>{item.order}</small>
            </span>
            <strong>{counts[item.key]}</strong>
          </button>
        ))}
      </div>
      <div className="f-growth-formula">
        <code>{curve.code}</code>
        <strong>{counts[selected]} 次</strong>
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          输入 <strong>{n}</strong> → <strong>{n <= 32 ? n * 2 : '超出范围'}</strong>
        </span>
        <span>
          操作 <strong>{counts[selected]}</strong> → <strong>{doubling ?? '—'}</strong>
        </span>
        <span>
          倍数{' '}
          <strong>
            {doubling !== null && counts[selected] > 0
              ? (doubling / counts[selected]).toFixed(2)
              : '—'}
          </strong>
        </span>
        <span>{curve.order} 描述增长阶，不是这次测得的时间</span>
      </div>
      <p className="experiment-status" aria-live="polite">
        {selected === 'pairs'
          ? `${n} × (${n} − 1) / 2 = ${counts.pairs}，不是 n² 次；但它与 n² 同阶。`
          : `这里的“${curve.label}”在 n = ${n} 时计数为 ${counts[selected]}。`}
        {doubling === null
          ? ' 翻倍后的规模超出本实验 64 的观察范围。'
          : ` n 翻倍到 ${n * 2} 后为 ${doubling} 次。`}
      </p>
    </Experiment>
  );
}
