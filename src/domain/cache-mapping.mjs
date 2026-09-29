export function createCacheMapping(ways = 1) {
  if (ways !== 1 && ways !== 2) throw new RangeError('ways must be 1 or 2');
  return {
    ways,
    sets: Array.from({ length: 4 / ways }, () => []),
    clock: 0,
    hits: 0,
    misses: 0,
    last: null,
  };
}

export function accessCacheLine(state, line) {
  if (!state || ![1, 2].includes(state.ways) || !Number.isInteger(line) || line < 0 || line > 7) {
    throw new RangeError('invalid cache access');
  }
  const sets = state.sets.map((set) => set.map((entry) => ({ ...entry })));
  const setIndex = line % sets.length;
  const tag = Math.floor(line / sets.length);
  const set = sets[setIndex];
  const clock = state.clock + 1;
  const hit = set.some((entry) => entry.line === line);
  let evicted = null;
  if (hit) {
    set.find((entry) => entry.line === line).lastUsed = clock;
  } else if (set.length < state.ways) {
    set.push({ line, lastUsed: clock });
  } else {
    const victimIndex = set.reduce(
      (best, entry, index) => (entry.lastUsed < set[best].lastUsed ? index : best),
      0,
    );
    evicted = set[victimIndex].line;
    set[victimIndex] = { line, lastUsed: clock };
  }
  return {
    ways: state.ways,
    sets,
    clock,
    hits: state.hits + Number(hit),
    misses: state.misses + Number(!hit),
    last: { line, setIndex, tag, hit, evicted },
  };
}
