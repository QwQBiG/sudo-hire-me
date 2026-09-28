import { useState } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { translateAddress } from '../../domain/systems.mjs';
import './systems.css';

export default function Paging() {
  const [address, setAddress] = useState(2500);
  const [loaded, setLoaded] = useState(false);
  const [write, setWrite] = useState(false);
  const result = translateAddress(address, loaded, write);
  const reset = () => {
    setAddress(2500);
    setLoaded(false);
    setWrite(false);
  };
  return (
    <Experiment
      title="地址翻译台"
      subtitle="单级页表教学模型 · 页大小 1024 B · 展示八个虚拟页"
      onReset={reset}
    >
      <div className="experiment-controls sys-controls">
        <label>
          虚拟地址
          <input
            aria-label="虚拟地址"
            type="number"
            min={0}
            max={8191}
            value={address}
            onChange={(event) => setAddress(Number(event.target.value))}
          />
        </label>
        <label>
          访问方式
          <select
            value={write ? 'write' : 'read'}
            onChange={(event) => setWrite(event.target.value === 'write')}
          >
            <option value="read">读取</option>
            <option value="write">写入</option>
          </select>
        </label>
        <label>
          目标页
          <select
            aria-label="目标页"
            value={result.page ?? ''}
            onChange={(event) =>
              setAddress(Number(event.target.value) * 1024 + (result.offset ?? 0))
            }
          >
            {Array.from({ length: 8 }, (_, page) => (
              <option key={page} value={page}>
                页 {page}
                {page === 3 && !loaded
                  ? ' · 未驻留'
                  : page === 7
                    ? ' · 非法区域'
                    : page === 1
                      ? ' · 只读'
                      : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="experiment-scene">
        <div className="sys-bit-address">
          <div>
            <small>虚拟页号 · 高位</small>
            <strong>{result.page ?? '?'}</strong>
          </div>
          <div>
            <small>页内偏移 · 低 10 位</small>
            <strong>
              {result.offset === undefined ? '?' : result.offset.toString(2).padStart(10, '0')}
            </strong>
          </div>
        </div>
        <table className="sys-table">
          <thead>
            <tr>
              <th>虚拟页</th>
              <th>物理页框</th>
              <th>访问权限</th>
            </tr>
          </thead>
          <tbody>
            {[2, 4, 5, loaded ? 9 : null, 1, 6, 8, null].map((frame, page) => (
              <tr key={page} data-active={page === result.page}>
                <td>{page}</td>
                <td>{page === 7 ? '无映射' : (frame ?? '未驻留')}</td>
                <td>{page === 7 ? '无' : page === 1 ? '只读' : '读 / 写'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.kind === 'mapped' && (
          <div className="sys-formula">
            {result.frame} × 1024 + {result.offset} <ArrowRight size={16} />{' '}
            <strong>{result.physical}</strong>
          </div>
        )}
        {result.kind === 'fault' && (
          <div className="sys-actions">
            <button onClick={() => setLoaded(true)}>
              <Download size={16} />
              准备页 3 并重试
            </button>
          </div>
        )}
      </div>
      <p className="experiment-status" role="status">
        {result.message}
        {result.kind === 'mapped' &&
          ' 页表映射可用，不意味着地址转换后备缓冲器（Translation Lookaside Buffer，TLB）一定命中；此处未模拟 TLB。'}
      </p>
    </Experiment>
  );
}
