const send = self.postMessage.bind(self);
const later = self.setTimeout.bind(self);
const cancel = self.clearTimeout.bind(self);
let pending = 0;
let finished = false;
let lines = 0;
const timers = new Set();
const format = (value) => {
  try {
    return typeof value === 'string'
      ? value
      : value instanceof Error
        ? `${value.name}: ${value.message}`
        : (JSON.stringify(value) ?? String(value));
  } catch {
    return '[无法序列化]';
  }
};
function output(kind, values) {
  if (lines++ >= 150) {
    if (lines === 151) send({ kind: 'error', text: '输出达到 150 行限制。' });
    return;
  }
  send({ kind, text: values.map(format).join(' ').slice(0, 2000) });
}
function settle() {
  later(() => {
    if (finished && pending === 0) send({ kind: 'done' });
  }, 30);
}
self.console = Object.freeze(
  Object.fromEntries(
    ['log', 'info', 'warn', 'error', 'debug'].map((kind) => [
      kind,
      (...values) => output(kind === 'error' ? 'error' : 'log', values),
    ]),
  ),
);
self.setTimeout = (callback, delay, ...args) => {
  if (typeof callback !== 'function') throw new TypeError('此运行器只接受函数形式的定时器。');
  pending++;
  const id = later(() => {
    timers.delete(id);
    try {
      callback(...args);
    } catch (error) {
      output('error', [error]);
    } finally {
      pending--;
      settle();
    }
  }, delay);
  timers.add(id);
  return id;
};
self.clearTimeout = (id) => {
  if (timers.delete(id)) pending--;
  cancel(id);
  settle();
};
self.setInterval = () => {
  throw new Error('本实验不支持无限周期定时器，请使用 setTimeout。');
};
self.addEventListener('error', (event) => {
  output('error', [event.message]);
  event.preventDefault();
});
self.addEventListener('unhandledrejection', (event) => {
  output('error', [event.reason]);
  event.preventDefault();
});
