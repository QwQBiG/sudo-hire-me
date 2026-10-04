import { advanceRace } from './systems.mjs';

/** @typedef {'volatile' | 'locked' | 'atomic'} CounterStrategy */
/** @typedef {{ phase: number, local: number | null }} CounterThread */
/** @typedef {{ strategy: CounterStrategy, count: number, owner: number | null,
 * threads: CounterThread[], events: { thread: number, operation: string, count: number }[] }} CounterState */

/** @param {CounterStrategy} strategy @returns {CounterState} */
export function createCounter(strategy = 'volatile') {
  if (!['volatile', 'locked', 'atomic'].includes(strategy)) throw new RangeError('strategy');
  return {
    strategy,
    count: 0,
    owner: null,
    threads: [
      { phase: 0, local: null },
      { phase: 0, local: null },
    ],
    events: [],
  };
}

/** @param {CounterState} state @param {number} thread */
export function counterEnabled(state, thread) {
  if (!Number.isInteger(thread) || thread < 0 || thread > 1) throw new RangeError('thread');
  return (
    state.threads[thread].phase < 3 &&
    (state.strategy !== 'locked' || state.owner === null || state.owner === thread)
  );
}

/** @param {CounterState} state @param {number} thread @returns {CounterState} */
export function advanceCounter(state, thread) {
  if (!counterEnabled(state, thread)) return state;
  const next = {
    ...state,
    threads: state.threads.map((t) => ({ ...t })),
    events: [...state.events],
  };
  const current = next.threads[thread];
  let operation;
  if (next.strategy === 'atomic') {
    next.count++;
    current.phase = 3;
    current.local = next.count;
    operation = `incrementAndGet() → ${next.count}`;
  } else {
    const advanced = advanceRace(
      {
        shared: state.count,
        locals: state.threads.map((t) => t.local ?? 0),
        phases: state.threads.map((t) => t.phase),
        owner: state.owner ?? -1,
        message: '',
      },
      thread,
      state.strategy === 'locked',
    );
    next.count = advanced.shared;
    next.owner = advanced.owner === -1 ? null : advanced.owner;
    current.local = advanced.locals[thread];
    operation =
      current.phase === 0
        ? `读取 count → local = ${current.local}`
        : current.phase === 1
          ? `计算 local + 1 → ${current.local}`
          : `写入 count ← ${next.count}`;
    current.phase = advanced.phases[thread];
  }
  next.events.push({ thread, operation, count: next.count });
  return next;
}

// Enumerate only the explicitly modeled read/calculate/write interleavings, not every JMM execution.
/** @param {CounterStrategy} strategy */
export function counterOutcomes(strategy) {
  /** @type {Map<number, number>} */
  const results = new Map();
  /** @param {CounterState} state */
  const visit = (state) => {
    if (state.threads.every((t) => t.phase === 3)) {
      results.set(state.count, (results.get(state.count) ?? 0) + 1);
      return;
    }
    for (let thread = 0; thread < 2; thread++) {
      if (counterEnabled(state, thread)) visit(advanceCounter(state, thread));
    }
  };
  visit(createCounter(strategy));
  return [...results].sort(([a], [b]) => a - b).map(([value, schedules]) => ({ value, schedules }));
}
