const files = {
  note: { label: 'note.txt', content: 'ABCDE' },
  other: { label: 'other.txt', content: 'xyz' },
};

export function createDescriptorState() {
  return {
    slots: /** @type {Record<number, string>} */ ({ 0: 'S0', 1: 'S1', 2: 'S2' }),
    descriptions: /** @type {Record<string, {label: string, content: string, offset: number}>} */ ({
      S0: { label: 'stdin', content: '', offset: 0 },
      S1: { label: 'stdout', content: '', offset: 0 },
      S2: { label: 'stderr', content: '', offset: 0 },
    }),
    nextId: 1,
    events: /** @type {string[]} */ ([]),
    message: 'fd 0、1、2 已占用；从 open(note.txt) 开始。实验只显示 fd 3–6。',
  };
}

function nextFree(slots) {
  for (let fd = 3; fd <= 6; fd++) if (!slots[fd]) return fd;
  return -1;
}

function append(state, message) {
  return { ...state, events: [...state.events, message].slice(-6), message };
}

export function advanceDescriptor(state, action) {
  if (action === 'open-note' || action === 'open-other') {
    const fd = nextFree(state.slots);
    if (fd < 0) return { ...state, message: '教学表的 fd 3–6 都已占用，请先关闭 fd 3。' };
    const file = files[action === 'open-note' ? 'note' : 'other'];
    const id = `F${state.nextId}`;
    return append(
      {
        ...state,
        slots: { ...state.slots, [fd]: id },
        descriptions: {
          ...state.descriptions,
          [id]: { ...file, offset: 0 },
        },
        nextId: state.nextId + 1,
      },
      `open(${file.label}) → fd ${fd}；新建 ${id}，偏移 0。`,
    );
  }
  if (action === 'dup3') {
    const source = state.slots[3];
    if (!source) return { ...state, message: 'fd 3 未打开，不能 dup(3)。' };
    const fd = nextFree(state.slots);
    if (fd < 0) return { ...state, message: '教学表的 fd 3–6 已满，无法取得新编号。' };
    return append(
      { ...state, slots: { ...state.slots, [fd]: source } },
      `dup(3) → fd ${fd}；两个编号都引用 ${source}。`,
    );
  }
  if (action === 'read3' || action === 'read4') {
    const fd = action === 'read3' ? 3 : 4;
    const id = state.slots[fd];
    if (!id) return { ...state, message: `fd ${fd} 未打开，不能 read(${fd}, 2)。` };
    const description = state.descriptions[id];
    const bytes = description.content.slice(description.offset, description.offset + 2);
    const offset = description.offset + bytes.length;
    return append(
      {
        ...state,
        descriptions: {
          ...state.descriptions,
          [id]: { ...description, offset },
        },
      },
      bytes
        ? `read(${fd}, 2) → "${bytes}"；共享的 ${id} 偏移变为 ${offset}。`
        : `read(${fd}, 2) → 0 字节；${id} 已到文件末尾。`,
    );
  }
  if (action === 'close3') {
    const id = state.slots[3];
    if (!id) return { ...state, message: 'fd 3 已关闭，不能再次 close(3)。' };
    const slots = { ...state.slots };
    delete slots[3];
    const descriptions = { ...state.descriptions };
    const stillReferenced = Object.values(slots).includes(id);
    if (!stillReferenced) delete descriptions[id];
    return append(
      { ...state, slots, descriptions },
      `close(3) 释放编号 3；${stillReferenced ? `${id} 仍由其他 fd 引用。` : `${id} 不再被引用。`}`,
    );
  }
  throw new Error('未知的文件描述符操作');
}
