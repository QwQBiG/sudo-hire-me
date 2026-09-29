import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowLeftRight, Send, Clock3, FilePenLine } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { cacheRequest } from '../../domain/systems.mjs';
import './systems.css';

export default function HttpCache() {
  const [cached, setCached] = useState<number | null>(null);
  const [server, setServer] = useState(1);
  const [age, setAge] = useState(0);
  const [policy, setPolicy] = useState('max-age');
  const [message, setMessage] = useState('缓存为空；第一次请求需要取得完整正文。');
  const [status, setStatus] = useState('未请求');
  const [network, setNetwork] = useState<boolean | null>(null);
  const reset = () => {
    setCached(null);
    setServer(1);
    setAge(0);
    setPolicy('max-age');
    setStatus('未请求');
    setNetwork(null);
    setMessage('缓存为空；第一次请求需要取得完整正文。');
  };
  const request = () => {
    const result = cacheRequest(cached, server, age, policy);
    setCached(result.cachedVersion);
    setAge(result.age);
    setStatus(result.status);
    setNetwork(result.network);
    setMessage(result.message);
  };
  return (
    <Experiment
      title="浏览器缓存与源站之间"
      subtitle="GET、单资源与实体标签（Entity Tag，ETag）模型 · 忽略网络时延、Age 与共享缓存"
      onReset={reset}
    >
      <div className="experiment-controls sys-controls">
        <label>
          响应策略（切换后清空实验缓存）
          <SelectField
            value={policy}
            onChange={(event) => {
              setPolicy(event.target.value);
              setCached(null);
              setAge(0);
              setStatus('未请求');
              setNetwork(null);
              setMessage('以空缓存开始新的策略实验；不是源站远程删除浏览器缓存。');
            }}
          >
            <option value="max-age">Cache-Control: max-age=60</option>
            <option value="no-cache">Cache-Control: no-cache</option>
            <option value="no-store">Cache-Control: no-store</option>
          </SelectField>
        </label>
        <button onClick={request}>
          <Send size={16} />
          GET /lesson.json
        </button>
      </div>
      <div className="experiment-scene">
        <div className="sys-cache-line">
          <div className="sys-cache-node">
            <span>浏览器缓存</span>
            <strong>{cached === null ? '空' : `v${cached}`}</strong>
            <code>{cached === null ? '无验证器' : `ETag: "v${cached}"`}</code>
          </div>
          <ArrowLeftRight size={24} />
          <div className="sys-cache-node">
            <span>源站当前内容</span>
            <strong>v{server}</strong>
            <code>ETag: "v{server}"</code>
          </div>
        </div>
        <label>
          本地保存后的年龄：{age} 秒
          <progress className="sys-cache-age" max={60} value={Math.min(age, 60)} />
        </label>
        <div className="sys-actions">
          <button
            disabled={cached === null}
            onClick={() => {
              setAge(age + 30);
              setMessage('时间前进了 30 秒；尚未产生新的请求。');
            }}
          >
            <Clock3 size={15} />
            经过 30 秒
          </button>
          <button
            onClick={() => {
              setServer(server + 1);
              setMessage('源站内容已改变；浏览器在下次需要联系源站之前并不知道。');
            }}
          >
            <FilePenLine size={15} />
            修改源站内容
          </button>
        </div>
        <div className="experiment-metrics">
          <div className="metric">
            <small>最近一次结果</small>
            <strong>{status}</strong>
          </div>
          <div className="metric">
            <small>最近一次是否联网</small>
            <strong>{network === null ? '未请求' : network ? '是' : '否'}</strong>
          </div>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {message}
        {policy === 'no-cache'
          ? ' no-cache 允许保存，但每次复用前必须成功验证。'
          : policy === 'no-store'
            ? ' no-store 禁止保存本次响应，不等于清除所有过去的缓存。'
            : ' 年龄恰好为 60 秒时已不新鲜。'}
      </p>
    </Experiment>
  );
}
