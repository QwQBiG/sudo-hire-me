import { containerAction } from './foundations.mjs';

/** @typedef {{id: number, value: string}} QueueItem */
/** @typedef {{id: number, value: string, next: number | null}} QueueNode */
/** @typedef {{ logical: string[], slots: (QueueItem | null)[], head: number, size: number,
 * nodes: QueueNode[], lifo: string[], serial: number, violated: boolean,
 * records: {command: string, expected: string, array: string, linked: string, lifo: string, accepted: boolean}[] }} QueueContract */
/** @returns {QueueContract} */
export function createQueueContract() {
  return {
    logical: [],
    slots: [null, null, null, null],
    head: 0,
    size: 0,
    nodes: [],
    lifo: [],
    serial: 0,
    violated: false,
    records: [],
  };
}

/** @param {QueueContract} state @param {'enqueue' | 'dequeue'} action @param {string} value */
export function queueContractCommand(state, action, value = 'A') {
  if (!['enqueue', 'dequeue'].includes(action) || !['A', 'B', 'C', 'D'].includes(value))
    throw new RangeError('queue command');
  const next = {
    ...state,
    slots: [...state.slots],
    nodes: state.nodes.map((node) => ({ ...node })),
  };
  let expected = 'None',
    array = 'None',
    linked = 'None',
    lifo = 'None',
    accepted = true;
  if (action === 'enqueue') {
    if (state.size === 4) {
      expected = array = linked = lifo = 'Full';
      accepted = false;
    } else {
      const item = { id: state.serial, value };
      next.serial++;
      next.logical = containerAction(state.logical, 'queue', 'add', value).values;
      next.slots[(state.head + state.size) % 4] = item;
      next.size++;
      if (next.nodes.length) next.nodes[next.nodes.length - 1].next = item.id;
      next.nodes.push({ ...item, next: null });
      next.lifo = containerAction(state.lifo, 'stack', 'add', value).values;
      expected = array = linked = lifo = 'OK';
    }
  } else if (state.size) {
    const reference = containerAction(state.logical, 'queue', 'remove');
    expected = reference.removed;
    next.logical = reference.values;
    array = state.slots[state.head].value;
    next.slots[state.head] = null;
    next.head = (state.head + 1) % 4;
    next.size--;
    linked = state.nodes[0].value;
    next.nodes.shift();
    const stack = containerAction(state.lifo, 'stack', 'remove');
    lifo = stack.removed;
    next.lifo = stack.values;
    next.violated ||= lifo !== expected;
  }
  next.records = [
    ...state.records,
    {
      command: action === 'enqueue' ? `enqueue(${value})` : 'dequeue()',
      expected,
      array,
      linked,
      lifo,
      accepted,
    },
  ].slice(-8);
  return next;
}

export function initialShapeContract() {
  return {
    expected: { width: 1, height: 1 },
    actual: { width: 1, height: 1 },
    command: '初始状态',
  };
}
export function resizeShape(state, kind, dimension, value) {
  if (!['rectangle', 'square'].includes(kind) || !['width', 'height'].includes(dimension))
    throw new RangeError('shape operation');
  if (!Number.isInteger(value) || value < 1 || value > 8) throw new RangeError('dimension');
  return {
    expected: { ...state.expected, [dimension]: value },
    actual:
      kind === 'square' ? { width: value, height: value } : { ...state.actual, [dimension]: value },
    command: `set${dimension === 'width' ? 'Width' : 'Height'}(${value})`,
  };
}

const members = { Area: ['area'], Shape: ['color', 'kind'], Square: ['area', 'color', 'kind'] };
export function javaRoleCall(type, method, side = 3, color = 'red') {
  if (!Object.hasOwn(members, type) || !['area', 'color', 'kind'].includes(method))
    throw new RangeError('member');
  if (!Number.isInteger(side) || side < 1 || side > 8 || !['red', 'blue', 'pink'].includes(color))
    throw new RangeError('object');
  const allowed = members[type].includes(method);
  return {
    allowed,
    value: allowed
      ? method === 'area'
        ? side * side
        : method === 'color'
          ? color
          : 'square'
      : null,
    implementation: method === 'color' ? 'Shape.color()' : `Square.${method}()`,
  };
}
export function javaRoleConstruction(type) {
  if (!Object.hasOwn(members, type)) throw new RangeError('type');
  return {
    allowed: type === 'Square',
    reason:
      type === 'Area'
        ? '接口不能直接实例化'
        : type === 'Shape'
          ? '抽象类不能直接实例化'
          : '构造具体 Square，调用 Shape 构造器初始化 color',
  };
}
export function carDelegation(engine, method) {
  if (!['fuel', 'electric'].includes(engine) || !['start', 'move'].includes(method))
    throw new RangeError('car call');
  return method === 'move'
    ? { target: 'Vehicle.move()', value: 'moving' }
    : {
        target: `${engine === 'fuel' ? 'Engine' : 'ElectricEngine'}.start()`,
        value: engine === 'fuel' ? 'engine on' : 'electric engine on',
      };
}
