import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { inspectWord32 } from '../../domain/endian.mjs';
import './endian.css';

type Order = 'big' | 'little';
const orderName = { big: '大端', little: '小端' };

export default function Endian() {
  const [hex, setHex] = useState('0x12345678');
  const [writeOrder, setWriteOrder] = useState<Order>('big');
  const [readOrder, setReadOrder] = useState<Order>('big');
  let result: ReturnType<typeof inspectWord32> | null = null;
  let error = '';
  try {
    result = inspectWord32(hex, writeOrder, readOrder);
  } catch {
    error = '请输入 1 到 8 位十六进制数字，可加 0x 前缀。';
  }
  const sourceBytes = result?.originalHex.slice(2).match(/../g) ?? [];

  return (
    <Experiment
      className="endian-lab"
      title="把四个字节写进相邻地址"
      subtitle="写入顺序和读取顺序可以独立选择；地址 100 至 103 始终从左到右递增。"
      onReset={() => {
        setHex('0x12345678');
        setWriteOrder('big');
        setReadOrder('big');
      }}
    >
      <div className="experiment-controls endian-controls">
        <label>
          32 位无符号值（十六进制）
          <input
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            maxLength={10}
            spellCheck={false}
            aria-invalid={!!error}
            aria-label="32 位无符号值，十六进制"
          />
        </label>
        <label>
          写入字节序
          <SelectField
            value={writeOrder}
            onChange={(event) => setWriteOrder(event.target.value as Order)}
          >
            <option value="big">大端：高位先到低地址</option>
            <option value="little">小端：低位先到低地址</option>
          </SelectField>
        </label>
        <label>
          读取字节序
          <SelectField
            value={readOrder}
            onChange={(event) => setReadOrder(event.target.value as Order)}
          >
            <option value="big">大端：低地址权重更高</option>
            <option value="little">小端：低地址权重更低</option>
          </SelectField>
        </label>
      </div>
      {error ? (
        <p className="experiment-status endian-error" role="alert">
          {error}
        </p>
      ) : (
        result && (
          <>
            <div
              className="endian-sequence"
              aria-label={`原始数值 ${result.originalHex} 从高到低有效字节`}
            >
              <div className="endian-sequence-title">
                <span>原始 32 位值</span>
                <strong>{result.originalHex}</strong>
                <span>高有效 → 低有效</span>
              </div>
              <div className="endian-source-bytes">
                {sourceBytes.map((byte, index) => (
                  <span
                    key={index}
                    data-significance={index === 0 ? 'high' : index === 3 ? 'low' : 'middle'}
                  >
                    {byte}
                  </span>
                ))}
              </div>
            </div>
            <div className="endian-transfer" aria-hidden="true">
              <span>↓</span> 按{orderName[writeOrder]}写入
            </div>
            <div
              className="endian-memory"
              key={`${result.originalHex}-${writeOrder}`}
              role="list"
              aria-label="按地址递增排列的四个存储字节"
            >
              {result.bytes.map((byte, index) => (
                <div
                  role="listitem"
                  className="endian-slot"
                  key={index}
                  aria-label={`地址 ${100 + index}，十六进制字节 ${byte.toString(16).padStart(2, '0')}`}
                >
                  <small>地址 {100 + index}</small>
                  <strong>{byte.toString(16).toUpperCase().padStart(2, '0')}</strong>
                  <span>
                    {writeOrder === 'big'
                      ? ['最高', '次高', '次低', '最低'][index]
                      : ['最低', '次低', '次高', '最高'][index]}
                    有效
                  </span>
                </div>
              ))}
            </div>
            <div className="endian-readout" data-match={result.sameValue}>
              <div>
                <small>按{orderName[readOrder]}读回</small>
                <strong>{result.decodedHex}</strong>
              </div>
              <span>{result.sameValue ? '与原值一致' : '与原值不同'}</span>
            </div>
            <p className="experiment-status" role="status">
              {writeOrder === readOrder
                ? `写入和读取都按${orderName[writeOrder]}解释；四个地址的内容合起来仍是 ${result.originalHex}。`
                : result.sameValue
                  ? `写入与读取约定不同，但 ${result.originalHex} 的字节排列对称，读回数值碰巧相同。`
                  : `写入按${orderName[writeOrder]}、读取按${orderName[readOrder]}；字节没有变化，只是权重变了，因而读成 ${result.decodedHex}。`}
            </p>
          </>
        )
      )}
    </Experiment>
  );
}
