import { useState } from 'react';
import { RotateCcw, Cpu } from 'lucide-react';
import { decodeByte } from '../domain/search.mjs';
import './foundations/foundations-quality.css';

export default function Bits() {
  const [bits, setBits] = useState('00001101');
  const [signed, setSigned] = useState(false);
  const decoded = decodeByte(bits);
  const weights = [signed ? -128 : 128, 64, 32, 16, 8, 4, 2, 1];
  const terms = weights.filter((_, index) => bits[index] === '1');
  return (
    <section className="lab bits-lab" aria-label="八位二进制实验">
      <header className="lab-heading">
        <span>
          <Cpu size={18} /> 8-BIT LAB
        </span>
        <span className="lab-kind">可操作模型</span>
      </header>
      <div className="lab-toolbar">
        <div className="segmented" aria-label="解释方式">
          <button aria-pressed={!signed} onClick={() => setSigned(false)}>
            无符号数
          </button>
          <button aria-pressed={signed} onClick={() => setSigned(true)}>
            有符号补码
          </button>
        </div>
        <button
          className="icon-button"
          title="重置为 13"
          aria-label="重置为 13"
          onClick={() => {
            setBits('00001101');
            setSigned(false);
          }}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="bit-board">
        {[...bits].map((bit, index) => (
          <div className="bit-column" key={index}>
            <span className="bit-index">b{7 - index}</span>
            <button
              className={`bit ${bit === '1' ? 'on' : ''} ${index === 0 && signed ? 'sign-bit' : ''}`}
              aria-label={`第 ${7 - index} 位，权重 ${weights[index]}`}
              aria-pressed={bit === '1'}
              onClick={() =>
                setBits(
                  (old) => old.slice(0, index) + (bit === '1' ? '0' : '1') + old.slice(index + 1),
                )
              }
            >
              {bit}
            </button>
            <span className="bit-weight">{weights[index]}</span>
          </div>
        ))}
      </div>
      <div className="bit-result">
        <div>
          <span className="muted-light">十进制结果</span>
          <strong key={`${bits}${signed}`}>{signed ? decoded.signed : decoded.unsigned}</strong>
        </div>
        <code>
          {terms.length ? terms.map((n) => (n < 0 ? `(${n})` : n)).join(' + ') : '0'} ={' '}
          {signed ? decoded.signed : decoded.unsigned}
        </code>
      </div>
      <div className="foundation-bit-interpretations" aria-live="polite">
        <span>
          相同位模式 <code>0x{decoded.unsigned.toString(16).toUpperCase().padStart(2, '0')}</code>
        </span>
        <span data-active={!signed}>
          无符号 <strong>{decoded.unsigned}</strong>
        </span>
        <span data-active={signed}>
          补码 <strong>{decoded.signed}</strong>
        </span>
      </div>
      <footer className="lab-footer">
        <span>位模式不变，解释方式不同。</span>
        <div className="preset-buttons">
          <button
            onClick={() => {
              setBits('11111011');
              setSigned(true);
            }}
          >
            −5
          </button>
          <button
            onClick={() => {
              setBits('10000000');
              setSigned(true);
            }}
          >
            −128
          </button>
          <button onClick={() => setBits('11111111')}>全 1</button>
        </div>
      </footer>
    </section>
  );
}
