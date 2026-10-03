import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Clipboard, MessageCircle, Plus, X } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback, Meter } from './Bench';
import './workbench-quality.css';

type Segment = { label: string; text: string; reason: string };
const scripts: Record<
  string,
  { title: string; question: string; followup: string; segments: Segment[] }
> = {
  'self-introduction-technical': {
    title: '把自我介绍排成一条可追问的线',
    question: '请用一分钟介绍自己，并说一项最能代表你能力的工作。',
    followup: '你刚才说的贡献，具体哪部分是你完成的？',
    segments: [
      {
        label: '方向',
        text: '我主要关注系统编程与后端基础，最近在持续练习并发和资源管理。',
        reason: '先交代当前方向，让后面的案例有上下文。',
      },
      {
        label: '具体贡献',
        text: '在一个课程项目里，我负责请求超时处理和资源释放路径。',
        reason: '说明责任范围，不能把团队成果全部写成个人成果。',
      },
      {
        label: '证据',
        text: '我给取消、超时和正常返回分别补了用例，并复现过超时后连接未归还的问题。',
        reason: '提供可以展开的方法和证据；使用前替换成真实经历。',
      },
      {
        label: '边界',
        text: '目前验证的是测试环境里的行为，生产流量下的容量表现还需要进一步测量。',
        reason: '把验证范围讲清楚，避免把有限结果扩成普遍保证。',
      },
    ],
  },
  'project-explanation-structure': {
    title: '让项目讲解保留完整的因果链',
    question: '这个项目解决什么问题？一次请求是怎样走完的？',
    followup: '如果下游超时，哪一层负责取消与清理？',
    segments: [
      {
        label: '目标',
        text: '项目要处理批量查询，并给整个请求设置统一截止时间。',
        reason: '用具体问题开始，避免先报框架名称。',
      },
      {
        label: '路径',
        text: '入口校验参数后分派查询，再聚合结果；剩余时间预算传给每个下游调用。',
        reason: '讲清组件怎样协作，而非只列组件。',
      },
      {
        label: '取舍',
        text: '我采用有界并发，牺牲少量排队延迟，避免瞬时创建过多请求。',
        reason: '说明方案的收益与付出的代价。',
      },
      {
        label: '失败边界',
        text: '取消本地等待不保证远端已经停止，因此副作用操作另设幂等键。',
        reason: '正常路径之外，要说明失败与重试。',
      },
    ],
  },
  'technical-tradeoffs': {
    title: '把一个选择写成有条件的判断',
    question: '为什么选择线程池，而不是每个请求新建线程？',
    followup: '什么条件改变后，你会重新选择？',
    segments: [
      {
        label: '约束',
        text: '当前任务数量突发，但下游最多同时处理几十个请求。',
        reason: '取舍要先有负载与资源约束。',
      },
      {
        label: '比较',
        text: '每次新建线程实现直观，但突发时线程与连接数量不受控。',
        reason: '公平说明备选方案的优点和局限。',
      },
      {
        label: '决策',
        text: '固定工作线程配有界队列，可以限制并发并明确满载时的拒绝策略。',
        reason: '把机制与约束对应起来。',
      },
      {
        label: '代价与复评',
        text: '线程池引入排队和调度成本；如果任务主要等待 I/O，会进一步比较事件驱动方案并做同负载测量。',
        reason: '没有脱离工作负载的绝对最优方案。',
      },
    ],
  },
  'debugging-story-evidence': {
    title: '把排障叙述连接到证据',
    question: '讲一次你定位过的难问题。',
    followup: '你怎么排除“只是下游变慢”的可能？',
    segments: [
      {
        label: '现象',
        text: '持续运行一段时间后，请求延迟升高，连接池等待增加。',
        reason: '先描述可观察现象，不直接把猜测当根因。',
      },
      {
        label: '假设与检查',
        text: '我比较正常与超时路径的借出、归还记录，发现超时路径存在未配对记录。',
        reason: '说明怎样用数据区分假设。',
      },
      {
        label: '修复',
        text: '把资源归还放进所有出口都会执行的清理路径，并避免重复归还。',
        reason: '讲清修复对应哪个机制。',
      },
      {
        label: '复测',
        text: '用相同并发与超时条件复测，检查活跃连接是否回到基线，并保留回归用例。',
        reason: '修复完成不等于问题已验证解决。',
      },
    ],
  },
  'unknown-question-reasoning': {
    title: '在不会的问题中保留清晰的推理',
    question: '为什么这个并发程序偶尔读到旧值？',
    followup: '你现在的判断哪些是事实，哪些是假设？',
    segments: [
      {
        label: '明确未知',
        text: '我还不能只凭这个现象确定原因，需要先确认共享变量类型和同步方式。',
        reason: '准确说出未知边界。',
      },
      {
        label: '已知原则',
        text: '线程间能否看到先前写入，需要检查相应的内存模型和同步关系。',
        reason: '用可靠原理起步，不把猜测包装成事实。',
      },
      {
        label: '提出假设',
        text: '一个可能原因是发布标记与数据之间没有建立必要的同步关系。',
        reason: '明确标识这是待验证假设。',
      },
      {
        label: '验证路径',
        text: '我会先缩成最小例子，检查原子访问和 release/acquire 配对，再对照语言规范判断允许结果。',
        reason: '给出可执行的下一步，不用“多试几次”代替证明。',
      },
    ],
  },
};

