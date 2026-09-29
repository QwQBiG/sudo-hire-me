import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { compareStringObjects, stringObjects } from '../../domain/identity.mjs';
import './identity.css';

type ObjectId = 'A' | 'B' | 'C';
type Reference = 'first' | 'second';

export default function Identity() {
  const [first, setFirst] = useState<ObjectId>('A');
  const [second, setSecond] = useState<ObjectId>('B');
  const [active, setActive] = useState<Reference>('second');
  const result = compareStringObjects(first, second);

  function pointTo(id: ObjectId) {
    if (active === 'first') setFirst(id);
    else setSecond(id);
  }

  return (
    <Experiment
      className="identity-lab"
      title="让两个引用指向对象"
      subtitle="固定三个显式创建的 String 对象。先选择变量，再点击对象；比较身份与内容两种关系。"
      onReset={() => {
        setFirst('A');
        setSecond('B');
        setActive('second');
      }}
    >
      <div className="identity-reference-switch" role="group" aria-label="选择要改变指向的变量">
        {(['first', 'second'] as const).map((name) => (
          <button
            key={name}
            type="button"
            className={active === name ? 'active' : ''}
            aria-pressed={active === name}
            onClick={() => setActive(name)}
          >
            <code>{name}</code>
            <ArrowRight size={15} aria-hidden="true" />
            <strong>{name === 'first' ? first : second}</strong>
          </button>
        ))}
      </div>
      <div className="identity-object-map" role="group" aria-label="为当前变量选择对象">
        {stringObjects.map((object: { id: ObjectId; value: string }) => (
          <button
            key={object.id}
            type="button"
            className={`identity-object ${first === object.id || second === object.id ? 'referenced' : ''}`}
            onClick={() => pointTo(object.id)}
            aria-label={`让 ${active} 指向对象 ${object.id}，内容 ${object.value}`}
            title={`让 ${active} 指向对象 ${object.id}`}
          >
            <small>对象 {object.id}</small>
            <strong>“{object.value}”</strong>
            <span>
              {first === object.id && <em>first</em>}
              {second === object.id && <em>second</em>}
              {first !== object.id && second !== object.id && '暂无引用'}
            </span>
          </button>
        ))}
      </div>
      <div className="identity-comparisons">
        <div className={result.sameObject ? 'true' : 'false'}>
          <code>first == second</code>
          <strong>{String(result.sameObject)}</strong>
          <span>是否同一个对象</span>
        </div>
        <div className={result.sameContent ? 'true' : 'false'}>
          <code>first.equals(second)</code>
          <strong>{String(result.sameContent)}</strong>
          <span>String 内容是否相同</span>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {result.sameObject
          ? `两个变量都指向对象 ${first}，所以身份与内容都相等。`
          : result.sameContent
            ? `对象 ${first} 与 ${second} 是两次独立创建的对象，但内容都是“${result.left.value}”。`
            : `对象 ${first} 与 ${second} 不同，内容也分别是“${result.left.value}”和“${result.right.value}”。`}
        这里的 A/B/C 是教学标识，不是内存地址。
      </p>
    </Experiment>
  );
}
