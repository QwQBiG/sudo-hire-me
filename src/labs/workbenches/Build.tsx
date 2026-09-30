import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, CircleAlert, FileCode, Package, Play } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';

const sequences: Record<string, string[]> = {
  'program-compile-run': ['预处理', '编译', '汇编', '链接', '装载运行'],
  'module-compile-link': ['编译 main.c', '编译 math.c', '链接 main.o + math.o'],
  'ci-pipeline-basic': ['安装锁定依赖', '静态检查', '测试', '构建', '保存产物'],
};
export default function Build({ lesson }: LabProps) {
  const s = lesson.slug;
  const [steps, setSteps] = useState(sequences[s] ?? []);
  const [fault, setFault] = useState(false);
  const [defined, setDefined] = useState(true);
  const [duplicate, setDuplicate] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [failed, setFailed] = useState(-1);
  const [note, setNote] = useState('改变一个前提，再执行构建，观察它在哪个边界生效。');
  const [locked, setLocked] = useState(true);
  const [published, setPublished] = useState(false);
  const [installed, setInstalled] = useState<string | null>(null);
  const [source, setSource] = useState(1);
  const [artifact, setArtifact] = useState<number | null>(null);
  const [deployed, setDeployed] = useState<number | null>(null);
  function reset() {
    setSteps(sequences[s] ?? []);
    setFault(false);
    setDefined(true);
    setDuplicate(false);
    setResults([]);
    setFailed(-1);
    setNote('构建现场已重置。');
    setPublished(false);
    setInstalled(null);
    setSource(1);
    setArtifact(null);
    setDeployed(null);
  }
  if (s === 'dependency-lockfiles')
    return (
      <Bench
        title="隔一天安装，还会得到同一版本吗"
        subtitle="固定示例依赖约束 ^1.2.0；注册表先有 1.2.3，随后发布兼容版本 1.3.0。"
        onReset={reset}
      >
        <label>
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
          采用锁文件，固定 1.2.3
        </label>
        <div className="dependency-shelves">
          <div>
            <Package size={27} />
            <small>Registry</small>
            <strong>1.2.3{published ? ' · 1.3.0' : ''}</strong>
          </div>
          <div>
            <FileCode size={27} />
            <small>Lockfile</small>
            <strong>{locked ? '1.2.3' : '未固定'}</strong>
          </div>
          <div>
            <Package size={27} />
            <small>本次安装</small>
            <strong>{installed ?? '待安装'}</strong>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              setInstalled(locked ? '1.2.3' : published ? '1.3.0' : '1.2.3');
              setNote(
                locked
                  ? '按已有锁定结果复现版本；仍需要兼容的工具链与平台。'
                  : '重新解析当前版本范围，结果可能随注册表变化。',
              );
            }}
          >
            解析并安装
          </button>
          <button
            className="secondary"
            disabled={published}
            onClick={() => {
              setPublished(true);
              setNote('新增 1.3.0；已有安装与锁文件不会自动改写。');
            }}
          >
            发布兼容新版本
          </button>
        </div>
        <Feedback>{note}</Feedback>
      </Bench>
    );
  if (s === 'build-artifact-release')
    return (
      <Bench
        title="让发布指向某一份确定的产物"
        subtitle="源码版本、构建产物和运行版本分别记录；此处用版本编号标识产物。"
        onReset={reset}
      >
        <div className="dependency-shelves">
          <div>
            <FileCode size={28} />
            <small>源码</small>
            <strong>v{source}</strong>
          </div>
          <div>
            <Package size={28} />
            <small>已构建产物</small>
            <strong>{artifact ? `artifact-v${artifact}` : '尚未构建'}</strong>
          </div>
          <div>
            <Play size={28} />
            <small>部署运行</small>
            <strong>{deployed ? `artifact-v${deployed}` : '尚未部署'}</strong>
          </div>
        </div>
        <div className="bench-actions">
          <button
            className="secondary"
            onClick={() => {
              setSource(source + 1);
              setNote('源码变化，已经构建和部署的旧产物保持不变。');
            }}
          >
            修改源码
          </button>
          <button
            className="primary"
            onClick={() => {
              setArtifact(source);
              setNote(`从源码 v${source} 构建产物，绑定本次输入。`);
            }}
          >
            构建产物
          </button>
          <button
            className="secondary"
            disabled={artifact === null}
            onClick={() => {
              setDeployed(artifact);
              setNote(`发布 artifact-v${artifact}，没有在目标环境重新构建另一份产物。`);
            }}
          >
            部署这份产物
          </button>
        </div>
        <Feedback>{note}</Feedback>
      </Bench>
    );
  const modules = s === 'module-compile-link';
  const ci = s === 'ci-pipeline-basic';
  function run() {
    setResults([]);
    setFailed(-1);
    const wanted = sequences[s];
    const mismatch = steps.findIndex((name, i) => name !== wanted[i]);
    const validParallelOrder = modules && steps[2] === wanted[2];
    if (mismatch >= 0 && !validParallelOrder) {
      setFailed(mismatch);
      setNote(`${steps[mismatch]} 在本流程中缺少前置产物，请检查依赖顺序。`);
      return;
    }
    const logs: string[] = [];
    for (let i = 0; i < steps.length; i++) {
      if ((fault && i === (ci ? 2 : 1)) || (modules && i === 2 && (!defined || duplicate))) {
        setFailed(i);
        logs.push(
          modules && i === 2
            ? duplicate
              ? 'multiple definition of add'
              : 'undefined reference to add'
            : ci
              ? 'test failure'
              : 'syntax error',
        );
        setResults(logs);
        setNote(
          modules
            ? '声明说明调用形式，定义仍需在链接时唯一解析。'
            : ci
              ? '测试失败，下游构建与发布被阻断。'
              : '语法错误使编译停止，没有可用于后续阶段的有效产物。',
        );
        return;
      }
      logs.push(`${steps[i]} 完成`);
    }
    setResults(logs);
    setNote(
      ci
        ? '门禁全部满足，产物可进入发布；测试通过不代表覆盖所有行为。'
        : '所有阶段完成；这是过程模型，不是真实编译器执行。',
    );
  }
  return (
    <Bench
      title={
        modules
          ? '让跨文件符号在链接处相遇'
          : ci
            ? '把失败挡在发布之前'
            : '组装从源码到运行的依赖链'
      }
      subtitle={
        modules
          ? 'main.c 引用 add，math.c 提供定义；两个编译任务可以交换顺序，链接依赖它们。'
          : '调整顺序或引入故障，然后执行完整流程。'
      }
      onReset={reset}
    >
      <div className="bench-controls">
        {modules ? (
          <>
            <label>
              <input
                type="checkbox"
                checked={defined}
                onChange={(e) => setDefined(e.target.checked)}
              />
              math.o 提供 add 定义
            </label>
            <label>
              <input
                type="checkbox"
                checked={duplicate}
                onChange={(e) => setDuplicate(e.target.checked)}
              />
              另一目标文件也定义 add
            </label>
          </>
        ) : (
          <label>
            <input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} />
            {ci ? '引入一个失败测试' : '引入语法错误'}
          </label>
        )}
      </div>
      <ol className="build-chain">
        {steps.map((name, i) => (
          <li className={failed === i ? 'failed' : results[i] ? 'passed' : ''} key={name}>
            <span className="build-ordinal">{i + 1}</span>
            <strong>{name}</strong>
            <div>
              <button
                className="icon-button"
                disabled={i === 0}
                title="上移阶段"
                aria-label={`上移 ${name}`}
                onClick={() => {
                  setSteps((xs) => {
                    const next = [...xs];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    return next;
                  });
                  setResults([]);
                  setFailed(-1);
                }}
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-button"
                disabled={i === steps.length - 1}
                title="下移阶段"
                aria-label={`下移 ${name}`}
                onClick={() => {
                  setSteps((xs) => {
                    const next = [...xs];
                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                    return next;
                  });
                  setResults([]);
                  setFailed(-1);
                }}
              >
                <ArrowDown size={15} />
              </button>
              {failed === i ? <CircleAlert size={18} /> : results[i] ? <Check size={18} /> : null}
            </div>
          </li>
        ))}
      </ol>
      <button className="primary" onClick={run}>
        <Play size={16} />
        执行构建
      </button>
      <ol className="bench-log">
        {results.map((line, i) => (
          <li key={i}>
            <code>{i + 1}</code>
            {line}
          </li>
        ))}
      </ol>
      <Feedback good={failed < 0}>{note}</Feedback>
    </Bench>
  );
}
