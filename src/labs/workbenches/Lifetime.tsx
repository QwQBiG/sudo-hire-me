import { useState } from 'react';
import { Box, DoorOpen, KeyRound, Lock, Plus, Trash2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';

const cases: Record<string, [string, string, string]> = {
  'stack-vs-heap': [
    '离开函数之后，谁还活着',
    'local / heap',
    '函数作用域退出与动态存储释放是两个不同事件。',
  ],
  'variable-scope-lifetime': [
    '名字消失，资源也消失吗',
    'name / storage',
    '作用域描述能否使用名字；生命周期描述对象是否仍存在。',
  ],
  'constructor-initialization': [
    '组装一个派生对象',
    'Base → members → body',
    'C++ 示例：成员按声明顺序初始化，不按初始化列表书写顺序。',
  ],
  'c-malloc-free': [
    '给每次分配找到归宿',
    'malloc / free',
    '固定成功分配的 C 教学模型；free 不会自动把调用方指针改成 NULL。',
  ],
  'c-undefined-behavior': [
    '在失效的地址前停下来',
    'allocate / release / access',
    '模型标记未定义行为的触发条件，不预测真实 C 程序会输出什么。',
  ],
  'cpp-raii': [
    '异常出口也要释放资源',
    'constructor / destructor',
    '局部 RAII 对象在正常退出或栈展开时析构；不模拟进程直接终止。',
  ],
  'cpp-virtual-destructor': [
    '经基类指针删除对象',
    'Base* → Derived',
    '固定普通 delete 表达式；基类非虚析构时此用法属于未定义行为。',
  ],
  'rust-borrowing-lifetimes': [
    '给借用发放通行证',
    '&T / &mut T',
    '共享借用可有多个；活跃的独占借用不能与其他借用重叠。',
  ],
  'zig-error-union-defer': [
    '沿成功和错误出口清理资源',
    'defer / errdefer',
    'defer 在所属作用域退出时执行；errdefer 只在错误返回时执行。',
  ],
};

export default function Lifetime({ lesson }: LabProps) {
  const slug = lesson.slug;
  const [title, code, intro] = cases[slug];
  const [alive, setAlive] = useState(false);
  const [scope, setScope] = useState(true);
  const [pointer, setPointer] = useState(false);
  const [borrows, setBorrows] = useState<string[]>([]);
  const [mode, setMode] = useState(slug === 'zig-error-union-defer' ? 'defer' : 'safe');
  const [events, setEvents] = useState<string[]>([]);
  const [note, setNote] = useState(intro);
  const [bad, setBad] = useState(false);
  const borrow = slug === 'rust-borrowing-lifetimes';
  const constructor = slug === 'constructor-initialization';
  const storageLesson = ['stack-vs-heap', 'variable-scope-lifetime'].includes(slug);
  const automatic = storageLesson && mode === 'automatic';
  const managed = ['cpp-raii', 'zig-error-union-defer'].includes(slug);
  function reset() {
    setAlive(false);
    setScope(true);
    setPointer(false);
    setBorrows([]);
    setEvents([]);
    setNote(intro);
    setBad(false);
  }
  function report(text: string, invalid = false) {
    setNote(text);
    setBad(invalid);
    setEvents((rows) => [text, ...rows].slice(0, 6));
  }
  function acquire() {
    if (!scope) return report('当前作用域已经退出，请重置后重新进入。', true);
    if (alive) return report('资源已经分配；重复覆盖唯一指针会让原分配失去归宿。', true);
    setAlive(true);
    setPointer(true);
    report('资源 R1 分配成功，owner 指向它。');
  }
  function release() {
    if (!scope) return report('名字已经离开作用域，当前代码不能再通过它访问或释放资源。', true);
    if (!alive && !pointer) return report('当前指针为 NULL。C 的 free(NULL) 是无操作。');
    if (!alive)
      return report(
        pointer
          ? '对已经释放的地址再次 free：未定义行为，不能推测输出。'
          : '当前没有待释放的资源。',
        true,
      );
    if (borrows.length) return report('借用仍在使用，资源不能在这些借用结束前被释放。', true);
    setAlive(false);
    if (borrow) {
      setPointer(false);
      report('拥有者被 drop，值不再可用；后续使用会被静态检查拒绝。');
    } else report('资源已释放。普通 C 指针里仍保留原地址，它现在悬空。');
  }
  function leave(error: boolean) {
    if (!scope) return report('作用域已经退出。');
    if (borrow && borrows.length)
      return report('本模型中的借用还将在退出后使用，无法通过生命周期检查；先结束这些借用。', true);
    const cleanup =
      automatic ||
      borrow ||
      slug === 'cpp-raii' ||
      (slug === 'zig-error-union-defer' && (mode === 'defer' || error));
    setScope(false);
    if (cleanup) {
      setAlive(false);
      setPointer(false);
    }
    report(
      cleanup
        ? `${error ? '错误返回 / 异常栈展开' : '正常退出'}触发清理，资源被释放。`
        : alive
          ? '名字已离开作用域，但动态分配仍然存在。没有其他拥有者时，这会形成泄漏。'
          : '退出作用域，没有存活的动态分配。',
      !cleanup && alive,
    );
  }
  return (
    <Bench title={title} subtitle={intro} onReset={reset}>
      <div className="bench-code">{code}</div>
      {storageLesson && (
        <Choice
          label="存储期"
          value={mode}
          options={[
            ['safe', '动态分配的对象'],
            ['automatic', '自动存储期局部对象'],
          ]}
          onChange={(value) => {
            setMode(value);
            reset();
          }}
        />
      )}
      {slug === 'zig-error-union-defer' && (
        <Choice
          label="清理注册"
          value={mode}
          options={[
            ['defer', 'defer'],
            ['errdefer', 'errdefer'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
      )}
      {slug === 'cpp-virtual-destructor' && (
        <Choice
          label="基类析构函数"
          value={mode}
          options={[
            ['safe', 'virtual ~Base()'],
            ['unsafe', '~Base()'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
      )}
      <div className="lifetime-stage">
        <div className={`lifetime-scope ${scope ? '' : 'closed'}`}>
          <DoorOpen size={24} />
          <small>调用作用域</small>
          <strong>{scope ? '存活' : '已退出'}</strong>
          <code>{scope ? `owner ${pointer ? '→ R1' : '= null'}` : 'owner 已不可见'}</code>
        </div>
        <div className="lifetime-link">
          <KeyRound size={22} />
          <span>{borrows.length ? `${borrows.length} 个借用` : '持有关系'}</span>
        </div>
        <div className={`lifetime-resource ${alive ? 'alive' : ''}`}>
          <Box size={30} />
          <small>{automatic ? '自动存储期对象 R1' : '资源 R1'}</small>
          <strong>{alive ? '已分配' : '未分配 / 已释放'}</strong>
          <span>{borrows.join(' + ') || '无活跃借用'}</span>
        </div>
      </div>
      {constructor ? (
        <div className="bench-actions">
          {['Base 构造', '成员 first', '成员 second', 'Derived 函数体'].map((label, i) => (
            <button
              className="secondary"
              key={label}
              disabled={events.length > i}
              onClick={() => {
                if (events.length !== i)
                  return setNote(
                    `还不能执行 ${label}：必须先完成 ${['Base 构造', '成员 first', '成员 second', 'Derived 函数体'][events.length]}。`,
                  );
                setEvents((all) => [...all, label]);
                setAlive(true);
                setNote(
                  i === 3
                    ? '对象构造完成。逆序析构时先 Derived 函数体，再成员 second、first，最后 Base。'
                    : `${label} 已完成；后续初始化可以依赖已完成的部分。`,
                );
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="bench-actions">
          <button className="primary" onClick={acquire}>
            <Plus size={16} /> 分配资源
          </button>
          {borrow ? (
            <>
              {['&T', '&mut T'].map((kind) => (
                <button
                  className="secondary"
                  key={kind}
                  onClick={() => {
                    if (
                      !alive ||
                      borrows.includes('&mut T') ||
                      (kind === '&mut T' && borrows.length > 0)
                    )
                      return report(
                        '这个借用与当前状态冲突，编译期应拒绝，已有状态没有改变。',
                        true,
                      );
                    setBorrows((all) => [...all, kind]);
                    report(`${kind} 借用生效。`);
                  }}
                >
                  <Lock size={16} /> 借用 {kind}
                </button>
              ))}
              <button
                className="secondary"
                onClick={() => {
                  setBorrows([]);
                  report('借用最后一次使用已结束，拥有者可以重新取得修改权限。');
                }}
              >
                结束借用
              </button>
            </>
          ) : (
            <button
              className="secondary"
              onClick={() =>
                report(
                  !scope
                    ? '名字已经离开作用域，不能再从这里访问。'
                    : alive && pointer
                      ? '沿有效指针访问资源成功。'
                      : '此时没有可访问的有效对象；在 C 中解引用悬空指针属于未定义行为。',
                  !(scope && alive && pointer),
                )
              }
            >
              访问资源
            </button>
          )}
          <button
            className="secondary"
            disabled={automatic || managed || !scope}
            onClick={
              slug === 'cpp-virtual-destructor'
                ? () => {
                    if (!alive) return report('先创建 Derived 对象。', true);
                    if (mode === 'unsafe')
                      return report(
                        '通过没有虚析构的 Base* 删除 Derived：未定义行为，不能把结果描述成固定漏掉某个析构。',
                        true,
                      );
                    setAlive(false);
                    report('动态分派析构：~Derived → ~Base，随后释放存储。');
                  }
                : release
            }
          >
            <Trash2 size={16} />{' '}
            {slug === 'cpp-virtual-destructor'
              ? 'delete Base*'
              : borrow
                ? 'drop 拥有者'
                : automatic || managed
                  ? '随作用域清理'
                  : '释放资源'}
          </button>
          <button className="secondary" onClick={() => leave(false)}>
            正常退出
          </button>
          {['cpp-raii', 'zig-error-union-defer'].includes(slug) && (
            <button className="secondary" onClick={() => leave(true)}>
              错误退出
            </button>
          )}
        </div>
      )}
      <Feedback good={!bad}>{note}</Feedback>
      <ol className="bench-log">
        {events.map((event, i) => (
          <li key={`${event}-${i}`}>
            <code>{String(events.length - i).padStart(2, '0')}</code>
            {event}
          </li>
        ))}
      </ol>
    </Bench>
  );
}
