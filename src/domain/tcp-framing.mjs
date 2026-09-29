export const framingChunks = [[0x00], [0x03, 0x43], [0x41, 0x54, 0x00, 0x02, 0x4f, 0x4b]];
export const framingMaxLength = 8;

export function createFramingState() {
  return {
    buffer: /** @type {number[]} */ ([]),
    messages: /** @type {string[]} */ ([]),
    chunksSeen: 0,
    closed: false,
    error: '',
    message: '等待第一块字节。',
  };
}

export function pushFramingChunk(state, chunk) {
  if (state.closed || state.error) throw new Error('stream is closed or invalid');
  if (
    !Array.isArray(chunk) ||
    chunk.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  ) {
    throw new Error('chunk must contain bytes');
  }
  let buffer = [...state.buffer, ...chunk];
  const messages = [...state.messages];
  while (buffer.length >= 2) {
    const length = buffer[0] * 256 + buffer[1];
    if (length > framingMaxLength) {
      return {
        ...state,
        buffer,
        chunksSeen: state.chunksSeen + 1,
        error: `帧长 ${length} 超过上限 ${framingMaxLength}。`,
        message: '拒绝过长帧。',
      };
    }
    if (buffer.length < 2 + length) break;
    messages.push(String.fromCharCode(...buffer.slice(2, 2 + length)));
    buffer = buffer.slice(2 + length);
  }
  return {
    ...state,
    buffer,
    messages,
    chunksSeen: state.chunksSeen + 1,
    message: `本次读到 ${chunk.length} 字节，共解析出 ${messages.length} 条完整消息。`,
  };
}

export function closeFramingStream(state) {
  return {
    ...state,
    closed: true,
    error: state.error || (state.buffer.length ? 'EOF 到达时仍有不完整帧。' : ''),
    message: state.buffer.length
      ? '连接结束，尾部字节不足以构成完整消息。'
      : '连接正常结束，没有残留字节。',
  };
}

export function framingExpectedLength(buffer) {
  return buffer.length >= 2 ? buffer[0] * 256 + buffer[1] : null;
}
