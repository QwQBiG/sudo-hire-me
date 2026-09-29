import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ChevronsRight, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  bfsEdges,
  bfsGraph,
  canStepBfs,
  createBfsState,
  pathToTarget,
  stepBfs,
} from '../../domain/graph-bfs.mjs';
import './graph-bfs.css';

const positions: Record<string, { x: number; y: number }> = {
  A: { x: 12, y: 50 },
  B: { x: 34, y: 22 },
  C: { x: 34, y: 78 },
  D: { x: 58, y: 22 },
  E: { x: 58, y: 78 },
  F: { x: 82, y: 51 },
  X: { x: 83, y: 10 },
};
const vertices = Object.keys(bfsGraph);

export default function GraphBfs() {
  const [state, setState] = useState(() => createBfsState());
  const path = pathToTarget(state);
  const done = !canStepBfs(state);
  const targetResult = path
    ? `已找到：${path.join(' → ')}，最少经过 ${path.length - 1} 条边。`
    : done
      ? `${state.target} 从 ${state.start} 不可达。`
      : '目标尚未发现；继续处理队首。';

  const finish = () =>
    setState((current) => {
      let next = current;
      while (canStepBfs(next)) next = stepBfs(next);
      return next;
    });

  return (
    <Experiment
      title="从队首展开一张有环的图"
      subtitle="点选节点可改目标；颜色区分刚处理、已发现和未发现。X 与其他节点不连通。"
      onReset={() => setState(createBfsState(state.start, state.target))}
    >
      <div className="experiment-controls bfs-controls">
        <label>
          起点
          <SelectField
            value={state.start}
            onChange={(event) => setState(createBfsState(event.target.value, state.target))}
          >
            {vertices.map((vertex) => (
              <option value={vertex} key={vertex}>
                {vertex}
              </option>
            ))}
          </SelectField>
        </label>
        <label>
          目标
          <SelectField
            value={state.target}
            onChange={(event) => setState(createBfsState(state.start, event.target.value))}
          >
            {vertices.map((vertex) => (
              <option value={vertex} key={vertex}>
                {vertex}
              </option>
            ))}
          </SelectField>
        </label>
        <span className="bfs-legend">圆环表示当前目标；节点颜色表示搜索状态。</span>
      </div>
      <div className="bfs-workbench">
        <div className="bfs-map" role="group" aria-label="无向图；按顺序点击节点可设置目标">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {bfsEdges.map(([a, b]) => {
              const inPath = path?.some(
                (vertex: string, index: number) =>
                  index > 0 &&
                  ((path[index - 1] === a && vertex === b) ||
                    (path[index - 1] === b && vertex === a)),
              );
              return (
                <line
                  key={`${a}-${b}`}
                  x1={positions[a].x}
                  y1={positions[a].y}
                  x2={positions[b].x}
                  y2={positions[b].y}
                  data-path={Boolean(inPath)}
                />
              );
            })}
          </svg>
          {vertices.map((vertex) => {
            const phase =
              state.current === vertex
                ? 'current'
                : state.processed.includes(vertex)
                  ? 'processed'
                  : state.visited.includes(vertex)
                    ? 'discovered'
                    : 'idle';
            return (
              <button
                type="button"
                className="bfs-vertex"
                key={vertex}
                style={{ left: `${positions[vertex].x}%`, top: `${positions[vertex].y}%` }}
                data-phase={phase}
                data-target={state.target === vertex}
                aria-label={`顶点 ${vertex}，${phase === 'idle' ? '未发现' : phase === 'discovered' ? '已入队' : '已处理'}；设为目标`}
                aria-pressed={state.target === vertex}
                onClick={() => setState(createBfsState(state.start, vertex))}
              >
                {vertex}
              </button>
            );
          })}
        </div>
        <div className="bfs-trace">
          <div className="bfs-trace-row">
            <h4>
              队列 <small>左侧先出队</small>
            </h4>
            <div className="bfs-tokens" aria-label={`当前队列：${state.queue.join('、') || '空'}`}>
              {state.queue.length ? (
                state.queue.map((vertex: string) => <span key={vertex}>{vertex}</span>)
              ) : (
                <em>空</em>
              )}
            </div>
          </div>
          <div className="bfs-trace-row">
            <h4>发现顺序</h4>
            <p>{state.visited.join(' → ')}</p>
          </div>
          <div className="bfs-trace-row">
            <h4>已处理</h4>
            <p>{state.processed.join(' → ') || '尚未出队'}</p>
          </div>
          <div className="bfs-result" role="status">
            {targetResult}
          </div>
        </div>
      </div>
      <div className="experiment-controls bfs-actions">
        <button
          className="primary"
          disabled={done}
          onClick={() => setState((current) => (canStepBfs(current) ? stepBfs(current) : current))}
        >
          <StepForward size={16} />
          处理队首
        </button>
        <button className="secondary" disabled={done} onClick={finish}>
          <ChevronsRight size={16} />
          遍历可达部分
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.note}{' '}
        {state.current && state.ignored.length > 0
          ? `跳过已发现的 ${state.ignored.join('、')}。`
          : ''}
      </p>
    </Experiment>
  );
}
