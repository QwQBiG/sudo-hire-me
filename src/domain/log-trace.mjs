export const traceEvents = [
  {
    at: '10:02:00.001',
    request: 'R17',
    level: 'INFO',
    event: 'order.received',
    detail: '收到创建订单请求',
  },
  {
    at: '10:02:00.003',
    request: 'R18',
    level: 'INFO',
    event: 'order.received',
    detail: '收到创建订单请求',
  },
  {
    at: '10:02:00.006',
    request: 'R17',
    level: 'INFO',
    event: 'order.validated',
    detail: '输入校验通过',
  },
  {
    at: '10:02:00.009',
    request: 'R19',
    level: 'INFO',
    event: 'order.received',
    detail: '收到创建订单请求',
  },
  {
    at: '10:02:00.013',
    request: 'R18',
    level: 'INFO',
    event: 'order.validated',
    detail: '输入校验通过',
  },
  {
    at: '10:02:00.020',
    request: 'R17',
    level: 'INFO',
    event: 'order.store.started',
    detail: '开始保存订单',
  },
  {
    at: '10:02:00.024',
    request: 'R19',
    level: 'WARN',
    event: 'order.validation.rejected',
    detail: '缺少必填项',
  },
  {
    at: '10:02:00.055',
    request: 'R18',
    level: 'INFO',
    event: 'order.store.started',
    detail: '开始保存订单',
  },
  {
    at: '10:02:00.206',
    request: 'R17',
    level: 'ERROR',
    event: 'order.store.failed',
    detail: '调用超时',
  },
  { at: '10:02:00.207', request: 'R17', level: 'INFO', event: 'order.failed', detail: '请求失败' },
  {
    at: '10:02:00.231',
    request: 'R18',
    level: 'INFO',
    event: 'order.store.completed',
    detail: '保存完成',
  },
  {
    at: '10:02:00.232',
    request: 'R18',
    level: 'INFO',
    event: 'order.completed',
    detail: '请求完成',
  },
];

export const traceClaims = [
  { id: 'supported', text: 'R17 在保存订单阶段失败；目前尚不能确定超时根因。' },
  { id: 'all-failed', text: '数据库完全不可用，因此全部请求都失败。' },
  { id: 'validated', text: 'R17 没有通过输入校验。' },
];

export function visibleTraceEvents(request) {
  if (request !== 'all' && !['R17', 'R18', 'R19'].includes(request)) {
    throw new Error('未知请求标识');
  }
  return request === 'all' ? traceEvents : traceEvents.filter((item) => item.request === request);
}

export function assessTraceClaim(claimId) {
  if (!traceClaims.some((item) => item.id === claimId)) throw new Error('未知结论');
  return claimId === 'supported'
    ? {
        supported: true,
        reason:
          'R17 有 order.validated 和 order.store.failed，R18 随后保存成功；超时的具体原因仍需进一步证据。',
      }
    : {
        supported: false,
        reason:
          claimId === 'all-failed'
            ? 'R18 的 order.store.completed 反驳“全部请求失败”；一条超时日志也不能证明数据库完全不可用。'
            : 'R17 的 order.validated 明确表示输入校验已经通过。',
      };
}
