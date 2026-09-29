export function createUnionState(count = 6) {
  if (!Number.isInteger(count) || count < 1 || count > 26) {
    throw new Error('Count must be an integer from 1 to 26');
  }
  return {
    parent: Array.from({ length: count }, (_, i) => i),
    size: Array(count).fill(1),
    components: count,
    note: '每个元素起初自成一个集合。',
    path: [],
  };
}

function checkVertex(state, vertex) {
  if (!Number.isInteger(vertex) || vertex < 0 || vertex >= state.parent.length) {
    throw new Error('Vertex is outside the disjoint set');
  }
}

export function findRoot(state, vertex) {
  checkVertex(state, vertex);
  const path = [vertex];
  let root = vertex;
  while (state.parent[root] !== root) {
    root = state.parent[root];
    path.push(root);
  }
  const parent = [...state.parent];
  for (const node of path) parent[node] = root;
  return {
    state: {
      ...state,
      parent,
      path,
      note: `find(${vertex}) 沿 ${path.join(' → ')} 找到根 ${root}，并压缩路径。`,
    },
    root,
  };
}

export function unionSets(state, a, b) {
  const first = findRoot(state, a);
  const second = findRoot(first.state, b);
  let left = first.root;
  let right = second.root;
  if (left === right) {
    return { ...second.state, note: `${a} 和 ${b} 已在同一集合；不重复合并。` };
  }
  if (second.state.size[left] < second.state.size[right]) [left, right] = [right, left];
  const parent = [...second.state.parent];
  const size = [...second.state.size];
  parent[right] = left;
  size[left] += size[right];
  return {
    ...second.state,
    parent,
    size,
    components: state.components - 1,
    path: [],
    note: `合并根 ${left} 与根 ${right}：令 parent[${right}] = ${left}。`,
  };
}

export function areConnected(state, a, b) {
  const first = findRoot(state, a);
  const second = findRoot(first.state, b);
  const connected = first.root === second.root;
  return {
    state: {
      ...second.state,
      note: `${a} 与 ${b}${connected ? '连通' : '不连通'}：根分别是 ${first.root}、${second.root}。`,
    },
    connected,
  };
}

export function componentGroups(state) {
  const groups = new Map();
  for (let i = 0; i < state.parent.length; i += 1) {
    let root = i;
    while (state.parent[root] !== root) root = state.parent[root];
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }
  return [...groups.values()];
}
