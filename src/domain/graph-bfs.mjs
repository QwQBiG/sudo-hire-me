export const bfsGraph = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'E'],
  D: ['B', 'F'],
  E: ['B', 'C', 'F'],
  F: ['D', 'E'],
  X: [],
};

export const bfsEdges = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'D'],
  ['B', 'E'],
  ['C', 'E'],
  ['D', 'F'],
  ['E', 'F'],
];

export function createBfsState(start = 'A', target = 'F') {
  if (!Object.hasOwn(bfsGraph, start) || !Object.hasOwn(bfsGraph, target)) {
    throw new Error('Unknown graph vertex');
  }
  return {
    start,
    target,
    queue: [start],
    visited: [start],
    processed: /** @type {string[]} */ ([]),
    distances: { [start]: 0 },
    parents: { [start]: null },
    current: null,
    added: [start],
    ignored: [],
    note: `从 ${start} 出发：标记并入队，等待处理。`,
  };
}

export function canStepBfs(state) {
  return state.queue.length > 0;
}

export function stepBfs(state) {
  if (!canStepBfs(state)) throw new Error('BFS queue is empty');
  const [current, ...rest] = state.queue;
  const queue = [...rest];
  const visited = [...state.visited];
  const seen = new Set(visited);
  const distances = { ...state.distances };
  const parents = { ...state.parents };
  const added = [];
  const ignored = [];
  for (const neighbor of bfsGraph[current]) {
    if (seen.has(neighbor)) {
      ignored.push(neighbor);
      continue;
    }
    seen.add(neighbor);
    visited.push(neighbor);
    parents[neighbor] = current;
    distances[neighbor] = distances[current] + 1;
    queue.push(neighbor);
    added.push(neighbor);
  }
  const note = added.length
    ? `处理 ${current}：发现 ${added.join('、')} 并入队；已发现的邻点不会重复入队。`
    : `处理 ${current}：没有新的邻点入队。`;
  return {
    ...state,
    queue,
    visited,
    processed: [...state.processed, current],
    distances,
    parents,
    current,
    added,
    ignored,
    note,
  };
}

export function pathToTarget(state) {
  if (!state.visited.includes(state.target)) return null;
  const path = [];
  for (let node = state.target; node !== null; node = state.parents[node]) path.push(node);
  return path.reverse();
}
