import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { transportDelivery } from '../../domain/systems.mjs';
import './systems.css';

export default function Transport() {
  const [tcp, setTcp] = useState(true);
  const [received, setReceived] = useState<number[]>([]);
  const [loss, setLoss] = useState(true);
  const [reverse, setReverse] = useState(false);
  const result = transportDelivery(received, tcp);
  return (
    <Experiment
      title="丢掉中间一段，会怎样？"
      subtitle="三个等价负载片段 · TCP 按序交付模型，省略确认计时与拥塞控制"
      onReset={() => {
        setReceived([]);
        setLoss(true);
        setReverse(false);
      }}
    >
      <div className="experiment-controls sys-controls">
        <label>
          传输服务
          <SelectField
            value={tcp ? 'tcp' : 'udp'}
            onChange={(event) => {
              setTcp(event.target.value === 'tcp');
              setReceived([]);
            }}
          >
            <option value="tcp">TCP 有序字节流</option>
            <option value="udp">UDP 独立数据报</option>
          </SelectField>
        </label>
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={loss}
            onChange={(event) => setLoss(event.target.checked)}
          />
          丢弃中间片段
        </label>
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(event) => setReverse(event.target.checked)}
          />
          反序到达
        </label>
        <button
          onClick={() =>
            setReceived((reverse ? [2, 1, 0] : [0, 1, 2]).filter((index) => !loss || index !== 1))
          }
        >
          <Send size={16} />
          重新发送
        </button>
      </div>
      <div className="experiment-scene">
        <div className="sys-packet-track">
          {['hel', 'low', 'orld'].map((data, index) => (
            <div className="sys-packet" key={data} data-received={received.includes(index)}>
              <small>
                {tcp ? '字节段' : '数据报'} {index + 1}
              </small>
              <strong>{data}</strong>
              <small>{received.includes(index) ? '已到达' : '未到达'}</small>
            </div>
          ))}
        </div>
        <p>应用当前可见{tcp ? '字节' : '数据报（竖线标记边界）'}</p>
        <div className="sys-output" aria-live="polite">
          {result.output || '尚无数据'}
        </div>
        <div className="sys-actions">
          <button
            disabled={!tcp || received.length === 0 || result.missing.length === 0}
            onClick={() => setReceived([...received, ...result.missing])}
          >
            <RefreshCw size={16} />
            模拟丢失段重传成功
          </button>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {!received.length
          ? tcp
            ? 'TCP 原应用写入 hello、world；这里将其字节分成 hel、low、orld 三段。'
            : '本例改为发送三份独立 UDP 数据报，正文分别为 hel、low、orld；边界由数据报本身保留。'
          : tcp
            ? result.missing.length
              ? '缺口后的字节可以已到达接收缓存，但不能越过缺口交付给应用。重传成功后再连续交付。'
              : '应用得到 helloworld，不会自动恢复两次写入的消息边界。重传并不重复交付字节。'
            : '应用按本次到达顺序收到独立数据报。UDP 本身不补齐丢失；应用可以另行设计可靠机制。'}
      </p>
    </Experiment>
  );
}