export default function Interview({ lesson }: LabProps) {
  const script = scripts[lesson.slug];
  const [chosen, setChosen] = useState<number[]>([]);
  const [texts, setTexts] = useState(script.segments.map((s) => s.text));
  const [note, setNote] = useState('从素材中选择要保留的部分，再调整顺序和内容。');
  const [followup, setFollowup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rehearsal, setRehearsal] = useState(false);
  const [evidence, setEvidence] = useState<boolean[]>(script.segments.map(() => false));
  const answer = chosen.map((i) => texts[i]).join('\n\n');
  const estimated = Math.ceil(Array.from(answer.replace(/\s/g, '')).length / 4);
  return (
    <Bench
      title={script.title}
      subtitle="示例素材用于练习组织表达；把经历、数据和验证范围改成自己能够证明的内容。"
      onReset={() => {
        setChosen([]);
        setTexts(script.segments.map((s) => s.text));
        setFollowup(false);
        setCopied(false);
        setRehearsal(false);
        setEvidence(script.segments.map(() => false));
        setNote('答稿已清空。');
      }}
    >
      <div className="interviewer-question">
        <MessageCircle size={24} />
        <p>{followup ? script.followup : script.question}</p>
      </div>
      <div className="interview-studio">
        <div className="interview-materials">
          <div className="bench-label">表达素材</div>
          {script.segments.map((segment, i) => (
            <button
              key={segment.label}
              disabled={chosen.includes(i)}
              onClick={() => {
                setChosen([...chosen, i]);
                setNote(segment.reason);
                setCopied(false);
              }}
            >
              <span>{segment.label}</span>
              <p>{segment.text}</p>
              <Plus size={16} />
            </button>
          ))}
        </div>
        <div className="interview-draft">
          <div className="bench-label">
            你的答稿 <span>预计 {estimated} 秒 · 按约 4 字/秒估算</span>
          </div>
          {chosen.length ? (
            chosen.map((i, position) => (
              <div className="draft-fragment" key={i}>
                <div>
                  <b>{script.segments[i].label}</b>
                  <button
                    className="icon-button"
                    disabled={position === 0}
                    title="上移"
                    aria-label={`上移${script.segments[i].label}`}
                    onClick={() => {
                      setChosen((xs) => {
                        const next = [...xs];
                        [next[position - 1], next[position]] = [next[position], next[position - 1]];
                        return next;
                      });
                      setCopied(false);
                    }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={position === chosen.length - 1}
                    title="下移"
                    aria-label={`下移${script.segments[i].label}`}
                    onClick={() => {
                      setChosen((xs) => {
                        const next = [...xs];
                        [next[position + 1], next[position]] = [next[position], next[position + 1]];
                        return next;
                      });
                      setCopied(false);
                    }}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="icon-button"
                    title="移除"
                    aria-label={`移除${script.segments[i].label}`}
                    onClick={() => {
                      setChosen(chosen.filter((n) => n !== i));
                      setCopied(false);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  aria-label={`编辑${script.segments[i].label}`}
                  maxLength={500}
                  value={texts[i]}
                  onChange={(e) => {
                    setTexts((xs) => xs.map((v, n) => (n === i ? e.target.value : v)));
                    setCopied(false);
                  }}
                />
              </div>
            ))
          ) : (
            <div className="draft-empty">
              <MessageCircle size={32} />
              <p>先放入一句能够展开的回答</p>
            </div>
          )}
          <Meter label="已选表达维度，不代表内容真实性评分" value={chosen.length} max={4} />
          {chosen.length > 0 && (
            <div className="draft-evidence">
              {chosen.map((i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={evidence[i]}
                    onChange={(event) =>
                      setEvidence((rows) =>
                        rows.map((checked, index) =>
                          index === i ? event.target.checked : checked,
                        ),
                      )
                    }
                  />
                  <span>{script.segments[i].label}：我能提供真实细节或说明边界</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {rehearsal && (
        <section className="interview-rehearsal" aria-label="完整口述答稿">
          <div className="bench-label">当前口述答稿 · 约 {estimated} 秒</div>
          {chosen.map((i) => (
            <p key={i}>{texts[i] || '此部分尚未写入内容'}</p>
          ))}
          <small>
            自查真实证据：{chosen.filter((i) => evidence[i]).length} / {chosen.length}{' '}
            个表达维度；勾选只记录自查，不验证真实性。
          </small>
        </section>
      )}
      <div className="bench-actions">
        <button
          className="secondary"
          disabled={!chosen.length}
          onClick={() => setRehearsal(!rehearsal)}
        >
          <MessageCircle size={16} />
          {rehearsal ? '收起口述稿' : '预演完整回答'}
        </button>
        <button
          className="primary"
          disabled={!chosen.length}
          onClick={() => {
            setFollowup(!followup);
            setNote(
              '对照追问检查：答稿中有没有足够的信息支撑回答？未写出的经历不能靠措辞补成事实。',
            );
          }}
        >
          <MessageCircle size={16} />
          {followup ? '回到主问题' : '接受追问'}
        </button>
        <button
          className="secondary"
          disabled={!answer}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(answer);
              setCopied(true);
            } catch {
              setNote('浏览器未允许剪贴板写入，答稿仍保留在编辑区。');
            }
          }}
        >
          {copied ? <Check size={16} /> : <Clipboard size={16} />}复制答稿
        </button>
      </div>
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
