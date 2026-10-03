import { useState } from 'react';
import { Download, ScanSearch } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  accessTlb,
  createTlbState,
  loadTlbPage3,
  tlbPageSize,
  tlbPageTable,
} from '../../domain/tlb.mjs';
import './tlb.css';
import './systems-quality.css';

const examples = [12, 268, 15, 524, 12, 780, 1030];

export default function Tlb() {
  const [state, setState] = useState(() => createTlbState());
  const [address, setAddress] = useState(12);
  const validAddress =
    Number.isInteger(address) && address >= 0 && address < tlbPageSize * tlbPageTable.length;

  function access(value: number) {
    setAddress(value);
    setState((previous) => accessTlb(previous, value));
  }

  return (
    <Experiment
      title="两项 TLB 查询台"
      subtitle="页大小 256 B · 两项全相联 · LRU 从旧到新排列"
      className="tlb-lab"
      onReset={() => {
        setState(createTlbState());
        setAddress(12);
      }}
    >
      <div className="tlb-controls">
        <label>
          虚拟地址{' '}
          <input
            type="number"
            min={0}
            max={1279}
            value={Number.isFinite(address) ? address : ''}
            aria-invalid={!validAddress}
            onChange={(event) => setAddress(event.target.valueAsNumber)}
          />
        </label>
        <button disabled={!validAddress} onClick={() => access(address)}>
          <ScanSearch size={16} />
          访问地址
        </button>
        <button
          onClick={() => setState((previous) => loadTlbPage3(previous))}
          disabled={state.loadedPage3}
        >
          <Download size={16} />
          装入页 3
        </button>
      </div>
      {!validAddress && (
        <p role="alert" className="experiment-status">
          请输入 0 至 1279 之间的整数虚拟地址；当前没有执行访问。
        </p>
      )}
      <div className="tlb-presets" role="group" aria-label="示例虚拟地址">
        {examples.map((value, index) => (
          <button key={`${index}-${value}`} onClick={() => access(value)}>
            {value}
            <small>页 {Math.floor(value / 256)}</small>
          </button>
        ))}
      </div>
      <div className="tlb-workspace">
        <section className="tlb-cache" aria-label="TLB 两个缓存槽">
          <header>
            <strong>TLB</strong>
            <span>旧 → 新</span>
          </header>
          {[0, 1].map((index) => {
            const entry = state.entries[index];
            return (
              <div className="tlb-slot" data-filled={Boolean(entry)} key={index}>
                <small>槽 {index + 1}</small>
                <strong>{entry ? `页 ${entry.page} → 框 ${entry.frame}` : '空'}</strong>
              </div>
            );
          })}
          <p>
            命中 {state.hits} · 未命中 {state.misses} · 缺页 {state.faults}
          </p>
        </section>
        <section className="tlb-page-table" aria-label="本实验页表">
          <header>
            <strong>页表</strong>
            <span>当前地址空间</span>
          </header>
          {tlbPageTable.map((row) => (
            <div data-active={state.last?.page === row.page} key={row.page}>
              <span>虚拟页 {row.page}</span>
              <strong>
                {row.page === 4
                  ? '无映射'
                  : row.page === 3 && !state.loadedPage3
                    ? '合法 · 未驻留'
                    : `框 ${row.frame}`}
              </strong>
            </div>
          ))}
        </section>
      </div>
      <div className="tlb-result" aria-live="polite">
        <strong>
          {state.last
            ? state.last.kind === 'hit'
              ? 'TLB 命中'
              : state.last.kind === 'miss'
                ? 'TLB 未命中 · 已查询页表'
                : state.last.kind === 'fault'
                  ? '缺页'
                  : '非法地址'
            : '等待访问'}
        </strong>
        <p>{state.message}</p>
        {state.last?.physical !== undefined && (
          <code>
            {state.last.frame} × 256 + {state.last.offset} = {state.last.physical}
          </code>
        )}
      </div>
      <div className="tlb-history">
        <strong>访问记录</strong>
        {state.history.length ? (
          <ol>
            {state.history.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        ) : (
          <p>尚未访问地址。</p>
        )}
      </div>
    </Experiment>
  );
}
