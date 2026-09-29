import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { resolveJavaDispatch } from '../../domain/dispatch.mjs';
import './dispatch.css';

type AnimalType = 'Animal' | 'Dog' | 'Cat';
const typeNames = { Animal: '普通动物', Dog: '狗', Cat: '猫' };

export default function Dispatch() {
  const [actual, setActual] = useState<AnimalType>('Dog');
  const [declared, setDeclared] = useState<AnimalType>('Animal');
  const result = resolveJavaDispatch(actual, declared);
  const declaredChoices: AnimalType[] = actual === 'Animal' ? ['Animal'] : ['Animal', actual];

  return (
    <Experiment
      className="dispatch-lab"
      title="让同一个对象走两条方法查找路径"
      subtitle="固定 Java 类关系；重写后的实现看实际对象，静态 feed 重载的签名看变量声明类型。"
      onReset={() => {
        setActual('Dog');
        setDeclared('Animal');
      }}
    >
      <div className="experiment-controls dispatch-controls">
        <label>
          实际创建的对象
          <SelectField
            value={actual}
            onChange={(event) => {
              setActual(event.target.value as AnimalType);
              setDeclared('Animal');
            }}
          >
            <option value="Animal">Animal · 普通动物</option>
            <option value="Dog">Dog · 狗</option>
            <option value="Cat">Cat · 猫</option>
          </SelectField>
        </label>
        <label>
          接收对象的变量声明类型
          <SelectField
            value={declared}
            onChange={(event) => setDeclared(event.target.value as AnimalType)}
          >
            {declaredChoices.map((type) => (
              <option value={type} key={type}>
                {type} · {typeNames[type]}
              </option>
            ))}
          </SelectField>
        </label>
      </div>
      <div className="dispatch-declaration" aria-label={`当前 Java 声明：${result.declaration}`}>
        <span>当前 Java 声明</span>
        <code>{result.declaration}</code>
      </div>
      <div className="dispatch-fork" aria-hidden="true">
        <GitBranch size={22} />
        <span>同一变量，两种决策</span>
      </div>
      <div className="dispatch-lanes">
        <section className="dispatch-lane override" aria-label="方法重写和动态派发">
          <header>
            <strong>实例方法重写</strong>
            <code>pet.speak()</code>
          </header>
          <ol>
            <li>
              <small>编译期</small>
              <span>确认 {declared} 可调用 speak()</span>
            </li>
            <li>
              <small>运行期</small>
              <span>对象是 {actual}，查找其重写实现</span>
            </li>
          </ol>
          <output key={result.overrideTarget}>
            <small>最终调用</small>
            <strong>{result.overrideTarget}</strong>
            <span>“{result.overrideResult}”</span>
          </output>
        </section>
        <section className="dispatch-lane overload" aria-label="方法重载签名选择">
          <header>
            <strong>静态方法重载</strong>
            <code>feed(pet)</code>
          </header>
          <ol>
            <li>
              <small>编译期</small>
              <span>实参 pet 的静态类型是 {result.overloadArgumentType}</span>
            </li>
            <li>
              <small>候选签名</small>
              <span>feed(Animal)、feed(Dog)、feed(Cat)</span>
            </li>
          </ol>
          <output key={result.overloadTarget}>
            <small>选中的重载</small>
            <strong>{result.overloadTarget}</strong>
            <span>不因实际对象为 {actual} 而重新选签名</span>
          </output>
        </section>
      </div>
      <p className="experiment-status" role="status">
        {declared === actual
          ? `${actual} 对象经 ${declared} 变量访问：实例方法仍由实际对象决定；重载也恰好选中 ${result.overloadTarget}。改用 Animal 声明再比较。`
          : `实际对象是 ${actual}，声明类型是 ${declared}：pet.speak() 调用 ${result.overrideTarget}，而 feed(pet) 选择 ${result.overloadTarget}。`}{' '}
        这只是固定类关系的教学推演，并未编译 Java 代码。
      </p>
    </Experiment>
  );
}
