export const dijkstraGraph = {
  A: [
    { to: 'B', weight: 4 },
    { to: 'C', weight: 1 },
  ],
  B: [{ to: 'D', weight: 1 }],
  C: [
    { to: 'B', weight: 2 },
    { to: 'D', weight: 5 },
    { to: 'E', weight: 10 },
  ],
  D: [{ to: 'E', weight: 3 }],
  E: [],
  X: [],
};

export const dijkstraVertices = Object.keys(dijkstraGraph);

export function expectedDijkstraVertex(state) {
  let chosen = null;
  for (const vertex of dijkstraVertices) {
    if (state.settled.includes(vertex) || !Number.isFinite(state.distances[vertex])) continue;
    if (chosen === null || state.distances[vertex] < state.distances[chosen]) chosen = vertex;
  }
  return chosen;
}

export function createDijkstraState(target = 'E') {
  if (!Object.hasOwn(dijkstraGraph, target)) throw new Error('Unknown Dijkstra target');
  const distances = Object.fromEntries(
    dijkstraVertices.map((vertex) => [vertex, vertex === 'A' ? 0 : Infinity]),
  );
  const parents = Object.fromEntries(dijkstraVertices.map((vertex) => [vertex, null]));
  return {
    target,
    distances,
    parents,
    settled: [],
    last: null,
    done: false,
    feedback: '',
    note: '从 A 出发，先选择暂定距离为 0 的 A；∞ 表示尚无已知路径。',
  };
}

export function settleDijkstra(state, vertex) {
  if (!Object.hasOwn(dijkstraGraph, vertex)) throw new Error('Unknown Dijkstra vertex');
  if (state.done) throw new Error('Dijkstra search has finished');
  const expected = expectedDijkstraVertex(state);
  if (vertex !== expected) {
    return {
      ...state,
      feedback:
        expected === null
          ? '剩下的顶点都不可达，不可定型为有限距离。'
          : `当前最小的未定型距离属于 ${expected}，应先处理它。`,
    };
  }
  const distances = { ...state.distances };
  const parents = { ...state.parents };
  const relaxations = [];
  for (const { to, weight } of dijkstraGraph[vertex]) {
    if (state.settled.includes(to)) continue;
    const candidate = distances[vertex] + weight;
    const previous = distances[to];
    const updated = candidate < previous;
    if (updated) {
      distances[to] = candidate;
      parents[to] = vertex;
    }
    relaxations.push({ to, weight, previous, candidate, updated });
  }
  const settled = [...state.settled, vertex];
  const next = {
    ...state,
    distances,
    parents,
    settled,
    feedback: '',
    last: { vertex, relaxations },
    note: `${vertex} 的最短距离定型为 ${distances[vertex]}；检查 ${relaxations.length} 条出边。`,
  };
  return { ...next, done: expectedDijkstraVertex(next) === null };
}

export function dijkstraPath(state, target = state.target) {
  if (!Object.hasOwn(dijkstraGraph, target)) throw new Error('Unknown Dijkstra target');
  if (!Number.isFinite(state.distances[target])) return null;
  const path = [];
  for (let vertex = target; vertex !== null; vertex = state.parents[vertex]) path.push(vertex);
  return path.reverse();
}
