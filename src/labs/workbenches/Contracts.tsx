import { useState } from 'react';
import { ArrowRight, Braces, Check, Plug, X } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

type ContractCase = {
  title: string;
  input: string;
  inputLabel: string;
  choices: [string, string][];
  run: (input: string, mode: string) => { code: string; value: string; note: string; ok: boolean };
};
const cases: Record<string, ContractCase> = {
  'callbacks-function-pointers': {
    title: '给同一条流水线换一个回调',
    input: '2,4,6',
    inputLabel: '输入整数序列',
    choices: [
      ['double', 'double(x)'],
      ['square', 'square(x)'],
      ['negate', 'negate(x)'],
    ],
    run: (text, mode) => {
      const xs = text.split(',').map(Number);
      const ys = xs.map((x) => (mode === 'double' ? x * 2 : mode === 'square' ? x * x : -x));
      const ok =
        text.split(',').every((value) => value.trim() !== '') &&
        xs.every(Number.isSafeInteger) &&
        ys.every(Number.isSafeInteger);
      const expression = mode === 'double' ? 'x * 2' : mode === 'square' ? 'x * x' : '-x';
      return {
        code: `map(values, callback)\ncallback(x) = ${expression}`,
        value: ok ? `[${ys.join(', ')}]` : '输入或结果超出本模型的整数范围',
        note: ok
          ? '遍历流程没有改变，调用点把每个元素交给你选择的函数。回调不必异步。'
          : '请输入逗号分隔的整数，不要保留空项；输入与结果都必须在精确整数范围内。',
        ok,
      };
    },
  },
  'generic-programming-basics': {
    title: '把类型送进约束检查器',
    input: '3,1,4',
    inputLabel: '候选数据',
    choices: [
      ['number', '有序整数'],
      ['text', '有序字符串'],
      ['opaque', '没有比较规则的对象'],
    ],
    run: (text, mode) => {
      const values = text.split(',').map((value) => value.trim());
      const valid = values.every(
        (value) => value !== '' && (mode !== 'number' || Number.isSafeInteger(Number(value))),
      );
      return {
        code: 'max<T: Comparable>(items: T[]) -> T',
        value:
          mode === 'opaque'
            ? '约束不满足'
            : !valid
              ? '输入无法解析'
              : mode === 'number'
                ? String(Math.max(...values.map(Number)))
                : (values.sort().at(-1) ?? ''),
        note:
          mode === 'opaque'
            ? '泛型复用算法，但算法仍然需要比较能力。先提供比较规则，不能只把类型名替换掉。'
            : !valid
              ? '候选项不能为空；整数模式只接受模型可精确表示的整数。'
              : '算法统一依赖比较契约。这里分别使用数值大小和字典序，二者的结果含义不同。',
        ok: mode !== 'opaque' && valid,
      };
    },
  },
  'null-option-absence': {
    title: '让缺失走进类型的另一条分支',
    input: 'Alice',
    inputLabel: '查找到的用户名（留空表示缺失）',
    choices: [
      ['match', '匹配 Some / None'],
      ['fallback', '提供默认值'],
      ['unwrap', '直接取值'],
    ],
    run: (text, mode) => ({
      code: text ? `Some("${text}")` : 'None',
      value:
        text || (mode === 'unwrap' ? '取值失败' : mode === 'fallback' ? 'guest' : '未找到用户'),
      note:
        !text && mode === 'unwrap'
          ? '缺失分支没有消失，强行取值把它变成了运行时失败。'
          : '明确处理缺失，并不等于把所有错误都转换为空字符串。',
      ok: !!text || mode !== 'unwrap',
    }),
  },
  'kotlin-null-safety': {
    title: '空值经过三个运算符',
    input: '',
    inputLabel: 'String? 的值（留空模拟 null）',
    choices: [
      ['safe', '?.length'],
      ['elvis', '?.length ?: 0'],
      ['bang', '!!.length'],
    ],
    run: (text, mode) => ({
      code: `val name: String? = ${text ? JSON.stringify(text) : 'null'}\nname${mode === 'safe' ? '?.length' : mode === 'elvis' ? '?.length ?: 0' : '!!.length'}`,
      value: text
        ? String(text.length)
        : mode === 'safe'
          ? 'null'
          : mode === 'elvis'
            ? '0'
            : 'NullPointerException',
      note:
        mode === 'bang'
          ? '!! 是非空断言，运行时为 null 会抛异常，并没有自动修好数据。'
          : '安全调用在 null 时跳过属性访问；Elvis 只在左侧为 null 时提供备用值。',
      ok: !!text || mode !== 'bang',
    }),
  },
  'java-equals-hashcode': {
    title: '把两个相等的键送入集合',
    input: 'Ada',
    inputLabel: '两个独立 Key 对象都包含的 name',
    choices: [
      ['consistent', 'equals + 一致 hashCode'],
      ['broken', '只重写 equals'],
      ['collision', '所有对象同一哈希值'],
    ],
    run: (text, mode) => ({
      code: `a = new Key(${JSON.stringify(text)})\nb = new Key(${JSON.stringify(text)})\na.equals(b) == true`,
      value: mode === 'broken' ? '模型集合中出现 2 个条目' : '集合中保留 1 个条目',
      note:
        mode === 'broken'
          ? '此模型给对象身份哈希指定不同值，相等对象落入不同桶。违反契约后，集合不再能保证预期行为；真实身份哈希不保证每次不同。'
          : mode === 'collision'
            ? '哈希碰撞不等于相等。这个哈希满足相等对象同哈希的要求，但大量碰撞降低效率。'
            : '先用哈希定位候选桶，再用 equals 判断相等；相等对象必须有相同哈希。',
      ok: mode !== 'broken',
    }),
  },
  'struct-enum-modeling': {
    title: '让数据模型挡住不可能的状态',
    input: 'pending',
    inputLabel: '状态：pending / success / failed',
    choices: [
      ['loose', '状态字符串 + 任意字段'],
      ['tagged', '带数据的枚举'],
    ],
    run: (text, mode) => ({
      code:
        mode === 'tagged'
          ? 'Pending | Success(value) | Failed(error)'
          : '{ status: string, value?, error? }',
      value: ['pending', 'success', 'failed'].includes(text)
        ? text === 'success'
          ? 'Success(42)'
          : text === 'failed'
            ? 'Failed("timeout")'
            : 'Pending'
        : mode === 'tagged'
          ? '无此枚举分支'
          : `{ status: "${text}" }`,
      note:
        mode === 'tagged'
          ? '枚举限定分支，每个分支携带自己的数据；结构体把一个实体的多个字段组合起来。'
          : '任意字符串容许拼写错误和未定义状态，还需要额外校验。',
      ok: mode === 'loose' || ['pending', 'success', 'failed'].includes(text),
    }),
  },
};

