export const bplusLeaves = [
  { id: 'left', keys: [5, 10, 15] },
  { id: 'middle', keys: [20, 25, 30] },
  { id: 'right', keys: [40, 45, 50] },
];

export function createBplusState() {
  return {
    mode: 'idle',
    visited: /** @type {string[]} */ ([]),
    results: /** @type {number[]} */ ([]),
    message: '选择等值查找或范围扫描。',
  };
}

function leafIndex(key) {
  return key < 20 ? 0 : key < 40 ? 1 : 2;
}

export function searchBplus(key) {
  if (!Number.isInteger(key)) throw new Error('key must be an integer');
  const leaf = bplusLeaves[leafIndex(key)];
  const found = leaf.keys.includes(key);
  return {
    mode: 'equal',
    visited: ['root', leaf.id],
    results: found ? [key] : [],
    message: `根节点导向${leaf.id}叶；${found ? `找到 ${key}` : `叶中没有 ${key}`}。`,
  };
}

export function rangeBplus(start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
    throw new Error('invalid range');
  }
  const first = leafIndex(start);
  const visited = ['root'];
  const results = [];
  for (let index = first; index < bplusLeaves.length; index += 1) {
    const leaf = bplusLeaves[index];
    visited.push(leaf.id);
    for (const key of leaf.keys) {
      if (key >= start && key <= end) results.push(key);
      if (key > end) {
        return {
          mode: 'range',
          visited,
          results,
          message: `从 ${start} 定位后按叶顺序扫描；遇到 ${key} 超出上界时停止。`,
        };
      }
    }
  }
  return { mode: 'range', visited, results, message: `从 ${start} 定位后扫描至右侧最后一片叶。` };
}
