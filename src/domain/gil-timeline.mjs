export function gilTimeline(mode, tick) {
  if (!['gil', 'free', 'io'].includes(mode)) throw new RangeError('mode');
  if (!Number.isInteger(tick) || tick < 0 || tick > 8) throw new RangeError('tick');
  return [0, 1].map((thread) => {
    const cells = Array.from({ length: 8 }, (_, index) => {
      if (index >= tick) return 'pending';
      if (mode === 'free') return 'cpu';
      if (mode === 'io') return thread === 0 ? 'io' : 'cpu';
      return index % 2 === thread ? 'cpu' : 'waiting';
    });
    return {
      cells,
      current: tick ? cells[tick - 1] : 'ready',
      cpu: cells.filter((cell) => cell === 'cpu').length,
    };
  });
}
