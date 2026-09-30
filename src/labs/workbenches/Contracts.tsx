import { useState } from 'react';
import { ArrowRight, Braces, Check, Plug, X } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';

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
  'oop-abstraction': {
    title: '插拔存储实现，保留调用契约',
    input: 'hello',
    inputLabel: '调用 save 的内容',
    choices: [
      ['memory', 'MemoryStore'],
      ['file', 'FileStore'],
      ['broken', '只有 load 的实现'],
    ],
    run: (text, mode) => ({
      code: `Storage.save(${JSON.stringify(text)})`,
      value:
        mode === 'broken'
          ? '缺少 save 能力'
          : mode === 'memory'
            ? `memory[0] = ${JSON.stringify(text)}`
            : `file bytes = ${new TextEncoder().encode(text).length}`,
      note:
        mode === 'broken'
          ? '实现缺少调用方依赖的行为，不能满足接口契约。'
          : '调用方只依赖 save 的约定。这里模拟两种实现的可观察结果，没有真实写入文件。',
      ok: mode !== 'broken',
    }),
  },
  'oop-inheritance-composition': {
    title: '更换部件，检验替代关系',
    input: '12',
    inputLabel: '待通知的消息数量',
    choices: [
      ['compose', '组合 Sender 部件'],
      ['valid', '实现 Notifier 接口'],
      ['invalid', '继承后禁用 notify'],
    ],
    run: (text, mode) => ({
      code:
        mode === 'compose'
          ? 'Notifier(sender).notify(message)'
          : 'BaseNotifier ref = implementation\nref.notify(message)',
      value: mode === 'invalid' ? '调用约定被破坏' : `${Number(text) || 0} 条消息交给发送能力`,
      note:
        mode === 'invalid'
          ? '子类拒绝基类承诺支持的操作，会破坏可替代性。仅仅复用代码不足以证明应该继承。'
          : mode === 'compose'
            ? 'Notifier 持有发送部件，可以替换部件而不改变自己的类型关系。'
            : '满足父契约的实现可以被调用方替换使用。',
      ok: mode !== 'invalid',
    }),
  },
  'oop-interface-abstract-class': {
    title: '把能力与共享状态放到合适的位置',
    input: '3',
    inputLabel: '本次调用需要记录的次数',
    choices: [
      ['interface', '接口：承诺 save()'],
      ['abstract', '抽象类：共享计数状态'],
      ['missing', '具体类漏实现 save()'],
    ],
    run: (text, mode) => ({
      code:
        mode === 'interface'
          ? 'class Store implements Savable'
          : 'class Store extends CountingStore',
      value:
        mode === 'missing'
          ? '具体类无法满足契约'
          : mode === 'abstract'
            ? `共享实现将 calls += ${Number(text) || 0}`
            : '调用具体实现的 save()',
      note:
        mode === 'abstract'
          ? '抽象类可以集中维护实例状态和公共实现；是否适合继承仍要检查类型关系。'
          : mode === 'missing'
            ? '非抽象的具体类必须提供所需行为。'
            : '接口表达角色与能力；现代 Java 接口也可有默认方法，但没有普通实例字段。',
      ok: mode !== 'missing',
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
