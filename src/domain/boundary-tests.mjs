export const boundaryCandidates = [-1, 0, 1, 5, 9, 10, 11];

export const boundaryMutants = [
  {
    id: 'negative',
    name: '遗漏下界',
    description: '负数原样通过。',
    run: (value) => Math.min(value, 10),
  },
  {
    id: 'zero',
    name: '零值误判',
    description: '把零误算成一。',
    run: (value) => (value === 0 ? 1 : Math.min(10, Math.max(0, value))),
  },
  {
    id: 'upper',
    name: '上界差一',
    description: '到达上界时返回九。',
    run: (value) => (value >= 10 ? 9 : Math.max(0, value)),
  },
];

export const expectedClamp = (value) => Math.min(10, Math.max(0, value));

export function evaluateBoundaryTests(inputs) {
  if (!Array.isArray(inputs) || inputs.some((value) => !boundaryCandidates.includes(value))) {
    throw new Error('请选择候选输入');
  }
  const unique = [...new Set(inputs)];
  return boundaryMutants.map((mutant) => {
    const failures = unique
      .filter((input) => mutant.run(input) !== expectedClamp(input))
      .map((input) => ({ input, expected: expectedClamp(input), actual: mutant.run(input) }));
    return { id: mutant.id, name: mutant.name, description: mutant.description, failures };
  });
}
