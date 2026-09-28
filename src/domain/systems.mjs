export function translateAddress(address, loaded = false, write = false) {
  if (!Number.isInteger(address) || address < 0 || address > 8191) {
    return { kind: 'invalid', message: '本模型仅展示 0..8191 的八个虚拟页。' };
  }
  const page = Math.floor(address / 1024);
  const offset = address % 1024;
  const frames = [2, 4, 5, loaded ? 9 : null, 1, 6, 8, null];
  if (page === 7)
    return { kind: 'illegal', page, offset, message: '页 7 不属于合法区域，不能通过调页补齐。' };
  if (write && page === 1)
    return { kind: 'protection', page, offset, message: '页 1 只读：映射存在也不能越过写保护。' };
  const frame = frames[page];
  if (frame === null)
    return { kind: 'fault', page, offset, message: '合法页 3 尚未驻留，需要准备页面后重试。' };
  return {
    kind: 'mapped',
    page,
    offset,
    frame,
    physical: frame * 1024 + offset,
    message: '替换页号，保留页内偏移。',
  };
}

export function initialRace() {
  return {
    shared: 0,
    locals: [0, 0],
    phases: [0, 0],
    owner: -1,
    message: '两个线程各执行一次 count += 1。',
  };
}

export function advanceRace(state, thread, locked) {
  const next = { ...state, locals: [...state.locals], phases: [...state.phases] };
  if (thread !== 0 && thread !== 1) throw new RangeError('Unknown thread');
  const name = thread === 0 ? 'A' : 'B';
  const phase = state.phases[thread];
  if (phase === 3) return { ...next, message: `线程 ${name} 已完成。` };
  if (locked && state.owner !== -1 && state.owner !== thread)
    return { ...next, message: `线程 ${name} 等待同一把互斥锁，不能提前读取 count。` };
  if (phase === 0) {
    next.locals[thread] = state.shared;
    next.owner = locked ? thread : -1;
    next.message = `${name} 读取共享值 ${state.shared} 到自己的临时变量。`;
  } else if (phase === 1) {
    next.locals[thread] += 1;
    next.message = `${name} 在本地加一，共享值仍为 ${state.shared}。`;
  } else {
    next.shared = state.locals[thread];
    next.owner = -1;
    next.message = `${name} 写回 ${next.shared}${locked ? ' 并释放锁' : ''}。`;
  }
  next.phases[thread] += 1;
  return next;
}

export function isDeadlocked(owners, waiting) {
  return (
    waiting[0] !== -1 && waiting[1] !== -1 && owners[waiting[0]] === 1 && owners[waiting[1]] === 0
  );
}

export function requestLock(owners, waiting, thread, resource, ordered) {
  const next = { owners: [...owners], waiting: [...waiting], message: '' };
  if (![0, 1].includes(thread) || ![0, 1].includes(resource))
    throw new RangeError('Unknown lock or thread');
  if (waiting[thread] !== -1)
    return { ...next, message: '该线程正在阻塞，不能继续执行新的获取语句。' };
  if (owners[resource] === thread)
    return { ...next, message: '已经持有此锁；本实验不允许重复获取。' };
  if (ordered && resource === 1 && owners[0] !== thread)
    return { ...next, message: '顺序规则要求先取得 X，再申请 Y。' };
  if (owners[resource] === -1) {
    next.owners[resource] = thread;
    next.message = `线程 ${thread === 0 ? 'A' : 'B'} 取得锁 ${resource === 0 ? 'X' : 'Y'}。`;
  } else {
    next.waiting[thread] = resource;
    next.message = '锁由另一线程持有，申请者进入等待。';
  }
  return next;
}

export function transportDelivery(received, tcp) {
  const segments = ['hel', 'low', 'orld'];
  const valid = received.filter((index) => Number.isInteger(index) && index >= 0 && index < 3);
  const unique = [...new Set(valid)];
  let prefix = 0;
  while (unique.includes(prefix)) prefix += 1;
  return {
    buffered: unique,
    missing: [0, 1, 2].filter((index) => !unique.includes(index)),
    output: tcp
      ? segments.slice(0, prefix).join('')
      : valid.map((index) => segments[index]).join(' | '),
  };
}

