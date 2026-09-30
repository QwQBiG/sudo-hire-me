import { useState } from 'react';
import { ArrowRight, Clock3, Globe, Laptop, Send, Server, ShieldCheck, Unplug } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback, Meter } from './Bench';

const titles: Record<string, string> = {
  'nat-basic': '把返回包送回正确的内网主机',
  'tcp-retransmission-rto': '丢掉 ACK，观察重传计时器',
  'tcp-flow-congestion': '两个窗口一起限制发送额度',
  'dns-cache-ttl': '改掉记录，再向缓存发起查询',
  'http1-keepalive': '让多个请求复用同一条连接',
  'http2-multiplexing': '把不同流的帧装进同一条连接',
  'http-status-codes': '让请求经过真实的条件判断',
  'cookie-session-token': '让登录凭据走完一次往返',
  'tls-handshake-basic': '让握手条件决定能否发送应用数据',
};
export default function Network({ lesson }: LabProps) {
  const s = lesson.slug;
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState('first');
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);
  const [flag, setFlag] = useState(false);
  const [second, setSecond] = useState(false);
  const [third, setThird] = useState(true);
  const [rwnd, setRwnd] = useState(6);
  const [cwnd, setCwnd] = useState(4);
  const [flight, setFlight] = useState(0);
  const [rto, setRto] = useState(1000);
  const [cache, setCache] = useState<{ ip: string; until: number } | null>(null);
  const [mappings, setMappings] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [note, setNote] = useState('发起操作，观察链路两端和中间状态。');
  function record(line: string) {
    setNote(line);
    setLogs((xs) => [line, ...xs].slice(0, 5));
  }
  function reset() {
    setTime(0);
    setCount(0);
    setOther(0);
    setFlag(false);
    setSecond(false);
    setThird(true);
    setFlight(0);
    setRto(1000);
    setCache(null);
    setMappings([]);
    setLogs([]);
    setNote('链路状态已重置。');
  }
  let body;
  if (s === 'nat-basic')
    body = (
      <>
        <div className="network-stations">
          <div>
            <Laptop size={28} />
            <b>192.168.1.10</b>
            <span>192.168.1.11</span>
          </div>
          <ArrowRight />
          <div>
            <Globe size={28} />
            <b>203.0.113.8</b>
            <span>NAT 映射</span>
          </div>
          <ArrowRight />
          <div>
            <Server size={28} />
            <b>198.51.100.20</b>
            <span>:443</span>
          </div>
        </div>
        <div className="bench-actions">
          {['192.168.1.10', '192.168.1.11'].map((ip) => (
            <button
              className="primary"
              key={ip}
              onClick={() => {
                if (!mappings.includes(ip)) setMappings([...mappings, ip]);
                record(
                  `${ip}:5000 发出连接，公网源端口分配为 ${40000 + (mappings.includes(ip) ? mappings.indexOf(ip) : mappings.length)}。`,
                );
              }}
            >
              <Send size={16} />
              {ip.slice(-2)} 发包
            </button>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>内部端点</th>
              <th>转换端点</th>
              <th>返回路径</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((ip, i) => (
              <tr key={ip}>
                <td>{ip}:5000</td>
                <td>203.0.113.8:{40000 + i}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() =>
                      record(
                        `返回目的端口 ${40000 + i} 命中映射，转换为 ${ip}:5000；共同的公网 IP 本身不足以区分这两条连接。`,
                      )
                    }
                  >
                    送回此端口 <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  else if (s === 'tcp-retransmission-rto')
    body = (
      <>
        <div className="rto-clock">
          <Clock3 size={32} />
          <strong>{time} ms</strong>
          <span>{flag ? '计时器运行中' : '计时器未运行'}</span>
        </div>
        <Meter label={`当前 RTO = ${rto} ms · 重传 ${count} 次`} value={time} max={rto} />
        <div className="bench-actions">
          <button
            className="primary"
            disabled={flag}
            onClick={() => {
              setFlag(true);
              setTime(0);
              record('发送数据段并启动计时器。模拟 ACK 尚未到达。');
            }}
          >
            发送数据
          </button>
          <button
            className="secondary"
            disabled={!flag}
            onClick={() => {
              const next = time + 500;
              if (next >= rto) {
                setTime(0);
                setRto(Math.min(64000, rto * 2));
                setCount(count + 1);
                record('计时器到期，重传最早未确认段，并将 RTO 加倍。本例未计算新的 RTT 样本。');
              } else {
                setTime(next);
                record('还没有等满一个 RTO，不允许提前进行此次超时重传。');
              }
            }}
          >
            <Clock3 size={16} />
            时间 +500 ms
          </button>
          <button
            className="secondary"
            disabled={!flag}
            onClick={() => {
              setFlag(false);
              setTime(0);
              record('确认全部未确认数据，停止重传计时器。重传段的歧义 ACK 不用于普通 RTT 采样。');
            }}
          >
            送达 ACK
          </button>
        </div>
      </>
    );
  else if (s === 'tcp-flow-congestion') {
    const limit = Math.min(rwnd, cwnd);
    body = (
      <>
        <div className="bench-controls">
          <label>
            接收窗口 rwnd = {rwnd} 段
            <input
              type="range"
              min={0}
              max={10}
              value={rwnd}
              onChange={(e) => setRwnd(Number(e.target.value))}
            />
          </label>
          <label>
            拥塞窗口 cwnd = {cwnd} 段
            <input
              type="range"
              min={1}
              max={10}
              value={cwnd}
              onChange={(e) => setCwnd(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="window-credits">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < flight ? 'flight' : i < limit ? 'available' : ''}>
              {i < flight ? '在途' : i < limit ? '可发' : '受限'}
            </span>
          ))}
        </div>
        <div className="bench-code">
          可新发 = max(0, min({rwnd}, {cwnd}) - {flight}) = {Math.max(0, limit - flight)} 段
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={flight >= limit}
            onClick={() => {
              setFlight(flight + 1);
              record('新数据占用在途额度，ACK 到达后才释放。接收窗口与网络拥塞窗口解决不同约束。');
            }}
          >
            发送 1 段
          </button>
          <button
            className="secondary"
            disabled={!flight}
            onClick={() => {
              setFlight(flight - 1);
              record('确认 1 段，释放一个在途位置。这里固定 cwnd，不模拟拥塞算法增长。');
            }}
          >
            确认 1 段
          </button>
        </div>
      </>
    );
  } else if (s === 'dns-cache-ttl') {
    const ip = flag ? '203.0.113.20' : '203.0.113.10';
    body = (
      <>
        <div className="network-stations">
          <div>
            <Laptop size={28} />
            <b>客户端</b>
            <span>app.example</span>
          </div>
          <ArrowRight />
          <div>
            <DatabaseIcon />
            <b>{cache?.ip ?? '缓存为空'}</b>
            <span>TTL 剩余 {cache ? Math.max(0, cache.until - time) : 0}s</span>
          </div>
          <ArrowRight />
          <div>
            <Server size={28} />
            <b>{ip}</b>
            <span>权威记录</span>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              if (cache && time < cache.until)
                record(`返回缓存 ${cache.ip}，尚未到期，不查询权威服务器。`);
              else {
                setCache({ ip, until: time + 30 });
                record(`缓存已过期或为空，取得 ${ip}，TTL 从现在计 30 秒。`);
              }
            }}
          >
            查询 DNS
          </button>
          <button
            className="secondary"
            onClick={() => {
              setFlag(!flag);
              record('权威记录已改变；已有递归缓存不会因此被自动推送刷新。');
            }}
          >
            切换权威 IP
          </button>
          <button className="secondary" onClick={() => setTime(time + 10)}>
            时间 +10s
          </button>
        </div>
      </>
    );
  } else if (s === 'http1-keepalive')
    body = (
      <>
        <Choice
          label="连接策略"
          value={mode}
          options={[
            ['first', '复用持久连接'],
            ['close', '每次请求关闭'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="connection-track">
          <div className="connection-wire">
            <Laptop size={30} />
            <span className={flag ? 'connected' : ''}>{flag ? 'TCP 已连接' : 'TCP 未连接'}</span>
            <Server size={30} />
          </div>
          <div className="bench-tokens">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className="bench-token done">
                R{i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            disabled={count >= 8}
            onClick={() => {
              setCount(count + 1);
              if (!flag) {
                setOther(other + 1);
              }
              setFlag(mode === 'first');
              record(
                flag
                  ? '复用既有连接发送请求；本例依次等待每个响应，不启用流水线。'
                  : '先建立连接再发送请求。HTTP 持久连接与 TCP keepalive 探测是不同概念。',
              );
            }}
          >
            完成一次请求
          </button>
          <button
            className="secondary"
            onClick={() => {
              setFlag(false);
              record('服务器关闭空闲连接，下次请求需要重新建连。');
            }}
          >
            <Unplug size={16} />
            关闭连接
          </button>
        </div>
        <Feedback>
          已完成 {count} 次请求，共建立 {other} 条 TCP 连接。
        </Feedback>
      </>
    );
  else if (s === 'http2-multiplexing')
    body = (
      <>
        <div className="h2-streams">
          {[count, other].map((n, i) => (
            <div key={i}>
              <span>Stream {i ? 3 : 1}</span>
              <div>
                {Array.from({ length: 4 }, (_, j) => (
                  <i key={j} className={j < n ? 'sent' : ''}>
                    {j + 1}
                  </i>
                ))}
              </div>
              <button
                className="secondary"
                disabled={flag || n === 4}
                onClick={() => {
                  if (i) setOther(other + 1);
                  else setCount(count + 1);
                  setMappings([...mappings, `${i ? 3 : 1}.${n + 1}`]);
                  record('这一帧写入共同的 TCP 字节流，Stream ID 让 HTTP/2 接收端区分响应。');
                }}
              >
                发送此流一帧
              </button>
            </div>
          ))}
        </div>
        <div className="bench-label">连接上的帧顺序</div>
        <div className="bench-tokens">
          {mappings.map((frame, i) => (
            <span className="bench-token" key={i}>
              {frame}
            </span>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="secondary"
            onClick={() => {
              setFlag(!flag);
              record(
                flag
                  ? '缺失字节补齐，TCP 可以继续有序交付。'
                  : '模拟底层 TCP 丢失一段且接收端有序交付受阻；多个 HTTP/2 流都可能受影响。',
              );
            }}
          >
            {flag ? '完成重传' : '制造 TCP 丢包'}
          </button>
        </div>
      </>
    );
  else if (s === 'http-status-codes') {
    const status = !third
      ? 503
      : !flag
        ? 401
        : !second
          ? 403
          : mode === 'missing'
            ? 404
            : mode === 'conflict'
              ? 409
              : 200;
    body = (
      <>
        <div className="bench-controls">
          <label>
            <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />
            凭据有效
          </label>
          <label>
            <input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} />
            有访问权限
          </label>
          <label>
            <input type="checkbox" checked={third} onChange={(e) => setThird(e.target.checked)} />
            服务可用
          </label>
        </div>
        <Choice
          label="资源状态"
          value={mode}
          options={[
            ['first', '资源正常'],
            ['missing', '不存在'],
            ['conflict', '版本冲突'],
          ]}
          onChange={setMode}
        />
        <div className={`http-response ${status === 200 ? 'ok' : ''}`}>
          <code>HTTP/1.1</code>
          <strong>{status}</strong>
          <span>
            {
              (
                {
                  200: 'OK',
                  401: 'Unauthorized',
                  403: 'Forbidden',
                  404: 'Not Found',
                  409: 'Conflict',
                  503: 'Service Unavailable',
                } as Record<number, string>
              )[status]
            }
          </span>
        </div>
        <p className="object-caption">
          这是示例服务约定的检查顺序。实际 API 可能隐藏资源存在性，也可能选用其他合法状态。
        </p>
      </>
    );
  } else if (s === 'cookie-session-token')
    body = (
      <>
        <Choice
          label="凭据方案"
          value={mode}
          options={[
            ['first', 'Cookie + 服务端 Session'],
            ['token', 'Bearer Token'],
          ]}
          onChange={(v) => {
            setMode(v);
            reset();
          }}
        />
        <div className="network-stations">
          <div>
            <Laptop size={28} />
            <b>
              {flag ? (mode === 'first' ? 'Cookie: sid=S1' : 'Authorization: Bearer T1') : '无凭据'}
            </b>
            <span>请求携带方</span>
          </div>
          <ArrowRight />
          <div>
            <Server size={28} />
            <b>{second ? '认证有效' : '无效 / 已失效'}</b>
            <span>{mode === 'first' ? '查询服务端会话' : '验证令牌及其有效期'}</span>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setFlag(true);
              setSecond(true);
              record(
                mode === 'first'
                  ? '登录成功，服务端保存 S1 会话，客户端收到会话标识。'
                  : '登录成功，客户端取得令牌。令牌是凭据形式，并不强制使用 JWT。',
              );
            }}
          >
            登录
          </button>
          <button
            className="secondary"
            onClick={() =>
              record(
                flag && second
                  ? '认证通过。后续仍需检查授权。'
                  : '401：凭据缺失或无效，客户端本地还留着字符串也不能证明登录有效。',
              )
            }
          >
            请求受保护资源
          </button>
          <button
            className="secondary"
            onClick={() => {
              setSecond(false);
              record(
                mode === 'first'
                  ? '服务端会话已撤销，浏览器 Cookie 仍可能存在。'
                  : '模拟令牌到期。自包含令牌若要立即撤销，通常还需要额外机制。',
              );
            }}
          >
            {mode === 'first' ? '撤销会话' : '令牌到期'}
          </button>
        </div>
      </>
    );
  else
    body = (
      <>
        <label>
          <input
            type="checkbox"
            checked={third}
            onChange={(e) => {
              setThird(e.target.checked);
              setCount(0);
            }}
          />
          证书链、主机名与签名均验证通过
        </label>
        <div className="tls-gates">
          {['协商与密钥交换', '服务端身份验证', '握手完整性确认', '应用数据'].map((name, i) => (
            <div className={i < count ? 'passed' : ''} key={name}>
              <ShieldCheck size={24} />
              <strong>{name}</strong>
              <span>{i < count ? '已满足' : '未满足'}</span>
            </div>
          ))}
        </div>
        <div className="bench-actions">
          {['交换 Hello', '验证身份', '验证 Finished', '发送加密应用数据'].map((name, i) => (
            <button
              className="secondary"
              key={name}
              onClick={() => {
                if (count !== i) return record('当前前置条件未满足，不能跳过验证。');
                if (i === 1 && !third)
                  return record('身份验证失败，必须终止握手，不能继续发送敏感数据。');
                setCount(count + 1);
                record(
                  [
                    '协商参数并交换密钥份额，双方导出密钥。密钥本身不在网络上传送。',
                    '验证服务端证书和持有对应私钥的证明。',
                    'Finished 校验握手记录完整性；这里省略具体消息顺序和密钥派生细节。',
                    '普通非 0-RTT 握手完成，应用数据受到认证加密保护。',
                  ][i],
                );
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </>
    );
  return (
    <Bench title={titles[s]} subtitle="协议行为模型；不发送真实网络请求。" onReset={reset}>
      {body}
      <Feedback>{note}</Feedback>
      <ol className="bench-log">
        {logs.map((line, i) => (
          <li key={i}>
            <code>{logs.length - i}</code>
            {line}
          </li>
        ))}
      </ol>
    </Bench>
  );
}
function DatabaseIcon() {
  return <Globe size={28} />;
}
