import { useState } from 'react';
import { Link2, Search, Waypoints } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  areConnected,
  componentGroups,
  createUnionState,
  findRoot,
  unionSets,
} from '../../domain/union-find.mjs';
import './algorithm-labs.css';
import { MechanismLinks } from './MechanismLinks';

const vertices = [0, 1, 2, 3, 4, 5];

export default function UnionFind() {
  const [state, setState] = useState(() => createUnionState());
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const groups = componentGroups(state);

  const reset = () => {
    setState(createUnionState());
    setA(0);
    setB(1);
  };

  return (
    <Experiment
      title="把元素归入连通分量"
      subtitle="选两个元素，合并或查询；下方父节点表会显示按规模合并与路径压缩。"
      onReset={reset}
    >
      <div className="uf-choices">
        {(
          [
            { label: '元素 A', selected: a, choose: setA },
            { label: '元素 B', selected: b, choose: setB },
          ] as const
        ).map((row) => (
          <div className="uf-choice-row" key={row.label}>
            <span>{row.label}</span>
            <div className="algo-segments" role="group" aria-label={row.label}>
              {vertices.map((vertex) => (
                <button
                  type="button"
                  key={vertex}
                  aria-pressed={row.selected === vertex}
                  onClick={() => row.choose(vertex)}
                >
                  {vertex}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="experiment-controls algo-actions uf-actions">
        <button
          type="button"
          className="primary"
          onClick={() => setState((current) => unionSets(current, a, b))}
        >
          <Link2 size={16} /> 合并 A、B
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setState((current) => areConnected(current, a, b).state)}
        >
          <Waypoints size={16} /> 查询连通
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setState((current) => findRoot(current, a).state)}
        >
          <Search size={16} /> find(A)
        </button>
      </div>
      <MechanismLinks
        nodes={vertices}
        links={Object.fromEntries(
          state.parent.map((parent: number, vertex: number) => [vertex, parent]),
        )}
        active={state.path}
        label={`父节点关系：${state.parent.map((parent: number, vertex: number) => `${vertex} 指向 ${parent}`).join('；')}`}
      />
      <div className="uf-workbench">
        <div>
          <h4>
            当前集合 <small>{state.components} 个</small>
          </h4>
          <div className="uf-groups" aria-label="连通分量">
            {groups.map((group: number[]) => (
              <div className="uf-group" key={group[0]}>
                {group.map((vertex) => (
                  <span key={vertex}>{vertex}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4>
            父节点表 <small>根节点指向自己</small>
          </h4>
          <div className="uf-parent-table">
            {state.parent.map((parent: number, vertex: number) => (
              <div key={vertex} data-trace={(state.path as number[]).includes(vertex)}>
                <span>{vertex}</span>
                <strong>→ {parent}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {state.note}
      </p>
      <p className="algo-footnote">
        根的规模记录在 size 中；压缩路径只改沿途父节点，不改变集合成员。
      </p>
    </Experiment>
  );
}