export function dnsQuery(cache, age) {
  if (!Number.isFinite(age) || age < 0) throw new RangeError('Invalid age');
  const hit = cache === 'answer' && age < 300;
  return {
    hit,
    ttl: hit ? 300 - age : 300,
    path: hit
      ? ['客户端', '递归解析器', '客户端']
      : cache === 'delegation'
        ? ['客户端', '递归解析器', '权威服务器', '递归解析器', '客户端']
        : [
            '客户端',
            '递归解析器',
            '根服务器',
            '递归解析器',
            'com 服务器',
            '递归解析器',
            '权威服务器',
            '递归解析器',
            '客户端',
          ],
  };
}

export function cacheRequest(cachedVersion, serverVersion, age, policy) {
  if (!Number.isFinite(age) || age < 0) throw new RangeError('Invalid cache age');
  if (policy === 'no-store')
    return {
      status: '200',
      network: true,
      cachedVersion: null,
      age: 0,
      message: '完整获取，但不保存这次响应。',
    };
  if (cachedVersion !== null && policy === 'max-age' && age < 60)
    return {
      status: '本地复用',
      network: false,
      cachedVersion,
      age,
      message: '仍然新鲜，不联系源站；源站是否变化尚未知晓。',
    };
  if (cachedVersion !== null && cachedVersion === serverVersion)
    return {
      status: '304',
      network: true,
      cachedVersion,
      age: 0,
      message: '验证器匹配，没有响应正文，复用已有正文并刷新元数据。',
    };
  return {
    status: '200',
    network: true,
    cachedVersion: serverVersion,
    age: 0,
    message:
      cachedVersion === null ? '首次获取完整正文并保存。' : '验证器不匹配，取得新正文并更新缓存。',
  };
}

export function forwardingFrame(hop, ttl) {
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > 255) throw new RangeError('Invalid TTL');
  return {
    source: hop === 0 ? 'MAC-A' : 'MAC-R出口',
    destination: hop === 0 ? 'MAC-R入口' : 'MAC-S',
    ttl: hop === 0 ? ttl : ttl - 1,
    dropped: hop > 0 && ttl === 1,
  };
}

export function httpMessage(method, exists) {
  const status = exists ? '200 OK' : '404 Not Found';
  const representation = exists ? '{"id":7}' : '{"error":"not found"}';
  return { status, body: method === 'HEAD' ? '' : representation, length: representation.length };
}

export function tcpPackets(client, server) {
  if (![client, server].every((value) => Number.isInteger(value) && value >= 0 && value <= 9999))
    throw new RangeError('ISN must be 0..9999 in this model');
  return [
    {
      direction: 'right',
      text: `SYN seq=${client}`,
      client: 'SYN-SENT',
      server: 'SYN-RECEIVED',
      beforeClient: 'SYN-SENT',
      beforeServer: 'LISTEN',
    },
    {
      direction: 'left',
      text: `SYN + ACK seq=${server} ack=${client + 1}`,
      client: 'ESTABLISHED',
      server: 'SYN-RECEIVED',
      beforeClient: 'SYN-SENT',
      beforeServer: 'SYN-RECEIVED',
    },
    {
      direction: 'right',
      text: `ACK seq=${client + 1} ack=${server + 1}`,
      client: 'ESTABLISHED',
      server: 'ESTABLISHED',
      beforeClient: 'ESTABLISHED',
      beforeServer: 'SYN-RECEIVED',
    },
    {
      direction: 'right',
      text: `FIN + ACK seq=${client + 1} ack=${server + 1}`,
      client: 'FIN-WAIT-1',
      server: 'CLOSE-WAIT',
      beforeClient: 'FIN-WAIT-1',
      beforeServer: 'ESTABLISHED',
    },
    {
      direction: 'left',
      text: `ACK seq=${server + 1} ack=${client + 2}`,
      client: 'FIN-WAIT-2',
      server: 'CLOSE-WAIT',
      beforeClient: 'FIN-WAIT-1',
      beforeServer: 'CLOSE-WAIT',
    },
    {
      direction: 'left',
      text: `FIN + ACK seq=${server + 1} ack=${client + 2}`,
      client: 'TIME-WAIT',
      server: 'LAST-ACK',
      beforeClient: 'FIN-WAIT-2',
      beforeServer: 'LAST-ACK',
    },
    {
      direction: 'right',
      text: `ACK seq=${client + 2} ack=${server + 2}`,
      client: 'TIME-WAIT',
      server: 'CLOSED',
      beforeClient: 'TIME-WAIT',
      beforeServer: 'LAST-ACK',
    },
  ];
}
