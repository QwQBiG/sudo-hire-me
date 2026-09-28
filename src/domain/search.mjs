export function binarySearchSteps(values, target) {
  if (
    !Array.isArray(values) ||
    !values.length ||
    values.length > 15 ||
    !Array.from(values).every(Number.isFinite) ||
    !Number.isFinite(target) ||
    values.some((value, index) => index > 0 && value < values[index - 1])
  ) {
    throw new Error('输入需为 1–15 个升序数字，目标必须是有限数值。');
  }
  const steps = [];
  let left = 0,
    right = values.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const comparison = values[mid] === target ? 'found' : values[mid] < target ? 'right' : 'left';
    steps.push({ left, right, mid, comparison, value: values[mid] });
    if (comparison === 'found') return steps;
    if (comparison === 'right') left = mid + 1;
    else right = mid - 1;
  }
  steps.push({ left, right, mid: -1, comparison: 'missing', value: null });
  return steps;
}

export function decodeByte(bits) {
  if (typeof bits !== 'string' || !/^[01]{8}$/.test(bits))
    throw new Error('Expected exactly eight bits');
  const unsigned = Number.parseInt(bits, 2);
  return { unsigned, signed: unsigned >= 128 ? unsigned - 256 : unsigned };
}
