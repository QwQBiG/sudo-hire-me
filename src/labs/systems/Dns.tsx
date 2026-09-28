import { useState } from 'react';
import { Search, Clock3 } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { dnsQuery } from '../../domain/systems.mjs';
import './systems.css';

export default function Dns() {
  const [cache, setCache] = useState('none');
  const [age, setAge] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof dnsQuery> | null>(null);
  const reset = () => {
    setCache('none');
    setAge(0);
    setResult(null);
  };
  return (
    <Experiment
      title="这次 DNS 要问谁？"
      subtitle="教学 A 记录 www.example.com → 192.0.2.20 · 无别名链与过期应答扩展"
      onReset={reset}
    >
      <div className="experiment-controls sys-controls">
        <label>
          递归解析器的缓存
          <select
            value={cache}
            onChange={(event) => {
              setCache(event.target.value);
              setAge(0);
              setResult(null);
            }}
          >
            <option value="none">没有缓存</option>
            <option value="answer">最终 A 记录 · TTL 300 秒</option>
            <option value="delegation">仅缓存域名委派</option>
          </select>
        </label>
        <label>
          记录年龄：{age} 秒
          <input
            aria-label="DNS 记录年龄"
            type="range"
            min={0}
            max={360}
            step={30}
            value={age}
            disabled={cache !== 'answer'}
            onChange={(event) => {
              setAge(Number(event.target.value));
              setResult(null);
            }}
          />
        </label>
        <button onClick={() => setResult(dnsQuery(cache, age))}>
          <Search size={16} />
          查询 A 记录
        </button>
      </div>
      <div className="experiment-scene">
        <div className="sys-dns-map">
          {['客户端', '递归解析器', '根服务器', 'com 服务器', '权威服务器'].map((name) => (
            <div
              className="sys-dns-node"
              key={`${name}-${result?.path.length ?? 0}`}
              data-active={result?.path.includes(name) ?? false}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="experiment-metrics">
          <div className="metric">
            <small>缓存剩余寿命</small>
            <strong>{cache === 'answer' ? Math.max(0, 300 - age) : 0} s</strong>
          </div>
          <div className="metric">
            <small>这次返回的 TTL</small>
            <strong>{result ? `${result.ttl} s` : '未查询'}</strong>
          </div>
        </div>
        {result && (
          <div className="sys-output" role="log">
            {result.path.join(' → ')}
            <br />A = 192.0.2.20
          </div>
        )}
        <div className="sys-actions">
          <button
            disabled={!result}
            onClick={() => {
              setCache('answer');
              setAge(result?.hit ? age : 0);
              setResult(null);
            }}
          >
            <Clock3 size={15} />
            保存本次结果
          </button>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {result
          ? result.hit
            ? '仍有效的最终记录直接由递归解析器回答，不联系权威层次；本次命中不会把剩余 TTL 重置为 300。'
            : cache === 'delegation'
              ? '委派及服务器地址仍有效，解析器直接问权威服务器，再把结果返回客户端。'
              : '根与 com 返回委派，递归解析器继续询问；最终回答也经过递归解析器返回客户端。'
          : cache === 'answer'
            ? `记录剩余 TTL 为 ${Math.max(0, 300 - age)} 秒。${age >= 300 ? '此模型不允许直接使用过期记录。' : '记录尚未过期，可以直接复用。'}`
            : cache === 'delegation'
              ? 'example.com 的委派及权威服务器地址仍有效，但没有最终 A 记录；查询时可直接联系权威服务器。'
              : '尚未保存最终地址记录，取得答案需要联系上游服务器。'}
      </p>
    </Experiment>
  );
}
