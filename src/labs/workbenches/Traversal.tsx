import { useId, useState } from 'react';
import { CornerUpLeft } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';

const treePoints = [
  { x: 50, y: 12 },
  { x: 23, y: 44 },
  { x: 77, y: 44 },
  { x: 12, y: 82 },
  { x: 40, y: 82 },
  { x: 77, y: 82 },
];
export default function Traversal({ lesson }: LabProps) {
  const markerId = useId();
  const topo = lesson.slug === 'topological-sort';
  const dfs = lesson.slug === 'graph-dfs';
  const points = topo
    ? [
        { x: 50, y: 8 },
        { x: 20, y: 34 },
        { x: 78, y: 34 },
        { x: 28, y: 62 },
        { x: 78, y: 62 },
        { x: 50, y: 90 },
      ]
    : treePoints;
  const [cycle, setCycle] = useState(false);
  const [hint, setHint] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [frontier, setFrontier] = useState([0]);
  const [note, setNote] = useState(
    topo ? '选择入度为 0 的节点，移走它及其出边。' : '从 A 开始，在图上选择下一个节点。',
  );
  const edges = topo
    ? [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], ...(cycle ? [[5, 0]] : [])]
    : [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], ...(dfs ? [[4, 2]] : [])];
  const neighbors = (n: number) => edges.filter(([a]) => a === n).map(([, b]) => b);
  const indegree = (n: number) => edges.filter(([a, b]) => b === n && !visited.includes(a)).length;
  const candidates = topo
    ? points.map((_, i) => i).filter((i) => !visited.includes(i) && indegree(i) === 0)
    : dfs
      ? visited.length
        ? neighbors(frontier.at(-1) ?? -1).filter((i) => !visited.includes(i))
        : [0]
      : frontier.slice(0, 1);
  function reset() {
    setVisited([]);
    setFrontier([0]);
    setNote('图与工作队列已重置。');
  }
  function choose(n: number) {
    if (visited.includes(n)) return setNote('该节点已经处理过，不重复输出。');
    if (!candidates.includes(n))
      return setNote(
        topo
          ? `${String.fromCharCode(65 + n)} 仍有 ${indegree(n)} 条来自未处理节点的入边，前置任务尚未完成。`
          : dfs
            ? '这不是当前栈顶的未访问邻居。没有可走邻居时应回退。'
            : `队首是 ${String.fromCharCode(65 + frontier[0])}，按层遍历要先处理队首。`,
      );
    setVisited([...visited, n]);
    if (!topo) {
      if (dfs) setFrontier(visited.length ? [...frontier, n] : [n]);
      else setFrontier([...frontier.slice(1), ...neighbors(n)]);
    }
    setNote(
      topo
        ? `移走 ${String.fromCharCode(65 + n)} 及其出边，其后继的入度减一。`
        : dfs
          ? `进入 ${String.fromCharCode(65 + n)}，继续寻找更深的未访问邻居。`
          : `${String.fromCharCode(65 + n)} 出队，把它的孩子从左到右加入队尾。`,
    );
  }
  return (
    <Bench
      title={
        topo
          ? '拆除依赖，释放可执行任务'
          : dfs
            ? '沿一条分支走深，再带着栈回退'
            : '让队列决定下一层先访问谁'
      }
      subtitle={
        topo
          ? '有向依赖图；可能有多个合法拓扑序，所有入度为 0 的选择都被接受。'
          : dfs
            ? '固定邻接关系，允许选择任意未访问邻居；栈表示当前搜索路径。'
            : '固定二叉树；入队次序为左孩子、右孩子。'
      }
      onReset={reset}
    >
      <div className="bench-controls">
        <label>
          <input type="checkbox" checked={hint} onChange={(e) => setHint(e.target.checked)} />
          显示可选节点
        </label>
        {topo && (
          <label>
            <input
              type="checkbox"
              checked={cycle}
              onChange={(e) => {
                setCycle(e.target.checked);
                reset();
              }}
            />
            加入 F → A，制造环
          </label>
        )}
      </div>
      <div className="traversal-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker
              id={markerId}
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0 L4 2 L0 4 Z" fill="#769bb5" />
            </marker>
          </defs>
          {edges.map(([a, b]) => (
            <polyline
              key={`${a}-${b}`}
              points={`${points[a].x},${points[a].y} ${(points[a].x + points[b].x) / 2},${(points[a].y + points[b].y) / 2} ${points[b].x},${points[b].y}`}
              fill="none"
              markerMid={topo || dfs ? `url(#${markerId})` : undefined}
              stroke={visited.includes(a) ? '#e3dce5' : '#9fb9cb'}
              strokeWidth=".5"
              strokeDasharray={topo ? '2 1' : undefined}
            />
          ))}
        </svg>
        {points.map((p, i) => (
          <button
            key={i}
            className={`traversal-node ${visited.includes(i) ? 'visited' : ''} ${hint && candidates.includes(i) ? 'candidate' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => choose(i)}
            aria-label={`访问节点 ${String.fromCharCode(65 + i)}${topo ? `，入度 ${indegree(i)}` : ''}`}
          >
            <b>{String.fromCharCode(65 + i)}</b>
            {topo && <small>入度 {indegree(i)}</small>}
          </button>
        ))}
      </div>
      <div className="bench-grid">
        <div>
          <div className="bench-label">
            {topo ? '可执行任务' : dfs ? '当前路径栈' : '工作队列：队首 → 队尾'}
          </div>
          <div className="bench-tokens">
            {(topo ? candidates : frontier).map((n, i) => (
              <span className="bench-token" key={i}>
                {String.fromCharCode(65 + n)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="bench-label">输出序列</div>
          <div className="bench-tokens">
            {visited.map((n) => (
              <span className="bench-token done" key={n}>
                {String.fromCharCode(65 + n)}
              </span>
            ))}
          </div>
        </div>
      </div>
      {dfs && (
        <div className="bench-actions">
          <button
            className="secondary"
            disabled={!visited.length || !frontier.length}
            onClick={() => {
              if (candidates.length)
                return setNote('当前节点还有未访问邻居，此时还不能结束这次深度搜索。');
              const last = frontier.at(-1)!;
              setFrontier(frontier.slice(0, -1));
              setNote(`${String.fromCharCode(65 + last)} 的分支已穷尽，弹栈返回。`);
            }}
          >
            <CornerUpLeft size={16} />
            返回父节点
          </button>
        </div>
      )}
      <Feedback good={!(topo && candidates.length === 0 && visited.length < 6)}>
        {topo && candidates.length === 0 && visited.length < 6
          ? '还剩节点却没有零入度节点，存在有向环，无法完成拓扑排序。'
          : visited.length === 6
            ? '所有节点已输出。' + (dfs ? '当前路径还可继续弹栈结束搜索。' : '')
            : note}
      </Feedback>
    </Bench>
  );
}
