export const sortingDatasets = {
  equal: [
    { key: 2, tag: 'a' },
    { key: 2, tag: 'b' },
    { key: 1, tag: '' },
    { key: 3, tag: '' },
  ],
  sorted: [
    { key: 1, tag: '' },
    { key: 2, tag: 'a' },
    { key: 2, tag: 'b' },
    { key: 3, tag: '' },
  ],
  reversed: [
    { key: 4, tag: '' },
    { key: 3, tag: '' },
    { key: 2, tag: '' },
    { key: 1, tag: '' },
  ],
};

const label = (item) => `${item.key}${item.tag}`;
const snapshot = (values, comparisons, changes, note, focus) => ({
  values: values.map((item) => ({ ...item })),
  comparisons,
  changes,
  note,
  focus,
});

export function sortingFrames(method, dataset) {
  if (!['insertion', 'selection'].includes(method) || !sortingDatasets[dataset]) {
    throw new Error('Unknown sorting method or dataset');
  }
  const values = sortingDatasets[dataset].map((item) => ({ ...item }));
  let comparisons = 0;
  let changes = 0;
  const frames = [snapshot(values, 0, 0, '原始顺序；字母记录相同键的先后。', -1)];
  for (let i = 1; i < values.length; i++) {
    if (method === 'insertion') {
      const current = values[i];
      let j = i - 1;
      while (j >= 0) {
        comparisons++;
        if (values[j].key <= current.key) break;
        values[j + 1] = values[j];
        changes++;
        j--;
      }
      values[j + 1] = current;
      frames.push(
        snapshot(
          values,
          comparisons,
          changes,
          `把 ${label(current)} 放到已排序前缀；只搬动更大的键。`,
          j + 1,
        ),
      );
    } else {
      const first = i - 1;
      let minimum = first;
      for (let j = first + 1; j < values.length; j++) {
        comparisons++;
        if (values[j].key < values[minimum].key) minimum = j;
      }
      const chosen = values[minimum];
      if (minimum !== first) {
        [values[first], values[minimum]] = [values[minimum], values[first]];
        changes++;
      }
      const note =
        minimum === first
          ? `${label(chosen)} 已是剩余部分最小键，留在位置 ${first}，无需交换。`
          : `从剩余部分选出 ${label(chosen)}，与位置 ${first} 交换。`;
      frames.push(snapshot(values, comparisons, changes, note, first));
    }
  }
  return frames;
}
