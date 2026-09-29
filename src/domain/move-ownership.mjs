export function ownershipState(owner = 'p') {
  if (owner !== 'p' && owner !== 'q') throw new RangeError('owner must be p or q');
  return Object.freeze({ owner, p: owner === 'p' ? 7 : null, q: owner === 'q' ? 7 : null });
}

export function transferUniqueOwner(state) {
  if (!state || (state.owner !== 'p' && state.owner !== 'q'))
    throw new TypeError('invalid ownership state');
  return ownershipState(state.owner === 'p' ? 'q' : 'p');
}

export function inspectMoveExpression(state) {
  if (!state || (state.owner !== 'p' && state.owner !== 'q'))
    throw new TypeError('invalid ownership state');
  return { ...state, note: 'std::move 只把表达式转为可用于移动的形式；此刻所有权未转移。' };
}