export default function Contracts({ lesson }: LabProps) {
  const config = cases[lesson.slug];
  const [input, setInput] = useState(config.input);
  const [mode, setMode] = useState(config.choices[0][0]);
  const result = config.run(input, mode);
  return (
    <Bench
      title={config.title}
      subtitle="契约与数据的可操作模型；结果随输入和实现改变。"
      onReset={() => {
        setInput(config.input);
        setMode(config.choices[0][0]);
      }}
    >
      <Choice value={mode} options={config.choices} label="选择实现" onChange={setMode} />
      <div className="contract-flow">
        <div>
          <label>
            {config.inputLabel}
            <input value={input} maxLength={100} onChange={(e) => setInput(e.target.value)} />
          </label>
          <div className="contract-port">
            <Plug size={22} />
            <span>输入 / 依赖</span>
          </div>
        </div>
        <ArrowRight className="contract-arrow" size={24} />
        <div>
          <div className="bench-label">
            <Braces size={18} /> 当前契约
          </div>
          <pre className="bench-code">{result.code}</pre>
        </div>
      </div>
      {lesson.slug === 'struct-enum-modeling' && (
        <div className="quality-lattice" aria-label="互斥状态分支">
          {[
            ['pending', 'Pending', '不携带结果'],
            ['success', 'Success(value)', '携带结果 42'],
            ['failed', 'Failed(error)', '携带错误 timeout'],
          ].map(([id, label, payload]) => (
            <button
              key={id}
              className={input === id ? 'active' : ''}
              aria-pressed={input === id}
              onClick={() => setInput(id)}
            >
              <code>{label}</code>
              <small>{payload}</small>
            </button>
          ))}
        </div>
      )}
      {lesson.slug === 'generic-programming-basics' && (
        <div className="quality-path">
          <code>T = {mode === 'number' ? 'Integer' : mode === 'text' ? 'String' : 'Opaque'}</code>
          <span>→</span>
          <code className={mode === 'opaque' ? 'blocked' : ''}>
            Comparable {mode === 'opaque' ? '✕' : '✓'}
          </code>
          <span>→</span>
          <output>{result.ok ? `max = ${result.value}` : '不能应用比较算法'}</output>
        </div>
      )}
      {lesson.slug === 'callbacks-function-pointers' && result.ok && (
        <div className="callback-conveyor" aria-label="逐项回调结果">
          {input
            .split(',')
            .slice(0, 8)
            .map((item, index) => (
              <div className="callback-row" key={index}>
                <code>{Number(item)}</code>
                <ArrowRight size={16} />
                <span>{mode === 'double' ? '× 2' : mode === 'square' ? 'x²' : '−x'}</span>
                <ArrowRight size={16} />
                <output>
                  {mode === 'double'
                    ? Number(item) * 2
                    : mode === 'square'
                      ? Number(item) ** 2
                      : -Number(item)}
                </output>
              </div>
            ))}
        </div>
      )}
      {lesson.slug === 'java-equals-hashcode' && (
        <div className="contract-buckets">
          <div className="contract-key-pair">
            <span>A · Key({input})</span>
            <span>B · Key({input})</span>
            <code>equals(A, B) = true</code>
          </div>
          <div className="contract-bucket">
            <small>模型哈希桶 3</small>
            <span>A</span>
            {mode !== 'broken' && <span>B → 相等，复用 A</span>}
          </div>
          <div className={`contract-bucket ${mode === 'broken' ? 'conflict' : 'empty'}`}>
            <small>模型哈希桶 7</small>
            <span>{mode === 'broken' ? 'B → 被当作另一个条目' : '空'}</span>
          </div>
        </div>
      )}
      {['null-option-absence', 'kotlin-null-safety'].includes(lesson.slug) && (
        <div className="absence-branches">
          <div className={input ? 'chosen' : ''}>
            <span>存在值</span>
            <code>{input ? JSON.stringify(input) : '—'}</code>
          </div>
          <div className={!input ? 'chosen' : ''}>
            <span>缺失值</span>
            <code>{lesson.slug === 'kotlin-null-safety' ? 'null' : 'None'}</code>
          </div>
          <ArrowRight size={20} />
          <div className={`branch-result ${result.ok ? '' : 'failed'}`}>
            <small>
              {mode === 'unwrap' || mode === 'bang' ? '直接取值 / 断言' : '明确处理分支'}
            </small>
            <output>{result.value}</output>
          </div>
        </div>
      )}
      <div className={`contract-result ${result.ok ? '' : 'rejected'}`}>
        {result.ok ? <Check size={24} /> : <X size={24} />}
        <div>
          <small>{result.ok ? '模型结果' : '契约 / 运行边界'}</small>
          <output>{result.value}</output>
        </div>
      </div>
      <Feedback good={result.ok}>{result.note}</Feedback>
    </Bench>
  );
}
