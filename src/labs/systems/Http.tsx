import { useState } from 'react';
import { ShieldCheck, Eye } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { httpMessage } from '../../domain/systems.mjs';
import './systems.css';

export default function Http() {
  const [method, setMethod] = useState('GET');
  const [exists, setExists] = useState(true);
  const [secure, setSecure] = useState(true);
  const [observer, setObserver] = useState(false);
  const response = httpMessage(method, exists);
  const hidden = secure && observer;
  return (
    <Experiment
      title="同一次请求，两个观察位置"
      subtitle="HTTP/1.1 消息示意 · TLS 保护范围展示，不执行真实加密或网络请求"
      onReset={() => {
        setMethod('GET');
        setExists(true);
        setSecure(true);
        setObserver(false);
      }}
    >
      <div className="experiment-controls sys-controls">
        <label>
          方法
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option>GET</option>
            <option>HEAD</option>
          </select>
        </label>
        <label>
          资源
          <select
            value={exists ? 'yes' : 'no'}
            onChange={(event) => setExists(event.target.value === 'yes')}
          >
            <option value="yes">存在 /items/7</option>
            <option value="no">不存在 /items/99</option>
          </select>
        </label>
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={secure}
            onChange={(event) => setSecure(event.target.checked)}
          />
          <ShieldCheck size={15} />
          HTTPS
        </label>
        <label>
          观察位置
          <select
            value={observer ? 'wire' : 'app'}
            onChange={(event) => setObserver(event.target.value === 'wire')}
          >
            <option value="app">客户端应用内</option>
            <option value="wire">网络中间旁观者</option>
          </select>
        </label>
      </div>
      <div className="experiment-scene">
        <div className="sys-http-columns">
          <div>
            <h3>请求</h3>
            <pre>
              {hidden
                ? '[受保护的 TLS 应用数据]\n不能直接读出方法、路径和头部'
                : `${method} /items/${exists ? 7 : 99} HTTP/1.1\nHost: www.example.com\nAccept: application/json\n`}
            </pre>
          </div>
          <div>
            <h3>响应</h3>
            <pre>
              {hidden
                ? '[受保护的 TLS 应用数据]\n不能直接读出状态和正文'
                : `HTTP/1.1 ${response.status}\nContent-Type: application/json\nContent-Length: ${response.length}\n\n${response.body}`}
            </pre>
          </div>
        </div>
        <div className="experiment-metrics">
          <div className="metric">
            <small>应用状态</small>
            <strong>{observer && secure ? '受保护' : response.status}</strong>
          </div>
          <div className="metric">
            <small>响应正文字节</small>
            <strong>{hidden ? '受保护' : response.body.length}</strong>
          </div>
        </div>
      </div>
      <p className="experiment-status" role="status">
        <Eye size={16} />{' '}
        {hidden
          ? '这里只展示不可读边界，方括号并非真实密文。通信地址和部分元信息仍可能可见；网站是否可信、用户是否有权限仍需另外判断。'
          : method === 'HEAD'
            ? 'HEAD 不返回响应正文；Content-Length 可以表示相应 GET 响应的正文长度，并非这里真的发送了这些字节。'
            : exists
              ? '200 表示这次请求成功；应用能读取明文，不意味着网络旁观者也能读取。'
              : '404 是服务器已经返回的 HTTP 响应，不等于没有建立网络连接。'}
      </p>
    </Experiment>
  );
}
