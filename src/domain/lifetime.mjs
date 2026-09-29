const validActions = new Set([
  'allocate',
  'alias',
  'drop-p',
  'drop-q',
  'free-p',
  'free-q',
  'read-p',
  'read-q',
]);

export function createLifetimeState() {
  return {
    phase: 'empty',
    p: 'null',
    q: 'null',
    leaked: false,
    lastAction: null,
    lastOutcome: null,
    history: [],
  };
}

export function stepLifetime(state, action) {
  if (!state || !validActions.has(action)) throw new RangeError('Unknown lifetime action');
  const next = {
    ...state,
    history: [...state.history, action],
    lastAction: action,
    lastOutcome: null,
  };

  if (action === 'allocate') {
    if (state.phase !== 'empty') throw new RangeError('Reset before allocating another block');
    next.phase = 'allocated';
    next.p = 'live';
    next.lastOutcome = 'allocated';
  } else if (action === 'alias') {
    if (state.phase !== 'allocated' || state.p !== 'live' || state.q !== 'null') {
      throw new RangeError('p must be live and q empty to create an alias');
    }
    next.q = 'live';
    next.lastOutcome = 'aliased';
  } else if (action.startsWith('drop-')) {
    const handle = action.at(-1);
    if (state[handle] === 'null') throw new RangeError('The handle is already empty');
    next[handle] = 'null';
    next.lastOutcome = 'dropped';
  } else if (action.startsWith('free-')) {
    const handle = action.at(-1);
    if (state.phase !== 'allocated' || state[handle] !== 'live') {
      throw new RangeError('Only a live handle may free the block');
    }
    next.phase = 'freed';
    if (next.p === 'live') next.p = 'dangling';
    if (next.q === 'live') next.q = 'dangling';
    next.lastOutcome = 'freed';
  } else {
    const handle = action.at(-1);
    next.lastOutcome = state[handle] === 'live' ? 'safe' : state[handle];
  }

  next.leaked = next.phase === 'allocated' && next.p !== 'live' && next.q !== 'live';
  return next;
}
