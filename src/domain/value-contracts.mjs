/** @typedef {{valid: boolean, error: string, items: number[], index: number, value: number | null}} EvenLookup */
/** @param {string} text @returns {EvenLookup} */
export function firstEvenModel(text) {
  const failure = {
    valid: false,
    error: '输入必须是最多 10 个 -99 到 99 的整数构成的 JSON 数组',
    items: [],
    index: -1,
    value: null,
  };
  if (typeof text !== 'string' || text.length > 120) return failure;
  let items;
  try {
    items = JSON.parse(text);
  } catch {
    return failure;
  }
  if (
    !Array.isArray(items) ||
    items.length > 10 ||
    !items.every((value) => Number.isInteger(value) && value >= -99 && value <= 99)
  )
    return failure;
  const index = items.findIndex((value) => value % 2 === 0);
  return { valid: true, error: '', items, index, value: index < 0 ? null : items[index] };
}

/** @param {EvenLookup} result @param {string} mode */
export function readEvenModel(result, mode) {
  if (!['match', 'fallback', 'unwrap'].includes(mode)) throw new RangeError('option mode');
  if (!result.valid) return { ok: false, branch: 'error', output: '解析错误，不是 None' };
  const found = result.index >= 0;
  return {
    ok: found || mode !== 'unwrap',
    branch: found ? 'some' : 'none',
    output: found
      ? String(result.value)
      : mode === 'match'
        ? '没有偶数'
        : mode === 'fallback'
          ? '0'
          : 'panic（模型）',
  };
}

export function kotlinNullModel(text, missing, mode, fallback = 0) {
  if (typeof text !== 'string' || text.length > 40 || typeof missing !== 'boolean')
    throw new TypeError('nullable input');
  if (
    !['safe', 'elvis', 'bang'].includes(mode) ||
    !Number.isInteger(fallback) ||
    fallback < 0 ||
    fallback > 9
  )
    throw new RangeError('nullable operation');
  return {
    input: missing ? 'null' : JSON.stringify(text),
    length: missing ? null : text.length,
    ok: !(missing && mode === 'bang'),
    fallbackUsed: missing && mode === 'elvis',
    output: missing
      ? mode === 'safe'
        ? 'null'
        : mode === 'elvis'
          ? String(fallback)
          : 'NullPointerException（模型）'
      : String(text.length),
    units: missing
      ? []
      : Array.from({ length: text.length }, (_, i) =>
          text.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'),
        ),
  };
}

/** @typedef {{object: string, hash: number, bucket: number, serial: number}} KeyEntry */
/** @typedef {{command: string, object: string, hash: number, bucket: number, found: boolean, added: boolean, visits: {object: string, sameHash: boolean, equal: boolean, storedHash: number}[]}} KeyProbe */
/** @typedef {{policy: string, mutable: boolean, values: Record<string,number>, entries: KeyEntry[], probe: KeyProbe | null}} KeySet */
/** @returns {KeySet} */
export function createKeySet(policy = 'value', mutable = false) {
  if (!['value', 'constant', 'identity'].includes(policy) || typeof mutable !== 'boolean')
    throw new RangeError('key configuration');
  return { policy, mutable, values: { a: 7, b: 7, c: 8 }, entries: [], probe: null };
}
/** @param {KeySet} state @param {string} object */
export function keyHash(state, object) {
  if (!Object.hasOwn(state.values, object)) throw new RangeError('key object');
  return state.policy === 'constant'
    ? 1
    : state.policy === 'identity'
      ? { a: 1, b: 5, c: 9 }[object]
      : state.values[object];
}
/** @param {KeySet} state @param {string} object @param {number} value @returns {KeySet} */
export function changeKey(state, object, value) {
  if (!Object.hasOwn(state.values, object) || !Number.isInteger(value) || value < 0 || value > 15)
    throw new RangeError('key value');
  if (!state.mutable && state.entries.some((entry) => entry.object === object))
    throw new Error('stored immutable key');
  return { ...state, values: { ...state.values, [object]: value }, probe: null };
}
/** @param {KeySet} state @param {string} object @param {string} command @returns {KeySet} */
export function keySetCommand(state, object, command) {
  if (!['add', 'contains'].includes(command)) throw new RangeError('set command');
  const hash = keyHash(state, object),
    bucket = hash % 4;
  const visits = [];
  let found = false;
  for (const entry of state.entries.filter((entry) => entry.bucket === bucket)) {
    const sameHash = entry.hash === hash;
    const equal =
      sameHash && (entry.object === object || state.values[entry.object] === state.values[object]);
    visits.push({ object: entry.object, sameHash, equal, storedHash: entry.hash });
    if (equal) {
      found = true;
      break;
    }
  }
  const added = command === 'add' && !found;
  return {
    ...state,
    entries: added
      ? [...state.entries, { object, hash, bucket, serial: state.entries.length }]
      : state.entries,
    probe: { command, object, hash, bucket, visits, found, added },
  };
}
