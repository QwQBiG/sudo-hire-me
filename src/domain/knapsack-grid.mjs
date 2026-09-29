export const knapsackItems = [
  { name: 'A', weight: 2, value: 3 },
  { name: 'B', weight: 3, value: 4 },
  { name: 'C', weight: 4, value: 5 },
];
export const knapsackCapacity = 5;

export function createKnapsackState() {
  const rows = knapsackItems.length + 1;
  const dp = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: knapsackCapacity + 1 }, (_, w) => (i === 0 || w === 0 ? 0 : null)),
  );
  return {
    dp,
    row: 1,
    capacity: 1,
    last: null,
    done: false,
    note: '第 0 行和容量 0 都是 0；从第一件物品、容量 1 开始填表。',
  };
}

export function stepKnapsack(state) {
  if (state.done) throw new Error('Knapsack table has finished');
  const { row, capacity } = state;
  const item = knapsackItems[row - 1];
  const skip = state.dp[row - 1][capacity];
  const take =
    capacity >= item.weight ? item.value + state.dp[row - 1][capacity - item.weight] : null;
  const value = take === null ? skip : Math.max(skip, take);
  const dp = state.dp.map((entry) => [...entry]);
  dp[row][capacity] = value;
  const last = {
    row,
    capacity,
    skip,
    take,
    value,
    choice: take !== null && take > skip ? 'take' : 'skip',
  };
  const nextCapacity = capacity + 1;
  const done = row === knapsackItems.length && capacity === knapsackCapacity;
  return {
    ...state,
    dp,
    last,
    done,
    row: nextCapacity > knapsackCapacity ? row + 1 : row,
    capacity: nextCapacity > knapsackCapacity ? 1 : nextCapacity,
    note:
      take === null
        ? `dp[${row}][${capacity}]=${skip}：${item.name} 太重，只能不选。`
        : `dp[${row}][${capacity}]=max(不选 ${skip}, 选 ${take})=${value}。`,
  };
}

export function chosenKnapsackItems(state) {
  if (!state.done) throw new Error('Complete the table before reconstructing');
  const chosen = [];
  let capacity = knapsackCapacity;
  for (let row = knapsackItems.length; row > 0; row -= 1) {
    if (state.dp[row][capacity] !== state.dp[row - 1][capacity]) {
      const item = knapsackItems[row - 1];
      chosen.push(item.name);
      capacity -= item.weight;
    }
  }
  return chosen.reverse();
}
