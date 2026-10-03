import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback, Meter } from './Bench';
import './workbench-quality.css';

export default function Structures({ lesson }: LabProps) {
  const slug = lesson.slug;
  const [values, setValues] = useState<number[]>(
    slug === 'linear-search-first'
      ? [7, 2, 9, 2, 4, 6]
      : slug === 'binary-search-tree-operations'
        ? [5, 3, 8, 1, 4, 7, 9]
        : [],
  );
  const [input, setInput] = useState(2);
  const [capacity, setCapacity] = useState(4);
  const [moves, setMoves] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [note, setNote] = useState('选择数据并执行操作，观察存储结构如何变化。');
  function reset() {
    setValues(
      slug === 'linear-search-first'
        ? [7, 2, 9, 2, 4, 6]
        : slug === 'binary-search-tree-operations'
          ? [5, 3, 8, 1, 4, 7, 9]
          : [],
    );
    setCapacity(4);
    setMoves(0);
    setVisited([]);
    setInput(2);
    setNote('状态已重置。');
  }
  const titles: Record<string, string> = {
    'amortized-dynamic-array': '亲手触发一次扩容',
    'linear-search-first': '找到第一个匹配就停下来',
    'hash-collisions-resizing': '把键投进哈希桶',
    'binary-search-tree-operations': '沿二叉搜索树选择分支',
    'heap-top-k': '让最小候选站在淘汰口',
  };
  function add() {
    if (!Number.isInteger(input) || input < 0 || input > 99)
      return setNote('请输入 0..99 的整数。');
    if (values.length >= 12 && slug !== 'heap-top-k')
      return setNote('本轮最多展示 12 个元素，重置后继续。');
    if (slug === 'amortized-dynamic-array') {
      const full = values.length === capacity;
      setValues([...values, input]);
      if (full) setCapacity(capacity * 2);
      setMoves(moves + 1 + (full ? values.length : 0));
      setNote(
        full
          ? `容量 ${capacity} 已满：搬移 ${values.length} 个旧元素，追加 1 个新元素，容量扩大为 ${capacity * 2}。`
          : '尚有空位，本次只写入 1 个元素。',
      );
    } else if (slug === 'heap-top-k') {
      const next = [...values, input].sort((a, b) => a - b).slice(-3);
      const removed = values.length === 3 ? Math.min(input, values[0]) : null;
      setValues(next);
      setMoves(moves + 1);
      setNote(
        removed === null
          ? '候选不足 K=3，直接加入。'
          : `${input} 到达，与根节点 ${values[0]} 比较，淘汰 ${removed}。保留下来的三个候选就是当前最大的三个值。`,
      );
    } else {
      if (slug === 'binary-search-tree-operations' && values.includes(input))
        return setNote('本例不插入重复键。');
      setValues([...values, input]);
      setNote(
        slug === 'hash-collisions-resizing'
          ? `键 ${input} 进入桶 ${input % capacity}；同桶不同键通过链表共存。`
          : `键 ${input} 按比较结果插入空分支。`,
      );
    }
  }
  const treeNodes: { value: number; x: number; y: number; parent: number | null }[] = [];
  if (slug === 'binary-search-tree-operations') {
    const children = new Map<number, { left?: number; right?: number }>();
    for (const n of values) {
      children.set(n, {});
      if (n === values[0]) continue;
      let current = values[0];
      while (true) {
        const side = n < current ? 'left' : 'right';
        const next = children.get(current)![side];
        if (next === undefined) {
          children.get(current)![side] = n;
          break;
        }
        current = next;
      }
    }
    function layout(n: number, y: number, parent: number | null) {
      const rank = [...values].sort((a, b) => a - b).indexOf(n);
      treeNodes.push({ value: n, x: 40 + ((rank + 1) * 560) / (values.length + 1), y, parent });
      const kids = children.get(n)!;
      if (kids.left !== undefined) layout(kids.left, y + 65, n);
      if (kids.right !== undefined) layout(kids.right, y + 65, n);
    }
    if (values.length) layout(values[0], 32, null);
  }
  return (
    <Bench
      title={titles[slug]}
      subtitle={
        slug === 'heap-top-k'
          ? '固定 K=3；图中候选按升序排列，根为最小候选。'
          : '小规模可操作模型；可观察每次操作实际改变的结构。'
      }
      onReset={reset}
    >
      <div className="bench-controls">
        <label>
          {slug === 'linear-search-first' ? '查找目标' : '操作数值'}
          <input
            type="number"
            min={0}
            max={99}
            value={input}
            onChange={(e) => {
              setInput(Number(e.target.value));
              setVisited([]);
            }}
          />
        </label>
        {slug === 'hash-collisions-resizing' && (
          <label>
            桶数量：{capacity}
            <input
              type="range"
              min={2}
              max={8}
              value={capacity}
              onChange={(e) => {
                setCapacity(Number(e.target.value));
                setNote('更换桶数量后，每个键都必须重新计算取模位置，不能原封不动复制旧桶。');
              }}
            />
          </label>
        )}
      </div>
      {slug === 'hash-collisions-resizing' ? (
        <div className="hash-workbench">
          {Array.from({ length: capacity }, (_, i) => (
            <div key={i}>
              <code>{i}</code>
              <div>
                {values
                  .filter((v) => v % capacity === i)
                  .map((v, j) => (
                    <span key={`${v}-${j}`} className="bench-token" data-readout>
                      {v}
                    </span>
                  ))}
                {!values.some((v) => v % capacity === i) && <small>空桶</small>}
              </div>
            </div>
          ))}
        </div>
      ) : slug === 'binary-search-tree-operations' ? (
        <div className="tree-workbench">
          <svg
            viewBox={`0 0 640 ${Math.max(230, ...treeNodes.map((n) => n.y + 35))}`}
            role="img"
            aria-label="二叉搜索树结构"
          >
            {treeNodes
              .filter((n) => n.parent !== null)
              .map((n) => {
                const p = treeNodes.find((x) => x.value === n.parent)!;
                return (
                  <line
                    key={`edge-${n.value}`}
                    x1={p.x}
                    y1={p.y}
                    x2={n.x}
                    y2={n.y}
                    stroke="#c8b9cc"
                    strokeWidth="2"
                  />
                );
              })}
            {treeNodes.map((n) => (
              <g key={n.value}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="20"
                  fill={visited.includes(n.value) ? '#a33e6c' : '#eef6fb'}
                  stroke="#9abbd0"
                />
                <text
                  x={n.x}
                  y={n.y + 5}
                  textAnchor="middle"
                  fill={visited.includes(n.value) ? 'white' : '#36313e'}
                  fontSize="14"
                >
                  {n.value}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className="bench-tokens structure-slots">
          {Array.from(
            {
              length:
                slug === 'amortized-dynamic-array'
                  ? capacity
                  : slug === 'heap-top-k'
                    ? 3
                    : values.length,
            },
            (_, i) => (
              <button
                key={i}
                className={`bench-token ${visited.includes(i) ? 'active' : ''}`}
                disabled={
                  slug !== 'linear-search-first' || visited.some((j) => values[j] === input)
                }
                onClick={() => {
                  if (i !== visited.length)
                    return setNote(
                      `顺序查找应检查下标 ${visited.length}，否则不能证明找到的是第一个匹配。`,
                    );
                  setVisited([...visited, i]);
                  setNote(
                    values[i] === input
                      ? `下标 ${i} 第一次匹配，停止查找。后面即使还有 ${input} 也不影响答案。`
                      : `a[${i}]=${values[i]} 与 ${input} 不同，继续检查下一个元素。`,
                  );
                }}
              >
                <small>{i}</small>
                {values[i] ?? '·'}
              </button>
            ),
          )}
        </div>
      )}
      <div className="quality-observation">
        <div>
          <small>{slug === 'heap-top-k' ? '已送入的元素' : '当前元素数量'}</small>
          <output>{slug === 'heap-top-k' ? moves : values.length}</output>
        </div>
        <div>
          <small>
            {slug === 'hash-collisions-resizing'
              ? '最长桶链'
              : slug === 'linear-search-first'
                ? '已比较元素'
                : slug === 'binary-search-tree-operations'
                  ? '查找路径长度'
                  : slug === 'heap-top-k'
                    ? '淘汰门槛（最小候选）'
                    : '未使用容量'}
          </small>
          <output>
            {slug === 'hash-collisions-resizing'
              ? Math.max(
                  0,
                  ...Array.from(
                    { length: capacity },
                    (_, i) => values.filter((v) => v % capacity === i).length,
                  ),
                )
              : slug === 'linear-search-first' || slug === 'binary-search-tree-operations'
                ? visited.length
                : slug === 'heap-top-k'
                  ? values.length === 3
                    ? values[0]
                    : '候选未满'
                  : capacity - values.length}
          </output>
        </div>
        {slug === 'linear-search-first' && (
          <div>
            <small>首次匹配下标</small>
            <output>
              {visited.find((i) => values[i] === input) ??
                (visited.length === values.length ? '不存在' : '尚未确定')}
            </output>
          </div>
        )}
      </div>
      {slug === 'heap-top-k' && (
        <div className="quality-heap" aria-label="三元素最小堆">
          <div className="heap-root">
            <small>堆顶 · 最小候选</small>
            <output>{values[0] ?? '空'}</output>
          </div>
          <div className="heap-children">
            {[1, 2].map((i) => (
              <div key={i}>
                <small>子节点 {i}</small>
                <output>{values[i] ?? '空'}</output>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bench-actions">
        {slug !== 'linear-search-first' && (
          <button className="primary" onClick={add}>
            <Plus size={16} /> {slug === 'heap-top-k' ? '送入数据' : '插入元素'}
          </button>
        )}
        {slug === 'binary-search-tree-operations' && (
          <>
            <button
              className="secondary"
              onClick={() => {
                const path: number[] = [];
                let n = treeNodes.find((x) => x.parent === null);
                while (n) {
                  path.push(n.value);
                  if (n.value === input) break;
                  const parent = n.value;
                  n = treeNodes.find(
                    (x) =>
                      x.parent === parent && (input < parent ? x.value < parent : x.value > parent),
                  );
                }
                setVisited(path);
                setNote(
                  n
                    ? `比较路径 ${path.join(' → ')}，找到 ${input}。`
                    : `比较路径 ${path.join(' → ')} 后到达空分支，目标不存在。`,
                );
              }}
            >
              <Search size={16} /> 查找
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (!values.includes(input)) return setNote('键不存在。');
                setValues(values.filter((v) => v !== input));
                setVisited([]);
                setNote(
                  '移除键后，本教学视图按剩余插入序列重建合法 BST；不是演示原地后继替换删除算法。',
                );
              }}
            >
              移除并重建
            </button>
          </>
        )}
      </div>
      {slug === 'amortized-dynamic-array' && (
        <Meter
          label={`累计写入 / 搬移 ${moves} 次；平均每次追加 ${(moves / Math.max(1, values.length)).toFixed(2)} 次`}
          value={values.length}
          max={capacity}
          suffix={` / ${capacity}`}
        />
      )}
      {slug === 'hash-collisions-resizing' && (
        <Meter
          label="负载因子 n / m"
          value={Number((values.length / capacity).toFixed(2))}
          max={3}
        />
      )}
      <Feedback>
        {slug === 'linear-search-first' &&
        visited.length === values.length &&
        !values.includes(input)
          ? `已比较全部 ${values.length} 个元素，没有匹配，返回不存在。`
          : note}
      </Feedback>
    </Bench>
  );
}
