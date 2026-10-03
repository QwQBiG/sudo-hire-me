import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Send, Timer } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { tcpPackets } from '../../domain/systems.mjs';
import './systems.css';
import './systems-quality.css';
import { WireTransfer } from './WireTransfer';

type Entry = { text: string; direction: string; lost: boolean };
export default function Tcp() {
  const [client, setClient] = useState(1000);
  const [server, setServer] = useState(5000);
  const [stage, setStage] = useState(0);
  const [loss, setLoss] = useState(false);
  const [pendingLoss, setPendingLoss] = useState(false);
  const [finished, setFinished] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [transmissions, setTransmissions] = useState(0);
  const packets = tcpPackets(client, server);
  const current = packets[stage];
  const last = pendingLoss ? current : packets[stage - 1];
  const clientState = finished
    ? 'CLOSED'
    : pendingLoss
      ? last.beforeClient
      : (last?.client ?? 'CLOSED');
  const serverState = pendingLoss ? last.beforeServer : (last?.server ?? 'LISTEN');
  const reset = () => {
    setStage(0);
    setLoss(false);
    setPendingLoss(false);
    setEntries([]);
    setFinished(false);
    setTransmissions(0);
  };
  const send = () => {
    if (!current) return;
    const next: Entry[] = [];
    if (pendingLoss && [2, 4, 6].includes(stage)) {
      next.push({
        text: `对端重传 ${packets[stage - 1].text}`,
        direction: packets[stage - 1].direction,
        lost: false,
      });
    }
    next.push({ text: current.text, direction: current.direction, lost: loss });
    setEntries([...entries, ...next].slice(-12));
    setTransmissions((count) => count + 1);
    if (!loss) setStage(stage + 1);
    setPendingLoss(loss);
    setLoss(false);
  };
  return (
    <Experiment
      title="报文时序与双方状态"
      subtitle="典型主动打开、客户端主动关闭 · 无应用数据 · 一次只观察当前报文的送达"
      onReset={reset}
    >
      <div className="experiment-controls sys-controls">
        <label>
          客户端 ISN
          <SelectField
            value={client}
            disabled={stage !== 0 || entries.length > 0}
            onChange={(event) => setClient(Number(event.target.value))}
          >
            <option>1000</option>
            <option>100</option>
          </SelectField>
        </label>
        <label>
          服务端 ISN
          <SelectField
            value={server}
            disabled={stage !== 0 || entries.length > 0}
            onChange={(event) => setServer(Number(event.target.value))}
          >
            <option>5000</option>
            <option>9000</option>
          </SelectField>
        </label>
        <label className="sys-checkbox">
          <input
            type="checkbox"
            checked={loss}
            disabled={!current}
            onChange={(event) => setLoss(event.target.checked)}
          />
          丢弃下一份目标报文
        </label>
      </div>
      <div className="experiment-scene">
        <div className="sys-endpoints">
          <div>
            <strong>客户端</strong>
            <small>{clientState}</small>
          </div>
          <div>
            <strong>服务器</strong>
            <small>{serverState}</small>
          </div>
        </div>
        <WireTransfer
          sequence={transmissions}
          label={entries.at(-1)?.text ?? ''}
          direction={entries.at(-1)?.direction === 'left' ? 'left' : 'right'}
          lost={entries.at(-1)?.lost}
        />
        <div className="sys-timeline" role="log" aria-label="TCP 报文记录">
          {entries.length ? (
            entries.map((entry, index) => (
              <div
                key={index}
                className="sys-message"
                data-lost={entry.lost}
                data-direction={entry.direction}
              >
                {entry.direction === 'left' ? '← ' : ''}
                {entry.text}
                {entry.direction === 'right' ? ' →' : ''}
                {entry.lost ? ' [丢失]' : ''}
              </div>
            ))
          ) : (
            <p>客户端尚未发起，服务器正在监听。</p>
          )}
        </div>
        <div className="sys-actions">
          <button onClick={send} disabled={!current}>
            <Send size={16} />
            {pendingLoss
              ? [2, 4, 6].includes(stage)
                ? '对端重传，重新确认'
                : '重传当前报文'
              : stage === 3
                ? '客户端发起关闭'
                : stage === 5
                  ? '服务器结束发送'
                  : '发送下一报文'}
          </button>
          <button disabled={stage !== 7 || finished} onClick={() => setFinished(true)}>
            <Timer size={16} />
            等待 2 MSL 结束
          </button>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {pendingLoss
          ? [2, 4, 6].includes(stage)
            ? '纯 ACK 不靠自己的重传定时器重发。这里由对端重传 SYN+ACK 或 FIN，触发再次确认；省略具体计时。'
            : '发送方已改变本地状态，但对端没有收到报文；重传成功前不能跳过对应确认。'
          : finished
            ? '等待结束后客户端也释放连接状态。2 MSL 不是所有系统固定相同的秒数。'
            : stage === 3
              ? '双方均已建立。SYN 各占一个序列位置，纯 ACK 不占；本例没有发送应用字节。'
              : stage >= 6
                ? '主动关闭方保留 TIME-WAIT，最后 ACK 丢失时仍可响应重传 FIN。'
                : '时序箭头表示报文方向；两个端点分别维护状态，不会同时凭空知道对方已经收到。'}
      </p>
    </Experiment>
  );
}
