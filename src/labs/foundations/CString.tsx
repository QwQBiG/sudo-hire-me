import { useState } from 'react';
import { StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { scanCString } from '../../domain/cstring.mjs';
import './cstring.css';

const initialBytes = [67, 97, 116, 0, 88];

function byteLabel(byte: number) {
  return byte === 0 ? 'NUL' : String.fromCharCode(byte);
}

export default function CString() {
  const [bytes, setBytes] = useState(initialBytes);
  const [step, setStep] = useState(0);
  const scan = scanCString(bytes);
  const complete = step === scan.visited.length;

  function toggle(index: number) {
    setBytes((previous) =>
      previous.map((byte, at) =>
        at === index ? (byte === 0 ? initialBytes[index] || 33 : 0) : byte,
      ),
    );
    setStep(0);
  }

  return (
    <Experiment
      className="cstring-lab"
      title="沿着字节找第一个 NUL"
      subtitle="固定 5 字节缓冲区；点击任一格切换零字节，再逐格扫描。实验不会越界读取。"
      onReset={() => {
        setBytes(initialBytes);
        setStep(0);
      }}
    >
      <div className="foundation-search-cases" role="group" aria-label="字符串边界示例">
        <button
          onClick={() => {
            setBytes(initialBytes);
            setStep(0);
          }}
        >
          正常终止
        </button>
        <button
          onClick={() => {
            setBytes([0, 97, 116, 0, 88]);
            setStep(0);
          }}
        >
          首字节 NUL
        </button>
        <button
          onClick={() => {
            setBytes([67, 97, 116, 33, 88]);
            setStep(0);
          }}
        >
          没有 NUL
        </button>
      </div>
      <div className="cstring-register" aria-label="五字节缓冲区">
        {bytes.map((byte, index) => (
          <button
            type="button"
            key={index}
            className={`cstring-byte ${byte === 0 ? 'nul' : ''} ${step > index && scan.visited.includes(index) ? 'scanned' : ''} ${step > 0 && step - 1 === index ? 'current' : ''}`}
            onClick={() => toggle(index)}
            aria-label={`偏移 ${index}，当前 ${byte === 0 ? '零终止符' : byteLabel(byte)}，点击切换零字节`}
            title={`偏移 ${index}：点击切换 NUL`}
          >
            <small>{index}</small>
            <strong>{byteLabel(byte)}</strong>
            <code>0x{byte.toString(16).toUpperCase().padStart(2, '0')}</code>
          </button>
        ))}
      </div>
      <div className="cstring-controls">
        <button
          type="button"
          className="secondary"
          disabled={complete}
          onClick={() => setStep((value) => Math.min(value + 1, scan.visited.length))}
        >
          <StepForward size={15} aria-hidden="true" />
          扫描下一格
        </button>
        <span>
          已检查 {step} / {scan.visited.length} 格
        </span>
      </div>
      <div
        className="foundation-buffer-guard"
        data-blocked={complete && !scan.terminated}
        role="status"
      >
        <code>有效缓冲区 [0, {bytes.length})</code>
        <span>
          {complete
            ? scan.terminated
              ? `在 ${scan.terminatorIndex} 停止；终止符不计入长度`
              : `到达边界 ${bytes.length}；不继续读取`
            : `下一偏移 ${step}`}
        </span>
      </div>
      <div className="cstring-readout">
        <div>
          <small>缓冲区容量</small>
          <strong>{scan.capacity} B</strong>
        </div>
        <div>
          <small>首个 NUL 偏移</small>
          <strong>{complete && scan.terminated ? scan.terminatorIndex : '—'}</strong>
        </div>
        <div>
          <small>strlen 结果</small>
          <strong>{complete && scan.terminated ? scan.length : '—'}</strong>
        </div>
      </div>
      <p className="experiment-status" role="status">
        {step === 0
          ? '扫描还未开始。strlen 的终点是首个 NUL，不由缓冲区容量直接决定。'
          : complete
            ? scan.terminated
              ? `在偏移 ${scan.terminatorIndex} 找到首个 NUL，前面共有 ${scan.length} 个字节；后续 ${scan.ignoredAfterTerminator} 格不属于这个字符串。`
              : '已检查全部 5 格却没有 NUL：这不是可安全交给 strlen 的已终止字符串，实验到边界即停止。'
            : `偏移 ${scan.visited[step - 1]} 的字节不是 NUL，继续向右检查。`}
      </p>
    </Experiment>
  );
}
