import { useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Cpu as CpuIcon, Database, StepForward } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { cpuState } from '../../domain/foundations.mjs';
import './foundations.css';
import './foundations-quality.css';

export default function Cpu() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState(7);
  const [addend, setAddend] = useState(3);
  const state = cpuState(step, input, addend);
  const instructions = ['LOAD R1, [100]', `ADDI R1, ${addend}`, 'STORE [104], R1'];
  const messages = [
    'PC 指向地址 0，尚未执行 LOAD。',
    `LOAD 复制 ${input} 到 R1，内存 [100] 不变。`,
    `ALU 计算 ${input} + ${addend}，只把 R1 更新为 ${state.r1}。`,
    `STORE 把 R1 的 ${state.r1} 写入 [104]，三条指令完成。`,
  ];
  return (
    <Experiment
      title="让数据走过 CPU"
      subtitle="示意指令集；每条指令 4 B，每次推进一条完整指令，不模拟时钟周期。"
      onReset={() => setStep(0)}
    >
      <div className="experiment-controls">
        <label>
          内存 [100]
          <input
            type="range"
            min="0"
            max="20"
            value={input}
            onChange={(e) => {
              setInput(Number(e.target.value));
              setStep(0);
            }}
          />
          <output>{input}</output>
        </label>
        <label>
          立即数
          <input
            type="range"
            min="0"
            max="10"
            value={addend}
            onChange={(e) => {
              setAddend(Number(e.target.value));
              setStep(0);
            }}
          />
          <output>{addend}</output>
        </label>
      </div>
      <div className="f-cpu-layout">
        <ol className="f-instructions" aria-label="指令内存">
          {instructions.map((instruction, i) => (
            <li key={i} className={step === i ? 'active' : step > i ? 'complete' : ''}>
              <code>{i * 4}</code>
              <code>{instruction}</code>
              <span>{step === i ? '← PC' : step > i ? '已执行' : ''}</span>
            </li>
          ))}
        </ol>
        <div className="f-cpu-flow" aria-label="数据通路">
          <div className={`f-cpu-memory ${step === 1 || step === 3 ? 'active' : ''}`}>
            <Database size={23} />
            <span>数据内存</span>
            <code>[100] = {state.source}</code>
            <code>[104] = {state.destination}</code>
          </div>
          <div className={`f-data-bus ${step === 1 || step === 3 ? 'active' : ''}`}>
            <span>{step === 3 ? 'STORE' : 'LOAD'}</span>
            {step === 3 ? <ArrowLeft size={30} /> : <ArrowRight size={30} />}
            {(step === 1 || step === 3) && (
              <strong
                key={step}
                className="f-bus-packet"
                style={step === 3 ? ({ '--bus-start': '24px' } as CSSProperties) : undefined}
              >
                {state.r1}
              </strong>
            )}
          </div>
          <div className={`f-register ${step === 1 || step === 2 ? 'active' : ''}`}>
            <CpuIcon size={23} />
            <span>寄存器 R1</span>
            <strong>{state.r1}</strong>
          </div>
          <div className={`f-alu ${step === 2 ? 'active' : ''}`}>
            <span>ALU</span>
            <strong>+ {addend}</strong>
          </div>
        </div>
      </div>
      <div className="foundation-state-strip" aria-live="polite">
        <span>
          完成 <strong>{step} / 3</strong> 条指令
        </span>
        <span>
          R1 <strong>{state.r1}</strong>
        </span>
        <span>
          [104] <strong>{state.destination}</strong>
        </span>
        <span>
          {step === 3
            ? 'PC 12：程序片段结束'
            : `PC ${state.pc}：下一条 ${instructions[step].split(' ')[0]}`}
        </span>
      </div>
      <div className="experiment-controls">
        <button className="primary" disabled={step === 3} onClick={() => setStep(step + 1)}>
          <StepForward size={17} />
          {step === 3 ? '指令已完成' : `执行 ${instructions[step].split(' ')[0]}`}
        </button>
        <output>PC = {state.pc}</output>
      </div>
      <p className="experiment-status" aria-live="polite">
        {messages[step]}
      </p>
    </Experiment>
  );
}
