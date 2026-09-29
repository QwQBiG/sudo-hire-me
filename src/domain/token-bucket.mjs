export const tokenCapacity = 4;
export const tokenRefillPerSecond = 1;

export function createTokenBucketState() {
  return { time: 0, tokens: 4, allowed: 0, rejected: 0, message: 't=0：桶中有 4 枚令牌。' };
}

export function requestTokens(state, count = 1) {
  if (!Number.isInteger(count) || count <= 0) throw new Error('invalid request count');
  const allowedNow = Math.min(state.tokens, count);
  const rejectedNow = count - allowedNow;
  return {
    ...state,
    tokens: state.tokens - allowedNow,
    allowed: state.allowed + allowedNow,
    rejected: state.rejected + rejectedNow,
    message: `t=${state.time}：${count} 次请求中放行 ${allowedNow} 次，拒绝 ${rejectedNow} 次。`,
  };
}

export function advanceTokenTime(state, seconds) {
  if (!Number.isInteger(seconds) || seconds <= 0) throw new Error('invalid time step');
  const tokens = Math.min(tokenCapacity, state.tokens + seconds * tokenRefillPerSecond);
  return {
    ...state,
    time: state.time + seconds,
    tokens,
    message: `推进 ${seconds} 秒后，令牌恢复到 ${tokens}/${tokenCapacity}。`,
  };
}
