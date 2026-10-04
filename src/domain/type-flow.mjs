/** @typedef {{x: number, y: number}} Point */
/** @typedef {number | string | Point} TypedItem */
/** @typedef {{valid: boolean, error: string, items: TypedItem[]}} TypedInput */
const smallInteger = (value) => Number.isInteger(value) && value >= -99 && value <= 99;
const pointValue = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length === 2 &&
  Object.hasOwn(value, 'x') &&
  Object.hasOwn(value, 'y') &&
  smallInteger(value.x) &&
  smallInteger(value.y);
const validString = (value) =>
  typeof value === 'string' &&
  value.length <= 8 &&
  [...value].every((character) => {
    const code = character.codePointAt(0);
    return code < 0xd800 || code > 0xdfff;
  });

/** @param {string} text @param {string} type @returns {TypedInput} */
export function typedInput(text, type) {
  if (!['int', 'text', 'point'].includes(type)) throw new RangeError('element type');
  const failure = {
    valid: false,
    error:
      '需要同类型的 JSON 数组，最多 8 项；整数范围 -99 到 99，字符串最多 8 个 UTF-16 单元。Point 仅含整数 x、y。',
    items: [],
  };
  if (typeof text !== 'string' || text.length > 240) return failure;
  let items;
  try {
    items = JSON.parse(text);
  } catch {
    return failure;
  }
  const accepts = type === 'int' ? smallInteger : type === 'text' ? validString : pointValue;
  if (!Array.isArray(items) || items.length > 8 || !items.every(accepts)) return failure;
  return { valid: true, error: '', items };
}

/** @param {TypedItem} a @param {TypedItem} b @param {string} type */
function compareItem(a, b, type) {
  if (type === 'int') return Math.sign(/** @type {number} */ (a) - /** @type {number} */ (b));
  if (type === 'point') {
    const p = /** @type {Point} */ (a),
      q = /** @type {Point} */ (b);
    return Math.sign(p.x - q.x || p.y - q.y);
  }
  const encoder = new TextEncoder(),
    x = encoder.encode(String(a)),
    y = encoder.encode(String(b));
  for (let i = 0; i < Math.min(x.length, y.length); i++)
    if (x[i] !== y[i]) return Math.sign(x[i] - y[i]);
  return Math.sign(x.length - y.length);
}

/** @param {string} text @param {string} type @param {string} operation @param {boolean} ordered */
export function genericFlow(text, type, operation, ordered = false) {
  if (!['first', 'max'].includes(operation) || typeof ordered !== 'boolean')
    throw new RangeError('generic operation');
  const input = typedInput(text, type);
  const permitted = operation === 'first' || type !== 'point' || ordered;
  const trace =
    /** @type {{index: number, comparedWith: number, order: number, selected: number}[]} */ ([]);
  let index = -1;
  if (input.valid && permitted && input.items.length) {
    index = 0;
    if (operation === 'max')
      for (let i = 1; i < input.items.length; i++) {
        const previous = index,
          order = compareItem(input.items[i], input.items[index], type);
        if (order >= 0) index = i;
        trace.push({ index: i, comparedWith: previous, order, selected: index });
      }
  }
  return { ...input, permitted, index, trace, value: index < 0 ? null : input.items[index] };
}

/** @param {TypedItem} value */
export function displayTyped(value) {
  return typeof value === 'object'
    ? `Point { x: ${value.x}, y: ${value.y} }`
    : JSON.stringify(value);
}

/** @param {string} text @param {string} rule @param {number} threshold @param {number} step @param {boolean} signature */
export function callbackFlow(text, rule, threshold = 3, step = 0, signature = true) {
  if (
    !['even', 'over3', 'context'].includes(rule) ||
    !Number.isInteger(threshold) ||
    threshold < -9 ||
    threshold > 9 ||
    !Number.isInteger(step) ||
    step < 0 ||
    step > 16 ||
    typeof signature !== 'boolean'
  )
    throw new RangeError('callback configuration');
  const input = typedInput(text, 'int');
  const items = /** @type {number[]} */ (input.items);
  const total = input.valid ? items.length * 2 : 0;
  if (input.valid && step > total) throw new RangeError('callback cursor');
  const completed = input.valid && signature ? Math.floor(step / 2) : 0;
  const matches = (value) =>
    rule === 'even' ? value % 2 === 0 : value > (rule === 'over3' ? 3 : threshold);
  let count = 0;
  const records = items.slice(0, completed).map((value, index) => {
    const matched = matches(value);
    if (matched) count++;
    return { index, value, matched, count };
  });
  const phase = !input.valid
    ? 'error'
    : !signature
      ? 'blocked'
      : step === total
        ? 'done'
        : step % 2
          ? 'predicate'
          : step === 0
            ? 'ready'
            : 'loop';
  return {
    ...input,
    total,
    completed,
    count,
    records,
    phase,
    current: completed < items.length ? items[completed] : null,
  };
}

export const directions = [
  { name: 'NORTH', value: 0, dx: 0, dy: 1 },
  { name: 'EAST', value: 1, dx: 1, dy: 0 },
  { name: 'SOUTH', value: 2, dx: 0, dy: -1 },
  { name: 'WEST', value: 3, dx: -1, dy: 0 },
];
/** @typedef {{direction: number, name: string, before: Point, after: Point, accepted: boolean, reason: string}} MoveRecord */
/** @typedef {{point: Point, records: MoveRecord[]}} PointState */
/** @returns {PointState} */
export function createPoint(x = 2, y = 3) {
  if (![x, y].every((value) => Number.isInteger(value) && Math.abs(value) <= 20))
    throw new RangeError('point coordinates');
  return { point: { x, y }, records: [] };
}
/** @param {PointState} state @param {number} direction @returns {PointState} */
export function movePoint(state, direction) {
  if (!Number.isInteger(direction) || direction < 0 || direction > 99)
    throw new RangeError('direction input');
  const rule = directions.find((entry) => entry.value === direction);
  const next = rule ? { x: state.point.x + rule.dx, y: state.point.y + rule.dy } : state.point;
  const accepted = !!rule && Math.abs(next.x) <= 20 && Math.abs(next.y) <= 20;
  const point = accepted ? next : state.point;
  const record = {
    direction,
    name: rule?.name ?? 'UNKNOWN',
    before: state.point,
    after: point,
    accepted,
    reason: !rule
      ? '未知方向：没有命名分支，坐标保持原值'
      : !accepted
        ? '达到演示坐标范围，不是 C 整数溢出'
        : '只更新对应坐标分量',
  };
  return { point, records: [...state.records.slice(-11), record] };
}

/** @param {Point} point */
export function pointWindow(point) {
  const x = Math.trunc(point.x / 5) * 5,
    y = Math.trunc(point.y / 5) * 5;
  return { minX: x - 4, maxX: x + 4, minY: y - 4, maxY: y + 4 };
}
