export function defaultListState() {
  return { shared: [], history: [] };
}

export function callWithList(state, value, explicit = false) {
  if (!state || !Array.isArray(state.shared) || !Array.isArray(state.history))
    throw new TypeError('invalid state');
  if (!Number.isInteger(value)) throw new TypeError('value must be an integer');
  const shared = explicit ? [...state.shared] : [...state.shared, value];
  const result = explicit ? [value] : [...shared];
  return {
    shared,
    history: [...state.history, { value, explicit, result }],
  };
}
