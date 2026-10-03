import { useState } from 'react';
import { ArrowRight, Database, Inbox, Wallet } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

export default function Delivery({ lesson }: LabProps) {
  const caching = lesson.slug === 'cache-consistency-basics';
  const message = lesson.slug === 'message-queue-delivery';
  const [mode, setMode] = useState('first');
  const [balance, setBalance] = useState(100);
  const [deliveries, setDeliveries] = useState(0);
  const [processed, setProcessed] = useState(false);
  const [ack, setAck] = useState(false);
  const [cached, setCached] = useState<number | null>(100);
  const [snapshot, setSnapshot] = useState<number | null>(null);
  const [note, setNote] = useState(
    caching
      ? '先更新数据库，再观察缓存读取。也可以制造“读旧值后延迟回填”的交错。'
      : '用同一业务标识重复提交，观察返回丢失与业务执行次数的区别。',
  );
  function reset() {
    setBalance(100);
    setDeliveries(0);
    setProcessed(false);
    setAck(false);
    setCached(100);
    setSnapshot(null);
    setNote('状态已重置。');
  }
  if (caching)
    return (
      <Bench
        title="把缓存与数据库放到同一条时间线上"
        subtitle="固定 cache-aside 小模型；删除缓存不能阻止所有并发旧值回填。"
        onReset={reset}
      >
        <div className="cache-layers">
          <div className="cache-cores">
            <div className="cache-core">
              <Inbox size={24} />
              <small>Cache</small>
              <strong>{cached ?? 'MISS'}</strong>
            </div>
            <div className="cache-core">
              <Database size={24} />
              <small>Database</small>
              <strong>{balance}</strong>
            </div>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setBalance(balance + 20);
              setNote('数据库已更新，已有缓存不会自动同步。');
            }}
          >
            数据库 +20
          </button>
          <button
            className="secondary"
            onClick={() => {
              setCached(null);
              setNote('缓存失效。下次正常读取会查询数据库，但旧的在途回填仍可能到达。');
            }}
          >
            删除缓存
          </button>
          <button
            className="secondary"
            onClick={() => {
              if (cached !== null) return setNote(`命中缓存，返回 ${cached}。`);
              setCached(balance);
              setNote(`缓存缺失，读数据库 ${balance} 并回填。`);
            }}
          >
            普通读取
          </button>
        </div>
        <div className="cache-race">
          <span>在途读者暂存值：{snapshot ?? '无'}</span>
          <button
            className="secondary"
            onClick={() => {
              setSnapshot(balance);
              setNote('在途读者已从数据库读出当前值，暂时停在回填之前。');
            }}
          >
            开始一次慢回填
          </button>
          <button
            className="secondary"
            disabled={snapshot === null}
            onClick={() => {
              setCached(snapshot);
              setSnapshot(null);
              setNote('之前读到的值现在才写入缓存。若数据库在这期间被更新，就会重新产生陈旧缓存。');
            }}
          >
            完成旧回填
          </button>
        </div>
        <div className="quality-path">
          <code>数据库 = {balance}</code>
          <span>↔</span>
          <code className={cached !== null && cached !== balance ? 'blocked' : ''}>
            缓存 = {cached ?? 'MISS'}
          </code>
          <output>
            {cached === null
              ? '普通读将回源'
              : cached === balance
                ? '当前副本一致'
                : `陈旧差值 ${balance - cached}`}
          </output>
        </div>
        <Feedback good={cached === null || cached === balance}>{note}</Feedback>
      </Bench>
    );
  function deliver() {
    if (ack && message) return setNote('消息已经确认，本模型不再投递这条消息。');
    setDeliveries(deliveries + 1);
    if (mode === 'dedupe' && processed) {
      setNote('同一业务键 K1 已处理，返回原结果，不再次扣款。');
      return;
    }
    setBalance(balance - 10);
    setProcessed(true);
    setNote(
      mode === 'dedupe'
        ? '将业务键 K1 与扣款结果原子提交，响应还可能丢失。'
        : '业务已扣款 10；缺少持久化去重，重复请求仍会再次执行。',
    );
  }
  return (
    <Bench
      title={message ? '处理完业务，再丢掉确认消息' : '让同一笔请求重试而不重复扣款'}
      subtitle="固定请求键 K1；去重记录与业务更新视为同一原子提交。"
      onReset={reset}
    >
      <Choice
        label="业务处理"
        value={mode}
        options={[
          ['first', '每次收到都执行'],
          ['dedupe', '按业务键持久化去重'],
        ]}
        onChange={(v) => {
          setMode(v);
          reset();
        }}
      />
      <div className="delivery-flow">
        <div>
          <Inbox size={28} />
          <small>{message ? 'Broker 消息' : '客户端请求'}</small>
          <strong>K1</strong>
          <span>投递 {deliveries} 次</span>
        </div>
        <ArrowRight />
        <div>
          <Wallet size={28} />
          <small>业务账户</small>
          <strong>{balance}</strong>
          <span>已处理记录：{mode === 'dedupe' && processed ? 'K1' : '无'}</span>
        </div>
      </div>
      <div className="quality-lattice" aria-label="投递与业务提交分别记录">
        <div className={processed ? 'active' : ''}>
          <small>业务副作用执行次数</small>
          <output>{(100 - balance) / 10}</output>
          <span>扣款总额 {100 - balance}</span>
        </div>
        <div className={mode === 'dedupe' && processed ? 'active' : ''}>
          <small>持久化业务键</small>
          <output>{mode === 'dedupe' && processed ? 'K1 → 已提交结果' : '无去重记录'}</output>
          <span>与业务更新在同一原子提交中</span>
        </div>
        <div className={ack ? 'active' : ''}>
          <small>发送方已知状态</small>
          <output>{ack ? '确认已送达' : deliveries ? '结果不确定' : '尚未发送'}</output>
          <span>未知结果不等于业务未执行</span>
        </div>
      </div>
      <div className="bench-actions">
        <button className="primary" disabled={message && ack} onClick={deliver}>
          {deliveries ? '重投 / 重试同一个 K1' : '提交 K1'}
        </button>
        <button
          className="secondary"
          disabled={!deliveries}
          onClick={() => {
            setAck(true);
            setNote(
              message
                ? '确认送达 Broker，停止本模型中的继续投递。'
                : '客户端终于收到响应。重试是否执行两次，应由服务端幂等协议保证。',
            );
          }}
        >
          送达{message ? ' ACK' : '响应'}
        </button>
        <button
          className="secondary"
          disabled={!deliveries}
          onClick={() => {
            setAck(false);
            setNote('确认 / 响应丢失，发送方不知道业务是否已执行。重试是可能的。');
          }}
        >
          丢失{message ? ' ACK' : '响应'}
        </button>
      </div>
      <Feedback good={balance >= 90}>{note}</Feedback>
    </Bench>
  );
}
