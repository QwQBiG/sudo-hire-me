export const tlbPageSize = 256;
export const tlbPageTable = [
  { page: 0, frame: 5 },
  { page: 1, frame: 2 },
  { page: 2, frame: 7 },
  { page: 3, frame: 9 },
  { page: 4, frame: null },
];

export function createTlbState() {
  return {
    entries: /** @type {{page: number, frame: number}[]} */ ([]),
    loadedPage3: false,
    hits: 0,
    misses: 0,
    faults: 0,
    invalid: 0,
    last: /** @type {null | {kind: string, address: number, page: number, offset: number, frame?: number, physical?: number, evicted?: number | null}} */ (
      null
    ),
    history: /** @type {string[]} */ ([]),
    message: '两项 TLB 均为空。先访问地址 12，再试 268、15、524。',
  };
}

export function loadTlbPage3(state) {
  if (state.loadedPage3) return { ...state, message: '页 3 已装入物理框 9。' };
  const message = '操作系统把合法页 3 装入物理框 9；再访问该页仍需先处理 TLB 未命中。';
  return { ...state, loadedPage3: true, message, history: [...state.history, message].slice(-9) };
}

export function accessTlb(state, address) {
  if (!Number.isInteger(address) || address < 0 || address >= tlbPageSize * tlbPageTable.length) {
    throw new Error('虚拟地址必须是 0 到 1279 的整数');
  }
  const page = Math.floor(address / tlbPageSize);
  const offset = address % tlbPageSize;
  const hitIndex = state.entries.findIndex((entry) => entry.page === page);
  if (hitIndex >= 0) {
    const entry = state.entries[hitIndex];
    const entries = [...state.entries.filter((_, index) => index !== hitIndex), entry];
    const physical = entry.frame * tlbPageSize + offset;
    const message = `地址 ${address}：TLB 命中页 ${page}→框 ${entry.frame}；物理地址 ${physical}。`;
    return {
      ...state,
      entries,
      hits: state.hits + 1,
      last: { kind: 'hit', address, page, offset, frame: entry.frame, physical },
      message,
      history: [...state.history, message].slice(-9),
    };
  }

  if (page === 4) {
    const message = `地址 ${address}：TLB 未命中；页 4 不在此地址空间中，属于非法访问。`;
    return {
      ...state,
      misses: state.misses + 1,
      invalid: state.invalid + 1,
      last: { kind: 'invalid', address, page, offset },
      message,
      history: [...state.history, message].slice(-9),
    };
  }
  if (page === 3 && !state.loadedPage3) {
    const message = `地址 ${address}：TLB 未命中；页 3 合法但未驻留，产生缺页。`;
    return {
      ...state,
      misses: state.misses + 1,
      faults: state.faults + 1,
      last: { kind: 'fault', address, page, offset },
      message,
      history: [...state.history, message].slice(-9),
    };
  }

  const frame = tlbPageTable[page].frame;
  if (frame === null) throw new Error('该页没有物理页框');
  const evicted = state.entries.length === 2 ? state.entries[0].page : null;
  const entries = [...state.entries.slice(state.entries.length === 2 ? 1 : 0), { page, frame }];
  const physical = frame * tlbPageSize + offset;
  const message = `地址 ${address}：TLB 未命中，页表得页 ${page}→框 ${frame}${evicted === null ? '' : `；替换最久未用的页 ${evicted}`}；物理地址 ${physical}。`;
  return {
    ...state,
    entries,
    misses: state.misses + 1,
    last: { kind: 'miss', address, page, offset, frame, physical, evicted },
    message,
    history: [...state.history, message].slice(-9),
  };
}
