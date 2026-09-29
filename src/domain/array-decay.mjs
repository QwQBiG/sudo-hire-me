export const arrayContexts = Object.freeze([
  { id: 'array', label: 'sizeof a', kind: 'array-size' },
  { id: 'parameter', label: 'sizeof p', kind: 'parameter-size' },
  { id: 'element-step', label: 'a + 1', kind: 'element-step' },
  { id: 'array-step', label: '&a + 1', kind: 'array-step' },
]);

export function describeArrayContext(
  context,
  elementCount = 3,
  elementBytes = 4,
  pointerBytes = 8,
) {
  if (!arrayContexts.some((item) => item.id === context)) throw new RangeError('unknown context');
  if (![elementCount, elementBytes, pointerBytes].every((n) => Number.isInteger(n) && n > 0)) {
    throw new RangeError('sizes must be positive integers');
  }
  const arrayBytes = elementCount * elementBytes;
  switch (context) {
    case 'array':
      return {
        expression: 'sizeof a',
        type: `int[${elementCount}]`,
        result: arrayBytes,
        unit: '字节',
        reason: 'sizeof 的操作数仍是完整数组对象。',
      };
    case 'parameter':
      return {
        expression: 'sizeof p',
        type: 'int *',
        result: pointerBytes,
        unit: '字节',
        reason: '数组形参已调整为指针形参；这里测量指针对象。',
      };
    case 'element-step':
      return {
        expression: 'a + 1',
        type: 'int *',
        result: elementBytes,
        unit: '字节步长',
        reason: 'a 在加法表达式中转换为指向首元素的 int *。',
      };
    default:
      return {
        expression: '&a + 1',
        type: `int (*)[${elementCount}]`,
        result: arrayBytes,
        unit: '字节步长',
        reason: '&a 是指向整个数组的指针；加 1 跨过一个数组。',
      };
  }
}
