export const kmpPattern = 'ababaca';
export const kmpTexts = {
  match: 'abababaca',
  miss: 'abababacb',
  exact: 'ababaca',
};

export function createKmpState(preset = 'match') {
  if (!Object.hasOwn(kmpTexts, preset)) throw new Error('Unknown KMP text preset');
  return {
    preset,
    text: kmpTexts[preset],
    pattern: kmpPattern,
    prefix: [0, ...Array(kmpPattern.length - 1).fill(null)],
    buildIndex: 1,
    border: 0,
    textIndex: 0,
    patternIndex: 0,
    matches: [],
    phase: 'prefix',
    last: null,
    note: '前缀表从 π[0]=0 开始；下一步计算第 1 个位置。',
  };
}

export function stepKmp(state) {
  if (state.phase === 'done') throw new Error('KMP search has finished');
  if (state.phase === 'prefix') {
    const index = state.buildIndex;
    const fallback = [];
    let border = state.border;
    while (border > 0 && state.pattern[index] !== state.pattern[border]) {
      fallback.push([border, state.prefix[border - 1]]);
      border = state.prefix[border - 1];
    }
    if (state.pattern[index] === state.pattern[border]) border += 1;
    const prefix = [...state.prefix];
    prefix[index] = border;
    const buildIndex = index + 1;
    return {
      ...state,
      prefix,
      buildIndex,
      border,
      phase: buildIndex === state.pattern.length ? 'scan' : 'prefix',
      last: { kind: 'prefix', index, fallback, value: border },
      note: fallback.length
        ? `π[${index}]=${border}；候选边界依次回退 ${fallback.map(([a, b]) => `${a}→${b}`).join('、')}。`
        : `π[${index}]=${border}；当前最长相等真前后缀长度为 ${border}。`,
    };
  }
  const i = state.textIndex;
  const j = state.patternIndex;
  if (i >= state.text.length) return { ...state, phase: 'done', note: '文本扫描结束。' };
  if (state.text[i] !== state.pattern[j] && j > 0) {
    const patternIndex = state.prefix[j - 1];
    return {
      ...state,
      patternIndex,
      last: { kind: 'fallback', textIndex: i, from: j, to: patternIndex },
      note: `失配：文本下标仍是 ${i}，模式位置从 ${j} 回退到 ${patternIndex}。`,
    };
  }
  const matched = state.text[i] === state.pattern[j];
  const textIndex = i + 1;
  const nextJ = matched ? j + 1 : 0;
  const complete = nextJ === state.pattern.length;
  const matches = complete ? [...state.matches, textIndex - nextJ] : state.matches;
  return {
    ...state,
    textIndex,
    patternIndex: complete ? state.prefix[nextJ - 1] : nextJ,
    matches,
    phase: textIndex === state.text.length ? 'done' : 'scan',
    last: { kind: complete ? 'match' : matched ? 'equal' : 'skip', textIndex: i, patternIndex: j },
    note: complete
      ? `找到匹配：从文本下标 ${matches.at(-1)} 开始。`
      : matched
        ? `字符相等，文本推进到 ${textIndex}，模式推进到 ${nextJ}。`
        : `模式位置为 0 仍失配，文本推进到 ${textIndex}。`,
  };
}
