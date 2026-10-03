import { useId, useState } from 'react';
import { ChevronsRight, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  createDijkstraState,
  dijkstraGraph,
  dijkstraPath,
  dijkstraVertices,
  expectedDijkstraVertex,
  settleDijkstra,
} from '../../domain/dijkstra-path.mjs';
import './advanced-algorithms.css';
import './foundations-quality.css';

const coordinates: Record<string, [number, number]> = {
  A: [70, 165],
  B: [210, 55],
  C: [210, 265],
  D: [370, 165],
  E: [525, 165],
  X: [525, 55],
};

const edges = Object.entries(dijkstraGraph).flatMap(([from, neighbors]) =>
  neighbors.map(({ to, weight }: { to: string; weight: number }) => ({ from, to, weight })),
);

interface DijkstraState {
  target: string;
  distances: Record<string, number>;
  parents: Record<string, string | null>;
  settled: string[];
  last: { vertex: string; relaxations: { to: string; updated: boolean }[] } | null;
  done: boolean;
  feedback: string;
  note: string;
}

export default function DijkstraPath() {
  const marker = useId().replace(/:/g, '');
  const [state, setState] = useState<DijkstraState>(() => createDijkstraState());
  const expected = expectedDijkstraVertex(state);
  const path = dijkstraPath(state);
  const targetSettled = state.settled.includes(state.target);
  const result =
    targetSettled && path
      ? `最短路径 ${path.join(' → ')}，总权重 ${state.distances[state.target]}`
      : state.done
        ? `${state.target} 从 A 不可达`
        : `${state.target} 尚未定型`;
  const finish = () =>
    setState((current) => {
      let next = current;
      while (!next.done) next = settleDijkstra(next, expectedDijkstraVertex(next));
      return next;
    });
  return (
    <Experiment
      title="每轮定型一个最短距离"
      subtitle="点选当前暂定距离最小的节点；边权都非负，错误选择只提示不会定型。"
      onReset={() => setState(createDijkstraState(state.target))}
    >
      <div className="advanced-presets" role="group" aria-label="路径目标">
        {['E', 'X'].map((target) => (
          <button
            type="button"
            key={target}
            aria-pressed={state.target === target}
            onClick={() => setState(createDijkstraState(target))}
          >
            目标 {target}
          </button>
        ))}
      </div>
      <div className="dijkstra-board">
        <div className="foundation-dijkstra-map" role="group" aria-label="选择下一个定型的节点">
          <svg viewBox="0 0 600 330" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker
                id={marker}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="3"
                markerHeight="3"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8 Z" fill="#8692a4" />
              </marker>
            </defs>
            {edges.map(({ from, to, weight }) => {
              const [x1, y1] = coordinates[from];
              const [x2, y2] = coordinates[to];
              const length = Math.hypot(x2 - x1, y2 - y1);
              const inset = 40;
              const updated =
                state.last?.vertex === from &&
                state.last.relaxations.some((entry) => entry.to === to && entry.updated);
              const onPath =
                targetSettled &&
                path?.some(
                  (node: string, index: number) => node === from && path[index + 1] === to,
                );
              return (
                <g key={`${from}-${to}`} data-updated={updated} data-path={Boolean(onPath)}>
                  <line
                    x1={x1 + ((x2 - x1) * inset) / length}
                    y1={y1 + ((y2 - y1) * inset) / length}
                    x2={x2 - ((x2 - x1) * inset) / length}
                    y2={y2 - ((y2 - y1) * inset) / length}
                    markerEnd={`url(#${marker})`}
                  />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle">
                    {weight}
                  </text>
                </g>
              );
            })}
          </svg>
          {dijkstraVertices.map((vertex: string) => {
            const fixed = state.settled.includes(vertex);
            const distance = state.distances[vertex];
            return (
              <button
                type="button"
                key={vertex}
                disabled={state.done || fixed}
                className="dijkstra-vertex"
                style={{
                  left: `${coordinates[vertex][0] / 6}%`,
                  top: `${coordinates[vertex][1] / 3.3}%`,
                }}
                data-fixed={fixed}
                data-target={state.target === vertex}
                data-expected={expected === vertex}
                onClick={() => setState((current) => settleDijkstra(current, vertex))}
                aria-label={`节点 ${vertex}，${fixed ? '已定型' : '未定型'}，暂定距离 ${Number.isFinite(distance) ? distance : '无穷'}`}
              >
                <strong>{vertex}</strong>
                <span>{Number.isFinite(distance) ? distance : '∞'}</span>
                <small>前驱 {state.parents[vertex] ?? '—'}</small>
              </button>
            );
          })}
        </div>
        <div className="dijkstra-edges">
          <h4>
            有向边 <small>起点 → 终点 / 权重</small>
          </h4>
          <div>
            {edges.map(({ from, to, weight }) => {
              const inspected = state.last?.vertex === from;
              const updated =
                inspected &&
                Boolean(
                  state.last?.relaxations.some(
                    (entry: { to: string; updated: boolean }) => entry.to === to && entry.updated,
                  ),
                );
              return (
                <span key={`${from}-${to}`} data-inspected={inspected} data-updated={updated}>
                  {from} → {to} <b>{weight}</b>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="advanced-readout" role="status">
        <strong>{result}</strong>
      </div>
      <div className="experiment-controls advanced-actions">
        <button
          type="button"
          className="primary"
          disabled={state.done || expected === null}
          onClick={() =>
            setState((current) => settleDijkstra(current, expectedDijkstraVertex(current)))
          }
        >
          <StepForward size={16} /> 定型当前最小
        </button>
        <button type="button" className="secondary" disabled={state.done} onClick={finish}>
          <ChevronsRight size={16} /> 完成可达部分
        </button>
      </div>
      <p className="experiment-status" role="status">
        {state.feedback || state.note}
      </p>
    </Experiment>
  );
}
