import { useState } from 'react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

export default function Representation({ lesson }: LabProps) {
  const slug = lesson.slug;
  const [text, setText] = useState(
    slug === 'text-encoding-utf8' ? 'A中🙂' : slug === 'floating-point-basics' ? '0.1' : '300',
  );
  const [start, setStart] = useState(2);
  const [end, setEnd] = useState(6);
  const [format, setFormat] = useState('32');
  function reset() {
    setText(
      slug === 'text-encoding-utf8' ? 'A中🙂' : slug === 'floating-point-basics' ? '0.1' : '300',
    );
    setStart(2);
    setEnd(6);
    setFormat('32');
  }
  if (slug === 'text-encoding-utf8') {
    const chars = Array.from(text);
    const graphemes = Array.from(
      new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text),
    );
    const hasUnpairedSurrogate = chars.some((char) => {
      const point = char.codePointAt(0)!;
      return point >= 0xd800 && point <= 0xdfff;
    });
    return (
      <Bench
        title="拆开文本的三层表示"
        subtitle="Unicode 码点 → UTF-8 字节；一个用户感知字符还可能由多个码点组成。"
        onReset={reset}
      >
        <label>
          输入文本
          <input value={text} maxLength={40} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="bench-actions">
          {['A中🙂', 'e\u0301', '👨‍👩‍👧', ''].map((example) => (
            <button className="secondary" key={example} onClick={() => setText(example)}>
              {example || '空文本'}
            </button>
          ))}
        </div>
        <div className="encoding-strips">
          {chars.map((char, i) => (
            <div className="encoding-char" key={i}>
              <strong>{char === ' ' ? '␠' : char}</strong>
              <code>U+{char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}</code>
              <div>
                {Array.from(new TextEncoder().encode(char)).map((byte, j) => (
                  <span key={j}>{byte.toString(16).toUpperCase().padStart(2, '0')}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bench-grid">
          <div className="bench-stat">
            <small>用户感知字符（字素簇）</small>
            <strong>{graphemes.length}</strong>
          </div>
          <div className="bench-stat">
            <small>UTF-16 代码单元</small>
            <strong>{text.length}</strong>
          </div>
          <div className="bench-stat">
            <small>Unicode 码点</small>
            <strong>{chars.length}</strong>
          </div>
          <div className="bench-stat">
            <small>UTF-8 字节</small>
            <strong>{new TextEncoder().encode(text).length}</strong>
          </div>
        </div>
        <Feedback>
          {hasUnpairedSurrogate &&
            '输入含孤立代理项，TextEncoder 会把它替换为 U+FFFD；以下不是对该代理项直接编码。'}
          ASCII 字符占 1 字节，“中”占 3 字节，示例表情占 4
          字节。修改文本时，码点数量和字节数量会各自变化，不能用字符数量直接计算 UTF-8 缓冲区大小。
        </Feedback>
      </Bench>
    );
  }
  if (slug === 'array-bounds-slices') {
    const xs = [4, 8, 15, 16, 23, 42, 50, 64];
    const valid = start >= 0 && end <= xs.length && start <= end;
    return (
      <Bench
        title="在数组上划出半开区间"
        subtitle="固定模型采用 [begin, end)，不进行负索引归一化或越界截断。"
        onReset={reset}
      >
        <div className="bench-controls">
          <label>
            begin = {start}
            <input
              type="range"
              min={-1}
              max={9}
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
            />
          </label>
          <label>
            end = {end}
            <input
              type="range"
              min={-1}
              max={9}
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="array-ruler">
          {xs.map((n, i) => (
            <button
              key={i}
              className={`array-slot ${valid && i >= start && i < end ? 'selected' : ''}`}
              onClick={() => {
                setStart(i);
                setEnd(i + 1);
              }}
              aria-label={`选中下标 ${i}`}
            >
              <small>{i}</small>
              <b>{n}</b>
              <span>{i === start ? 'begin' : i === end ? 'end' : ' '}</span>
            </button>
          ))}
          <div className="array-edge">
            <small>8</small>
            <b>边界</b>
          </div>
        </div>
        <pre className="bench-code">
          {valid
            ? `a[${start}:${end}] = [${xs.slice(start, end).join(', ')}]\nlength = ${end} - ${start} = ${end - start}`
            : `invalid range [${start}, ${end})`}
        </pre>
        <Feedback good={valid}>
          {valid
            ? start === end
              ? '合法空区间：两个边界相等，不包含任何元素。'
              : `包含下标 ${start} 到 ${end - 1}，不包含 end。end 可以等于数组长度，但不能访问 a[8]。`
            : '需要同时满足 0 ≤ begin ≤ end ≤ length。这个模型拒绝无效边界，不把它当作合法访问。'}
        </Feedback>
      </Bench>
    );
  }
  const number = Number(text);
  const valid = text.trim() !== '' && Number.isFinite(number);
  if (slug === 'type-conversion-casting') {
    const validInteger = valid && Number.isSafeInteger(number);
    const integer = Math.trunc(number);
    const byte = ((integer % 256) + 256) % 256;
    const javaInt = validInteger && integer >= -2147483648 && integer <= 2147483647;
    const signedByte = byte < 128 ? byte : byte - 256;
    return (
      <Bench
        title="把一个整数装进 8 个比特"
        subtitle="保留整数低 8 位：C uint8_t 按无符号解释，Java byte 按有符号解释。Java int 输入限于 32 位范围。"
        onReset={reset}
      >
        <label>
          原整数
          <input
            type="number"
            min={-100000}
            max={100000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="bench-actions">
          {[130, 255, 256, 300, -1].map((example) => (
            <button key={example} className="secondary" onClick={() => setText(String(example))}>
              {example}
            </button>
          ))}
        </div>
        <div className="bit-ribbon">
          {(validInteger ? byte.toString(2).padStart(8, '0') : '????????')
            .split('')
            .map((bit, i) => (
              <button
                key={i}
                className={bit === '1' ? 'set' : ''}
                disabled={!validInteger}
                aria-label={`翻转第 ${7 - i} 位，权重 ${2 ** (7 - i)}`}
                aria-pressed={bit === '1'}
                onClick={() => setText(String(byte ^ (1 << (7 - i))))}
              >
                <small>2^{7 - i}</small>
                <strong>{bit}</strong>
              </button>
            ))}
        </div>
        <div className="quality-path">
          <code>源整数 mod 256</code>
          <span>→</span>
          <output>{validInteger ? byte : '输入无效'}</output>
        </div>
        <div className="bench-grid">
          <div className="bench-stat">
            <small>源值</small>
            <strong>{validInteger ? integer : '无效'}</strong>
          </div>
          <div className="bench-stat">
            <small>uint8_t</small>
            <strong>{validInteger ? byte : '无效'}</strong>
          </div>
          <div className="bench-stat">
            <small>Java (byte) int</small>
            <strong>
              {!validInteger ? '无效整数输入' : javaInt ? signedByte : 'int 输入越界'}
            </strong>
          </div>
        </div>
        <Feedback good={valid && Number.isSafeInteger(number)}>
          {!valid || !Number.isSafeInteger(number)
            ? '请输入 JavaScript 可精确表示范围内的整数，避免把输入舍入误差当成转换结果。'
            : integer === byte
              ? `当前值在 uint8_t 的 0..255 范围内，按无符号解释没有丢值；${javaInt && integer > 127 ? `但 Java byte 同一位串解释为 ${signedByte}，并不能保留这个正整数。` : 'Java byte 的正数范围只到 127。'} 试试 130、256、300 或 -1。`
              : `${integer} 与无符号值 ${byte} 模 256 同余，高位信息没有保留下来。${javaInt ? `同一位串按 Java byte 解释为 ${signedByte}。` : '此值不能作为 Java int 输入。'} 不能从 8 位结果恢复原整数，也不能把 Java 规则套到 C 的所有有符号转换。`}
        </Feedback>
      </Bench>
    );
  }
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  const single = format === '32';
  if (single) view.setFloat32(0, number);
  else view.setFloat64(0, number);
  const actual = single ? view.getFloat32(0) : view.getFloat64(0);
  const bits = Array.from(new Uint8Array(buffer).slice(0, single ? 4 : 8))
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('');
  return (
    <Bench
      title="观察十进制数落在什么二进制位置"
      subtitle="浏览器 DataView 的 IEEE 754 表示；展示 binary32 与 binary64 的存储差异。"
      onReset={reset}
    >
      <Choice
        label="浮点格式"
        value={format}
        options={[
          ['32', 'binary32 · 32 位'],
          ['64', 'binary64 · 64 位'],
        ]}
        onChange={setFormat}
      />
      <label>
        十进制输入
        <input value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="bench-actions">
        {['0.1', '0.5', '16777217', '1e40'].map((example) => (
          <button key={example} className="secondary" onClick={() => setText(example)}>
            {example}
          </button>
        ))}
      </div>
      <div className="float-fields">
        <div>
          <small>符号</small>
          <code>{valid ? bits[0] : '—'}</code>
        </div>
        <div>
          <small>阶码</small>
          <code>{valid ? bits.slice(1, single ? 9 : 12) : '—'}</code>
        </div>
        <div>
          <small>尾数字段</small>
          <code>{valid ? bits.slice(single ? 9 : 12) : '—'}</code>
        </div>
      </div>
      <div className="quality-observation">
        <div>
          <small>相对浏览器已解析输入的误差</small>
          <output>
            {valid
              ? Number.isFinite(actual)
                ? (actual - number).toPrecision(8)
                : '目标格式溢出为无穷'
              : '—'}
          </output>
        </div>
        <div>
          <small>字段宽度</small>
          <output>
            1 / {single ? 8 : 11} / {single ? 23 : 52} bit
          </output>
        </div>
      </div>
      <div className="bench-stat">
        <small>存储值的十进制展示</small>
        <strong>{valid ? actual.toPrecision(single ? 20 : 21) : '无效输入'}</strong>
      </div>
      <div className="bench-code">0.1 + 0.2 = {(0.1 + 0.2).toPrecision(17)}</div>
      <Feedback good={valid}>
        {valid
          ? '有限位数的二进制尾数只能精确表示部分数。0.5 可以精确表示，0.1 通常只能舍入到附近值。binary64 的输入也已经由浏览器舍入，展示位数不是额外获得的精度。'
          : '请输入有限数值。'}
      </Feedback>
    </Bench>
  );
}
