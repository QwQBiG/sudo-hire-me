import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { FastForward, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { addFixedWidth } from '../../domain/arithmetic.mjs';
import './arithmetic.css';

export default function Arithmetic() {
  const [width, setWidth] = useState(8);
  const [left, setLeft] = useState('127');
  const [right, setRight] = useState('1');
  const [step, setStep] = useState(0);
  const max = 2 ** width - 1;
  const valid = (value: string) => /^(0|[1-9]\d*)$/.test(value) && Number(value) <= max;
  const error = !valid(left) || !valid(right) ? `请输入 0 到 ${max} 的十进制整数位模式。` : '';
  const result = error ? null : addFixedWidth(width, Number(left), Number(right));
  const current = result?.columns.find((column) => column.bit === step - 1);
  const complete = step === width;

  const reset = () => {
    setWidth(8);
    setLeft('127');
    setRight('1');
    setStep(0);
  };
  const choose = (a: number, b: number) => {
    setLeft(String(a));
    setRight(String(b));
    setStep(0);
  };

  return (
    <Experiment
      className="arithmetic-lab"
      title="让进位穿过每一个二进制位"
      subtitle="固定 4 或 8 位；两种整数解释共用同一串结果位，溢出判断分别进行。"
      onReset={reset}
    >
      <div className="experiment-controls arithmetic-controls">
        <label>
          位宽
          <SelectField
            value={width}
            onChange={(event) => {
              const nextWidth = Number(event.target.value);
              setWidth(nextWidth);
              setLeft(nextWidth === 4 ? '7' : '127');
              setRight('1');
              setStep(0);
            }}
          >
            <option value={4}>4 位</option>
            <option value={8}>8 位</option>
          </SelectField>
        </label>
        <label>
          位模式 A（十进制）
          <input
            type="number"
            min={0}
            max={max}
            step={1}
            value={left}
            aria-invalid={!valid(left)}
            onChange={(event) => {
              setLeft(event.target.value);
              setStep(0);
            }}
          />
        </label>
        <label>
          位模式 B（十进制）
          <input
            type="number"
            min={0}
            max={max}
            step={1}
            value={right}
            aria-invalid={!valid(right)}
            onChange={(event) => {
              setRight(event.target.value);
              setStep(0);
            }}
          />
        </label>
      </div>
      <div className="arithmetic-presets" aria-label="典型例子">
        <button onClick={() => choose(width === 4 ? 7 : 127, 1)}>
          {width === 4 ? '7 + 1' : '127 + 1'}
        </button>
        <button onClick={() => choose(width === 4 ? 15 : 255, 1)}>
          {width === 4 ? '15 + 1' : '255 + 1'}
        </button>
      </div>
      {error ? (
        <p className="experiment-status arithmetic-error" role="alert">
          {error}
        </p>
      ) : (
        result && (
          <>
            <div
              className={`arithmetic-grid ${width === 4 ? 'four' : 'eight'}`}
              aria-label="从右向左逐位相加"
            >
              <span className="arithmetic-row-title">位号</span>
              {result.columns.map((column) => (
                <span className="arithmetic-index" key={column.bit}>
                  {column.bit}
                </span>
              ))}
              <span className="arithmetic-row-title">A</span>
              {result.columns.map((column) => (
                <strong className="arithmetic-input" key={column.bit}>
                  {column.leftBit}
                </strong>
              ))}
              <span className="arithmetic-row-title">B</span>
              {result.columns.map((column) => (
                <strong className="arithmetic-input" key={column.bit}>
                  {column.rightBit}
                </strong>
              ))}
              <span className="arithmetic-row-title">传入进位</span>
              {result.columns.map((column) => (
                <strong
                  className="arithmetic-carry"
                  data-active={step === column.bit + 1}
                  key={column.bit}
                >
                  {step > column.bit ? column.carryIn : '·'}
                </strong>
              ))}
              <span className="arithmetic-row-title">结果位</span>
              {result.columns.map((column) => (
                <strong
                  className="arithmetic-output"
                  data-active={step === column.bit + 1}
                  key={column.bit}
                >
                  {step > column.bit ? column.resultBit : '·'}
                </strong>
              ))}
            </div>
            <div className="arithmetic-rail" aria-label={`已计算 ${step} 位，共 ${width} 位`}>
              {Array.from({ length: width }, (_, index) => (
                <span key={index} data-done={index >= width - step} />
              ))}
            </div>
            <div className="experiment-controls arithmetic-actions">
              <button className="primary" disabled={complete} onClick={() => setStep(step + 1)}>
                <StepForward size={16} /> 推进一位
              </button>
              <button className="secondary" disabled={complete} onClick={() => setStep(width)}>
                <FastForward size={16} /> 显示全部
              </button>
            </div>
            {complete && (
              <div className="arithmetic-verdict" aria-label="两种整数解释的结果">
                <div data-overflow={result.unsignedOverflow}>
                  <small>
                    无符号：{result.left} + {result.right} = {result.unsignedExact}
                  </small>
                  <strong>{result.unsignedOverflow ? '溢出' : '可表示'}</strong>
                  <span>
                    保留低 {width} 位：{result.pattern}
                  </span>
                </div>
                <div data-overflow={result.signedOverflow}>
                  <small>
                    补码：{result.signedLeft} + {result.signedRight} = {result.signedExact}
                  </small>
                  <strong>{result.signedOverflow ? '溢出' : '可表示'}</strong>
                  <span>
                    保留低 {width} 位后解释：{result.signedResult}
                  </span>
                </div>
              </div>
            )}
            <p className="experiment-status" role="status">
              {step === 0
                ? '从右侧最低位开始。每列把 A、B 和传入进位相加；结果留本位，进位交给左边。'
                : complete
                  ? `低 ${width} 位结果为 ${result.pattern.toString(2).padStart(width, '0')}；最高位之外的进位是 ${result.carryOut}，它对应无符号溢出，不等同于有符号溢出。`
                  : `第 ${current?.bit} 位：${current?.leftBit} + ${current?.rightBit} + 传入 ${current?.carryIn} = ${Number(current?.leftBit) + Number(current?.rightBit) + Number(current?.carryIn)}；本位写 ${current?.resultBit}，向左传 ${current?.carryOut}。`}
            </p>
          </>
        )
      )}
    </Experiment>
  );
}
