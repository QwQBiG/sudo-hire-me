import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { ArrowRight, Radio, Router, Send } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { advanceArp, arpDestinations, createArpState } from '../../domain/arp.mjs';
import './arp.css';

export default function Arp() {
  const [destination, setDestination] = useState('192.168.10.50');
  const [prefix, setPrefix] = useState(27);
  const [cached, setCached] = useState(false);
  const [state, setState] = useState(() => createArpState());
  const routed = state.phase !== 'idle';
  const mapped = !!state.cache[state.nextHop];

  function configure(nextDestination: string, nextPrefix: number, nextCached: boolean) {
    setDestination(nextDestination);
    setPrefix(nextPrefix);
    setCached(nextCached);
    setState(createArpState(nextDestination, nextPrefix, nextCached));
  }

  return (
    <Experiment
      title="先选下一跳，再封装这一帧"
      subtitle="本机 192.168.10.37；网关 192.168.10.33。只模拟一条直连路由和一条默认路由。"
      onReset={() => setState(createArpState(destination, prefix, cached))}
      className="arp-lab"
    >
      <div className="experiment-controls arp-controls">
        <label>
          最终目的 IP
          <SelectField
            value={destination}
            onChange={(event) => configure(event.target.value, prefix, cached)}
          >
            {arpDestinations.map(({ ip, label }) => (
              <option value={ip} key={ip}>
                {label} · {ip}
              </option>
            ))}
          </SelectField>
        </label>
        <label>
          本机前缀
          <SelectField
            value={prefix}
            onChange={(event) => configure(destination, Number(event.target.value), cached)}
          >
            {[26, 27, 28].map((value) => (
              <option value={value} key={value}>
                /{value}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="arp-cache-option">
          <input
            type="checkbox"
            checked={cached}
            onChange={(event) => configure(destination, prefix, event.target.checked)}
          />
          缓存已有映射
        </label>
      </div>

      <div className="arp-route" aria-label="本机、网关、最终目标之间的路径">
        <div className="arp-node" data-active="true">
          <small>本机</small>
          <strong>192.168.10.37/{prefix}</strong>
          <span>出站接口</span>
        </div>
        <ArrowRight aria-hidden="true" size={22} />
        <div className="arp-node arp-router" data-active={routed && !state.direct}>
          <Router aria-hidden="true" size={19} />
          <small>默认网关</small>
          <strong>192.168.10.33</strong>
          <span>{routed && state.direct ? '直连时跳过' : '跨网段下一跳'}</span>
        </div>
        <ArrowRight aria-hidden="true" size={22} />
        <div
          className="arp-node arp-destination"
          data-active={routed && (state.direct || state.phase === 'sent')}
        >
          <small>最终目标</small>
          <strong>{destination}</strong>
          <span>{routed && state.direct ? '本次直接交付' : 'IP 目的地址'}</span>
        </div>
      </div>

      <div className="arp-addresses">
        <div>
          <small>IP 数据报 · 最终目的</small>
          <strong>{destination}</strong>
        </div>
        <div>
          <small>当前以太帧 · 目的 MAC</small>
          <strong>{routed && mapped ? state.nextHopMac : '待解析下一跳'}</strong>
        </div>
      </div>

      <div className="arp-actions" aria-label="ARP 交付步骤">
        <button
          disabled={state.phase !== 'idle'}
          onClick={() => setState((old) => advanceArp(old, 'route'))}
        >
          <Router size={16} /> 判断下一跳
        </button>
        <button
          disabled={state.phase !== 'route' || mapped}
          onClick={() => setState((old) => advanceArp(old, 'request'))}
        >
          <Radio size={16} /> 广播 ARP 请求
        </button>
        <button
          disabled={state.phase !== 'request'}
          onClick={() => setState((old) => advanceArp(old, 'reply'))}
        >
          <ArrowRight size={16} /> 收到 ARP 应答
        </button>
        <button
          disabled={!routed || !mapped || state.phase === 'sent' || state.phase === 'request'}
          onClick={() => setState((old) => advanceArp(old, 'send'))}
        >
          <Send size={16} /> 发出以太帧
        </button>
      </div>

      <p className="experiment-status arp-status" role="status">
        {state.message}
      </p>
      <div className="arp-log">
        <strong>本次路径</strong>
        {state.events.length ? (
          <ol>
            {state.events.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ol>
        ) : (
          <p>等待路由判断。</p>
        )}
      </div>
    </Experiment>
  );
}
