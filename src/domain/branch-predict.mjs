export function createPredictor(bits = 1) {
  if (bits !== 1 && bits !== 2) throw new RangeError('bits must be 1 or 2');
  return { bits, state: bits === 1 ? 0 : 1, correct: 0, total: 0, history: [] };
}

export function observeBranch(predictor, taken) {
  if (!predictor || ![1, 2].includes(predictor.bits) || typeof taken !== 'boolean') {
    throw new TypeError('invalid branch outcome');
  }
  const predicted = predictor.bits === 1 ? predictor.state === 1 : predictor.state >= 2;
  const next =
    predictor.bits === 1
      ? Number(taken)
      : Math.max(0, Math.min(3, predictor.state + (taken ? 1 : -1)));
  return {
    ...predictor,
    state: next,
    correct: predictor.correct + Number(predicted === taken),
    total: predictor.total + 1,
    history: [
      ...predictor.history,
      { predicted, taken, correct: predicted === taken, before: predictor.state, after: next },
    ],
  };
}
