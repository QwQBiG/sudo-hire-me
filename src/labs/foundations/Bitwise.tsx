import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { computeBitwise8, toggleBit8 } from '../../domain/bitwise.mjs';
import './bitwise.css';

type Operation = 'and' | 'or' | 'xor' | 'left' | 'right';
const operations: { id: Operation; symbol: string; label: string }[] = [
  { id: 'and', symbol: '&', label: '按位与' },
  { id: 'or', symbol: '|', label: '按位或' },
  { id: 'xor', symbol: '^', label: '按位异或' },
  { id: 'left', symbol: '<<', label: '左移' },
  { id: 'right', symbol: '>>', label: '逻辑右移' },
];

function hex(value: number) {
  return `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;
}

export default function Bitwise() {
  const [left, setLeft] = useState(0xa6);
  const [right, setRight] = useState(0x0c);
  const [operation, setOperation] = useState<Operation>('and');
  const [shift, setShift] = useState(1);
  const result = computeBitwise8(left, right, operation, shift);
  const isShift = operation === 'left' || operation === 'right';

  function inputRow(label: string, value: number, bits: number[], change: (value: number) => void) {
    return (
      <div className="bitwise-row">
        <div className="bitwise-row-label">
          <strong>{label}</strong>
          <code>{hex(value)}</code>
        </div>
        <div className="bitwise-cells">
          {bits.map((bit, index) => (
            <button
              type="button"
              className={bit ? 'bitwise-cell on' : 'bitwise-cell'}
              key={7 - index}
              onClick={() => change(toggleBit8(value, 7 - index))}
              aria-label={`切换${label}第${7 - index}位，当前为${bit}`}
              aria-pressed={Boolean(bit)}
              title={`${label} 第 ${7 - index} 位：点击切换`}
            >
              {bit}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Experiment
      className="bitwise-lab"
      title="逐位点亮运算结果"
      subtitle="固定为 8 位无符号模型。点击 A 或 B 的位，再切换运算；移位次数限定为 0–7。"
      onReset={() => {
        setLeft(0xa6);
        setRight(0x0c);
        setOperation('and');
        setShift(1);
      }}
    >
      <div className="bitwise-mode" role="group" aria-label="选择位运算">
        {operations.map(({ id, symbol, label }) => (
          <button
            type="button"
            key={id}
            className={operation === id ? 'active' : ''}
            aria-pressed={operation === id}
            aria-label={label}
            title={label}
            onClick={() => setOperation(id)}
          >
            {symbol}
          </button>
        ))}
      </div>
      {isShift && (
        <label className="bitwise-shift">
          移位次数 <output>{shift}</output>
          <input
            type="range"
            min="0"
            max="7"
            value={shift}
            onChange={(event) => setShift(Number(event.target.value))}
          />
        </label>
      )}
      <div className="bitwise-board" aria-label="从第 7 位到第 0 位的逐位运算">
        <div className="bitwise-indices">
          <span />
          <div className="bitwise-cells">
            {Array.from({ length: 8 }, (_, index) => (
              <small key={index}>{7 - index}</small>
            ))}
          </div>
        </div>
        {inputRow('A', left, result.leftBits, setLeft)}
        {!isShift && inputRow('B', right, result.rightBits, setRight)}
        <div className="bitwise-row bitwise-result">
          <div className="bitwise-row-label">
            <strong>结果</strong>
            <code>{hex(result.result)}</code>
          </div>
          <div className="bitwise-cells">
            {result.resultBits.map((bit, index) => (
              <span className={bit ? 'bitwise-cell on' : 'bitwise-cell'} key={index}>
                {bit}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          A <strong>{left}</strong>
        </span>
        {!isShift && (
          <span>
            B <strong>{right}</strong>
          </span>
        )}
        <span>
          运算 <strong>{operations.find(({ id }) => id === operation)?.label}</strong>
        </span>
        <span>
          结果 <strong>{result.result}</strong> / {hex(result.result)}
        </span>
      </div>
      <p className="experiment-status" role="status">
        {isShift
          ? operation === 'left'
            ? `${hex(left)} 左移 ${shift} 位后只保留低 8 位，结果 ${hex(result.result)}；移出的高位部分为 ${hex(result.droppedHighBits)}。`
            : `${hex(left)} 逻辑右移 ${shift} 位，左侧补 0，结果 ${hex(result.result)}。`
          : `${hex(left)} ${operations.find(({ id }) => id === operation)?.symbol} ${hex(right)} = ${hex(result.result)}，十进制为 ${result.result}。`}
      </p>
    </Experiment>
  );
}
