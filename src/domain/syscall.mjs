const userCall = {
  phase: 'call',
  mode: 'user',
  thread: 'A',
  summary: '线程 A 在用户态准备一次调用。',
  detail: '此时仍由 A 执行；调用名字本身不会提高权限。',
  switches: 0,
};

export function syscallFrames(kind = 'read', waits = false) {
  if (!['function', 'read'].includes(kind)) throw new Error('未知调用类型');
  if (typeof waits !== 'boolean') throw new Error('等待选项必须为布尔值');
  if (kind === 'function') {
    return [
      userCall,
      {
        phase: 'body',
        mode: 'user',
        thread: 'A',
        summary: '普通函数在用户态运行。',
        detail: '本模型中函数只处理用户态数据，没有受控进入内核。',
        switches: 0,
      },
      {
        phase: 'return',
        mode: 'user',
        thread: 'A',
        summary: '函数返回，仍是线程 A。',
        detail: '普通函数调用本身既没有跨权限边界，也没有换线程。',
        switches: 0,
      },
    ];
  }
  const frames = [
    { ...userCall, summary: '线程 A 调用 read(fd, buffer, 2)。' },
    {
      phase: 'entry',
      mode: 'kernel',
      thread: 'A',
      summary: '受控入口把执行带入内核。',
      detail: '权限变化了，执行主体仍是 A；这是教学抽象，不对应固定机器指令。',
      switches: 0,
    },
    {
      phase: 'check',
      mode: 'kernel',
      thread: 'A',
      summary: '内核检查 fd、缓冲区和可读状态。',
      detail: waits ? '数据暂不可用，A 将等待。' : '本例数据已准备好，可以直接返回 A。',
      switches: 0,
    },
  ];
  if (waits) {
    frames.push(
      {
        phase: 'blocked',
        mode: 'kernel',
        thread: 'A',
        summary: 'A 因等待数据进入阻塞状态。',
        detail: '内核可以选择另一条就绪线程；阻塞不等于在 CPU 上忙等。',
        switches: 0,
      },
      {
        phase: 'switch',
        mode: 'user',
        thread: 'B',
        summary: '调度器恢复线程 B。',
        detail: '当前执行主体 A→B，这一步才是本例的上下文切换。',
        switches: 1,
      },
      {
        phase: 'wakeup',
        mode: 'user',
        thread: 'B',
        summary: '数据到达，A 变为就绪。',
        detail: 'B 仍在运行；A 还要等待再次被调度。',
        switches: 1,
      },
      {
        phase: 'resume',
        mode: 'kernel',
        thread: 'A',
        summary: '系统稍后恢复 A 的内核处理。',
        detail: '当前执行主体 B→A；读操作在本模型中取得两字节。',
        switches: 2,
      },
    );
  }
  frames.push({
    phase: 'return',
    mode: 'user',
    thread: 'A',
    summary: 'read 返回 2，A 继续执行用户代码。',
    detail: waits
      ? '此次经历了等待和调度；它们不是每次系统调用的必经步骤。'
      : '这次只跨权限边界，没有切换到另一条线程。',
    switches: waits ? 2 : 0,
  });
  return frames;
}
