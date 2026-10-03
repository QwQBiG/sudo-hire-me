import { useEffect, useRef, useState } from 'react';
import { ArrowRight, KeyRound, Play, ShieldCheck } from 'lucide-react';
import type { LabProps } from '../../types';
import { accessDecision } from '../../domain/expansion.mjs';
import { Bench, Choice, Feedback } from '../workbenches/Bench';
import './expansion.css';

export default function Security({ lesson }: LabProps) {
  const [signedIn, setSignedIn] = useState(false),
    [role, setRole] = useState('editor'),
    [own, setOwn] = useState(true);
  const [input, setInput] = useState('hello'),
    [mode, setMode] = useState('hash'),
    [result, setResult] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const reset = () => {
    generation.current++;
    setBusy(false);
    setResult('');
    setNote('');
    setSignedIn(false);
    setRole('editor');
    setOwn(true);
  };
  const run = async () => {
    const id = ++generation.current;
    setBusy(true);
    setNote('');
    setResult('');
    try {
      const data = new TextEncoder().encode(input);
      let output = '',
        message = '';
      const hex = (bytes: ArrayBuffer | Uint8Array) =>
        Array.from(new Uint8Array(bytes))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      if (mode === 'encode') {
        output = btoa(Array.from(data, (b) => String.fromCharCode(b)).join(''));
        message = `Base64 是编码：无需秘密即可还原为“${new TextDecoder().decode(Uint8Array.from(atob(output), (c) => c.charCodeAt(0)))}”。`;
      } else if (mode === 'hash') {
        output = hex(await crypto.subtle.digest('SHA-256', data));
        message =
          '浏览器实际计算 SHA-256：32 字节摘要，显示为 64 个十六进制字符。不是可解密的密文，也不适合直接存储密码。';
      } else {
        const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
          'encrypt',
          'decrypt',
        ]);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        const restored = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        output = `IV: ${hex(iv)}\n密文及认证标签: ${hex(encrypted)}\n解密: ${new TextDecoder().decode(restored)}`;
        message =
          '浏览器实际执行 AES-GCM 加解密，每次生成新的临时密钥和随机 IV。密钥未导出；本实验不是用于保存秘密的产品。';
      }
      if (id === generation.current) {
        setResult(output);
        setNote(message);
      }
    } catch (error) {
      if (id === generation.current)
        setNote(
          `操作失败：${error instanceof Error ? error.message : String(error)}；Web Crypto 需要安全上下文。`,
        );
    } finally {
      if (id === generation.current) setBusy(false);
    }
  };
  const status = accessDecision(signedIn, role, own);
  return (
    <Bench
      className="expansion"
      title={lesson.title}
      subtitle={
        lesson.slug === 'authentication-authorization'
          ? '身份与资源权限模型；不创建真实登录会话。'
          : '使用当前浏览器的 TextEncoder 与 Web Crypto 实际计算。'
      }
      onReset={reset}
    >
      {lesson.slug === 'authentication-authorization' ? (
        <>
          <label className="exp-check">
            <input
              type="checkbox"
              checked={signedIn}
              onChange={(e) => setSignedIn(e.target.checked)}
            />
            有有效登录身份
          </label>
          <Choice
            label="角色"
            value={role}
            options={[
              ['reader', '读者'],
              ['editor', '编辑'],
              ['admin', '管理员'],
            ]}
            onChange={setRole}
          />
          <label className="exp-check">
            <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
            目标文章属于当前用户
          </label>
          <div className="exp-circuit">
            <div className={signedIn ? 'active' : 'blocked'}>
              <KeyRound />
              <small>认证 · 你是谁</small>
              <strong>{signedIn ? '通过' : '缺少身份'}</strong>
            </div>
            <ArrowRight />
            <div className={status === 200 ? 'active' : 'blocked'}>
              <ShieldCheck />
              <small>授权 · 能否删除文章</small>
              <strong>{status === 200 ? '允许' : '拒绝'}</strong>
            </div>
            <ArrowRight />
            <div>
              <small>响应</small>
              <strong>{status}</strong>
            </div>
          </div>
          <Feedback good={status === 200}>
            {status === 401
              ? '请求缺少有效认证；真实 HTTP 401 响应需携带适当的 WWW-Authenticate 挑战。'
              : status === 403
                ? '身份有效仍不满足此例权限：编辑只能删自己的文章，读者不能删；管理员可以。'
                : '服务端依据身份、角色和资源归属授权；不能依靠前端隐藏按钮。'}
          </Feedback>
        </>
      ) : (
        <>
          <Choice
            label="运算"
            value={mode}
            options={[
              ['encode', 'Base64 编码'],
              ['hash', 'SHA-256 摘要'],
              ['encrypt', 'AES-GCM 加密'],
            ]}
            onChange={(v) => {
              reset();
              setMode(v);
            }}
          />
          <label className="exp-input">
            输入文本
            <input
              aria-label="密码学实验文本"
              value={input}
              maxLength={200}
              onChange={(e) => {
                generation.current++;
                setInput(e.target.value);
                setResult('');
                setBusy(false);
                setNote('');
              }}
            />
          </label>
          <div className="exp-actions">
            <button disabled={busy} onClick={() => void run()}>
              <Play size={16} />
              {busy ? '计算中' : '计算并观察'}
            </button>
          </div>
          {result && (
            <pre className="exp-output" aria-label="实际计算结果">
              {result}
            </pre>
          )}
          <Feedback good={!note.startsWith('操作失败')}>
            {note ||
              '相同输入多次做摘要得到相同结果；加密实验每次使用新的临时密钥与随机 IV，因此输出不同。'}
          </Feedback>
        </>
      )}
    </Bench>
  );
}
