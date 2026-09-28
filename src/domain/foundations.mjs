function integer(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}`);
  }
}

export function memoryLayout(width, count = 3, base = 100) {
  integer(width, 1, 8, 'width');
  integer(count, 1, 8, 'count');
  integer(base, 0, 1000, 'base');
  return Array.from({ length: width * count }, (_, i) => ({
    address: base + i,
    element: Math.floor(i / width),
    offset: i % width,
  }));
}

export function cpuState(completed, input = 7, addend = 3) {
  integer(completed, 0, 3, 'completed');
  integer(input, 0, 99, 'input');
  integer(addend, 0, 20, 'addend');
  return {
    pc: completed * 4,
    r1: completed === 0 ? 0 : input + (completed >= 2 ? addend : 0),
    source: input,
    destination: completed === 3 ? input + addend : 0,
  };
}

// Two fully associative lines, four array elements per line, least-recently-used replacement.
/** @param {number[]} accesses */
export function cacheTrace(accesses) {
  /** @type {number[]} */
  let resident = [];
  return accesses.map((index) => {
    integer(index, 0, 15, 'index');
    const block = Math.floor(index / 4);
    const hit = resident.includes(block);
    const evicted = !hit && resident.length === 2 ? resident[0] : null;
    resident = resident.filter((item) => item !== block);
    resident.push(block);
    if (resident.length > 2) resident.shift();
    return { index, block, hit, evicted, resident: [...resident] };
  });
}

export function operationCounts(n) {
  integer(n, 1, 64, 'n');
  return {
    constant: 1,
    halving: Math.floor(Math.log2(n)) + 1,
    linear: n,
    pairs: (n * (n - 1)) / 2,
    square: n * n,
  };
}

export function arrayInsertion(index, step) {
  integer(index, 0, 3, 'index');
  integer(step, 0, 4 - index, 'step');
  const slots = [10, 20, 30, null];
  const moves = 3 - index;
  for (let i = 0; i < Math.min(step, moves); i += 1) slots[3 - i] = slots[2 - i];
  if (step > moves) slots[index] = 15;
  return { slots, moves: Math.min(step, moves), done: step === moves + 1 };
}

export function containerAction(values, kind, action, value = '') {
  if (!['stack', 'queue'].includes(kind)) throw new TypeError('Unknown container');
  if (action === 'add') {
    if (values.length >= 6) throw new RangeError('Container is full');
    if (!value.trim()) throw new TypeError('Value must not be empty');
    return { values: [...values, value], removed: null };
  }
  if (action !== 'remove') throw new TypeError('Unknown action');
  if (!values.length) throw new RangeError('Container is empty');
  return kind === 'stack'
    ? { values: values.slice(0, -1), removed: values.at(-1) }
    : { values: values.slice(1), removed: values[0] };
}

/** @param {{ key: number, value: string }[]} entries */
export function hashBuckets(entries, capacity) {
  integer(capacity, 3, 10, 'capacity');
  /** @type {{ key: number, value: string }[][]} */
  const buckets = Array.from({ length: capacity }, () => []);
  for (const entry of entries) {
    integer(entry.key, 0, 999, 'key');
    const bucket = buckets[entry.key % capacity];
    const existing = bucket.findIndex((item) => item.key === entry.key);
    if (existing >= 0) bucket[existing] = { ...entry };
    else bucket.push({ ...entry });
  }
  return buckets;
}

export function factorialTrace(n) {
  integer(n, 0, 7, 'n');
  const frames = [];
  const trace = [{ frames: [], result: null, action: 'ready', value: n }];
  for (let value = n; value >= 0; value -= 1) {
    frames.push(value);
    trace.push({ frames: [...frames], result: null, action: 'call', value });
  }
  let result = 1;
  for (let value = 0; value <= n; value += 1) {
    if (value) result *= value;
    frames.pop();
    trace.push({ frames: [...frames], result, action: 'return', value });
  }
  return trace;
}

export const demoTree = {
  A: { left: 'B', right: 'C', x: 300, y: 45 },
  B: { left: 'D', right: 'E', x: 150, y: 140 },
  C: { left: null, right: 'F', x: 450, y: 140 },
  D: { left: null, right: null, x: 75, y: 235 },
  E: { left: null, right: null, x: 225, y: 235 },
  F: { left: null, right: null, x: 525, y: 235 },
};

export function treeTraversal(order) {
  if (!['pre', 'in', 'post'].includes(order)) throw new TypeError('Unknown traversal');
  const output = [];
  function visit(id) {
    if (!id) return;
    if (order === 'pre') output.push(id);
    visit(demoTree[id].left);
    if (order === 'in') output.push(id);
    visit(demoTree[id].right);
    if (order === 'post') output.push(id);
  }
  visit('A');
  return output;
}
