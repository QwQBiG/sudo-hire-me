import { useState } from 'react';
import { ArrowRight, Braces, Play, TriangleAlert } from 'lucide-react';
import { Bench, Choice, Feedback } from './Bench';
import './workbench-quality.css';

export default function Errors() {
  const [input, setInput] = useState('abc');
  const [mode, setMode] = useState('result');
  const [output, setOutput] = useState<{ valid: boolean; value: number } | null>(null);
  const [handled, setHandled] = useState(false);
  const formatValid = /^[+-]?\d+$/.test(input);
  const valid = formatValid && Number(input) >= 0 && Number(input) <= 65535;
  const error = formatValid ? 'RangeError' : 'ParseError';
  const value = output?.value;
  const channel = !output
    ? '等待调用'
    : mode === 'result'
      ? output.valid
        ? `Ok(${value})`
        : `Err(${error})`
      : mode === 'code'
        ? output.valid
          ? `status = 0; out = ${value}`
          : `status = ${formatValid ? 2 : 1}; out 未写入`
        : output.valid
          ? `return ${value}`
          : `throw ${error}`;
  function reset() {
    setInput('abc');
    setOutput(null);
    setHandled(false);
  }
  return (
    <Bench
      title="让同一次失败经过不同的返回通道"
      subtitle="与正文相同的端口解析器：接受 0..65535 的十进制整数，区分格式错误与越界；三种表达方式是教学接口。"
      onReset={reset}
    >
      <Choice
        label="错误通道"
        value={mode}
        options={[
          ['code', '返回码 + 输出参数'],
          ['result', 'Result 成功 / 错误分支'],
          ['exception', '异常'],
        ]}
        onChange={(value) => {
          setMode(value);
          setOutput(null);
          setHandled(false);
        }}
      />
      <div className="bench-actions">
        {['abc', '8080', '70000', '0'].map((sample) => (
          <button
            key={sample}
            className="secondary"
            onClick={() => {
              setInput(sample);
              setOutput(null);
              setHandled(false);
            }}
          >
            {sample}
          </button>
        ))}
      </div>
      <div className="contract-flow">
        <div>
          <label>
            解析输入
            <input
              value={input}
              maxLength={20}
              onChange={(e) => {
                setInput(e.target.value);
                setOutput(null);
                setHandled(false);
              }}
            />
          </label>
          <div className="bench-actions">
            <button
              className="primary"
              onClick={() => {
                setOutput({ valid, value: Number(input) });
                setHandled(false);
              }}
            >
              <Play size={16} />
              调用 parse
            </button>
          </div>
        </div>
        <ArrowRight className="contract-arrow" size={24} />
        <div>
          <div className="bench-label">
            <Braces size={18} />
            被调用函数
          </div>
          <pre className="bench-code">{channel}</pre>
        </div>
      </div>
      <div className={`contract-result ${output && !output.valid ? 'rejected' : ''}`}>
        <TriangleAlert size={24} />
        <div>
          <small>调用方</small>
          <output>
            {!output
              ? '尚未取得结果'
              : output.valid
                ? `取得整数 ${value}`
                : handled
                  ? '进入错误处理分支'
                  : '尚未处理失败'}
          </output>
        </div>
      </div>
      <div className="bench-actions">
        <button
          className="secondary"
          disabled={!output || output.valid}
          onClick={() => setHandled(true)}
        >
          {mode === 'exception'
            ? `catch ${error}`
            : mode === 'result'
              ? '匹配 Err 分支'
              : '检查 status != 0'}
        </button>
      </div>
      <div className="quality-lattice" aria-label="错误处理控制流">
        <div className={output?.valid ? 'active' : ''}>
          <small>成功分支</small>
          <code>
            {mode === 'result' ? 'Ok(value)' : mode === 'code' ? 'status == 0' : '正常 return'}
          </code>
          <output>{output?.valid ? `value = ${value}` : '没有有效成功值'}</output>
        </div>
        <div className={output && !output.valid ? 'failed' : ''}>
          <small>失败分支</small>
          <code>
            {mode === 'result' ? 'Err(error)' : mode === 'code' ? 'status != 0' : 'throw → catch'}
          </code>
          <output>{output && !output.valid ? (handled ? '已处理' : '必须处理') : '未进入'}</output>
        </div>
        <div className={handled || output?.valid ? 'active' : ''}>
          <small>调用方后续路径</small>
          <output>
            {!output
              ? '等待调用'
              : output.valid
                ? '使用解析值'
                : handled
                  ? '报告 / 降级 / 传播错误'
                  : '不能当作成功继续'}
          </output>
        </div>
      </div>
      <Feedback good={!output || output.valid || handled}>
        {!output
          ? 'abc 是格式错误，8080 成功，70000 越界，0 也在允许范围内，不能用它作为失败标记。'
          : output.valid
            ? '正常输入沿成功通道返回，调用方拿到有效整数。'
            : handled
              ? '失败被调用方明确处理，可向上报告或提供合理降级；不能凭空把失败结果当作有效值。'
              : mode === 'exception'
                ? '控制流沿调用栈寻找处理器，不会继续执行抛出点之后的普通语句。'
                : '失败已经发生，但调用方还没检查。若继续使用未写入的输出或强行取成功值，就会引入新的错误。'}
      </Feedback>
    </Bench>
  );
}
