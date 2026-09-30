export const MAX_BALANCE = 2147483647;

export function applyAccount(balance, operation, amount, guarded = true) {
  if (!Number.isSafeInteger(amount) || amount < -MAX_BALANCE - 1 || amount > MAX_BALANCE) {
    return { balance, accepted: false, reason: '金额必须是 Java int 范围内的整数分。' };
  }
  if (
    guarded &&
    (amount <= 0 || (operation === 'withdraw' ? amount > balance : amount > MAX_BALANCE - balance))
  ) {
    return {
      balance,
      accepted: false,
      reason:
        amount <= 0
          ? '金额必须大于 0，校验失败，没有写入。'
          : operation === 'withdraw'
            ? '金额超过余额，扣款被拒绝，原状态保留。'
            : '存款会超过 int 上限，在加法前拒绝。',
    };
  }
  const next = (operation === 'withdraw' ? balance - amount : balance + amount) | 0;
  return {
    balance: next,
    accepted: true,
    reason:
      next < 0
        ? '公开方法缺少校验，已经把私有字段写成负数。'
        : guarded
          ? '全部前置条件成立，余额只更新一次。'
          : '这次数据没有触发漏洞，但方法仍未保护边界。',
  };
}
