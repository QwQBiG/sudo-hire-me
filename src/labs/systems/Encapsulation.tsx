import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { forwardingFrame } from '../../domain/systems.mjs';
import './systems.css';
import './systems-quality.css';

const notes = [
  '应用解释 ADD 2 3 的求和含义；TCP 不执行加法。',
  '传输端口标识通信端点，不因普通路由转发而改变。',
  '无地址转换时，源与目的 IP 保持；路由器减小 TTL。',
  '以太网帧只负责当前一跳。路由器出口重新封装下一跳地址。',
];
export default function Encapsulation() {
  const [hop, setHop] = useState(0);
  const [layer, setLayer] = useState(3);
  const [ttl, setTtl] = useState(64);
  const frame = forwardingFrame(hop, ttl);
  return (
    <Experiment
      title="拆开一份网络包"
      subtitle="IPv4 与以太网 · 无地址转换、分片或隧道 · TCP 已建连"
      onReset={() => {
        setHop(0);
        setLayer(3);
        setTtl(64);
      }}
    >
      <div className="experiment-controls sys-controls">
        <label>
          观察链路
          <SelectField value={hop} onChange={(event) => setHop(Number(event.target.value))}>
            <option value={0}>客户端 → 路由器入口</option>
            <option value={1}>路由器出口 → 服务器</option>
          </SelectField>
        </label>
        <label>
          初始 TTL
          <SelectField value={ttl} onChange={(event) => setTtl(Number(event.target.value))}>
            <option value={64}>64</option>
            <option value={2}>2</option>
            <option value={1}>1</option>
          </SelectField>
        </label>
      </div>
      <div className="experiment-scene">
        <div className="sys-layers">
          {[
            ['应用消息', 'ADD 2 3'],
            ['TCP 报文段', '50000 → 8080'],
            ['IPv4 数据包', `192.0.2.10 → 198.51.100.20 · TTL=${frame.ttl}`],
            [
              '以太网帧',
              frame.dropped ? '未发送：TTL 已耗尽' : `${frame.source} → ${frame.destination}`,
            ],
          ].map(([title, value], index) => (
            <button
              className="sys-layer"
              aria-pressed={layer === index}
              onClick={() => setLayer(index)}
              key={title}
            >
              <strong>{title}</strong>
              <code>{value}</code>
            </button>
          ))}
        </div>
        <div className="sys-formula">
          A <ArrowRight size={18} /> 路由器 <ArrowRight size={18} /> {frame.dropped ? '丢弃' : 'S'}
        </div>
      </div>
      <p className="experiment-status" role="status">
        {frame.dropped
          ? 'TTL 减到 0，路由器丢弃该包，不再发往下一跳；源与目的 IP 没有因此变成路由器地址。'
          : notes[layer]}
      </p>
    </Experiment>
  );
}
