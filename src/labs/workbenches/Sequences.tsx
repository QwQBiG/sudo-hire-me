import { useState } from 'react';
import { Undo2, Check, Play } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Feedback } from './Bench';

export default function Sequences({ lesson }: LabProps) {
  const slug = lesson.slug;
  const merge = slug === 'merge-sort';
  const backtrack = slug === 'backtracking-basics';
  const [left, setLeft] = useState([1, 4, 7]);
  const [right, setRight] = useState([2, 3, 8]);
  const [output, setOutput] = useState<number[]>([]);
  const [text, setText] = useState('([{}])');
  const [position, setPosition] = useState(0);
  const [stack, setStack] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [note, setNote] = useState(
    merge
      ? '从左右两段的首元素中选择更小者。'
      : backtrack
        ? '点击未使用的数字加入路径，满三位后保存，再撤销并探索另一条分支。'
        : '读取括号序列，观察栈顶是否能与右括号配对。',
  );
  function reset() {
    setLeft([1, 4, 7]);
    setRight([2, 3, 8]);
    setOutput([]);
    setPosition(0);
    setStack([]);
    setFailed(false);
    setSaved([]);
    setNote('本轮数据已重置。');
  }
  if (merge)
    return (
      <Bench
        title="亲手合并两个有序子数组"
        subtitle="递归子问题已排好序；现在完成归并层，右侧未取出的元素仍保持原顺序。"
        onReset={reset}
      >
        <div className="merge-streams">
          {[left, right].map((xs, side) => (
            <div key={side}>
              <div className="bench-label">{side ? '右子数组' : '左子数组'}</div>
              <div className="bench-tokens">
                {xs.map((v, i) => (
                  <button
                    key={v}
                    className="bench-token"
                    disabled={i > 0}
                    onClick={() => {
                      const other = side ? left : right;
                      if (other.length && v > other[0])
                        return setNote(
                          `${v} 比另一侧首元素 ${other[0]} 大，先取它会破坏输出有序性。`,
                        );
                      setOutput([...output, v]);
                      if (side) setRight(right.slice(1));
                      else setLeft(left.slice(1));
                      setNote(`取出 ${v}，只有这一侧的读取位置前移。`);
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="merge-output">
          <span>合并结果</span>
          <div className="bench-tokens">
            {output.map((v) => (
              <span className="bench-token done" key={v}>
                {v}
              </span>
            ))}
          </div>
        </div>
        <Feedback>
          {output.length === 6
            ? '归并完成，两个有序子数组被合成为一个有序数组。每个元素只搬移一次，本次合并为 O(n)。'
            : note}
        </Feedback>
      </Bench>
    );
  if (backtrack)
    return (
      <Bench
        title="在排列树上试探与撤销"
        subtitle="三个不同元素 1、2、3；完整排列共 3! = 6 个。"
        onReset={reset}
      >
        <div className="permutation-branches">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              disabled={output.includes(n)}
              onClick={() => {
                setOutput([...output, n]);
                setNote(`选择 ${n}，本条路径不能再次使用它。`);
              }}
            >
              <small>{output.includes(n) ? '已使用' : '可选择'}</small>
              <strong>{n}</strong>
            </button>
          ))}
        </div>
        <div className="permutation-path">
          {[0, 1, 2].map((i) => (
            <span key={i}>{output[i] ?? '?'}</span>
          ))}
        </div>
        <div className="bench-actions">
          <button
            className="secondary"
            disabled={!output.length}
            onClick={() => {
              setOutput(output.slice(0, -1));
              setNote('撤销最后一个选择，同时恢复它的可用状态。');
            }}
          >
            <Undo2 size={16} />
            撤销选择
          </button>
          <button
            className="primary"
            disabled={output.length !== 3}
            onClick={() => {
              const key = output.join('');
              if (saved.includes(key)) return setNote('这个排列已经记录过。');
              setSaved([...saved, key]);
              setNote('记录完整解。现在回退，寻找下一条尚未探索的分支。');
            }}
          >
            <Check size={16} />
            保存排列
          </button>
        </div>
        <div className="bench-tokens">
          {saved.map((s) => (
            <span className="bench-token done" key={s}>
              {s}
            </span>
          ))}
        </div>
        <Feedback>
          已找到 {saved.length} / 6。{note}
        </Feedback>
      </Bench>
    );
  return (
    <Bench
      title="让栈顶检验每个右括号"
      subtitle="输入只允许 ()、[]、{}；空串也属于匹配序列。"
      onReset={reset}
    >
      <label>
        括号序列
        <input
          value={text}
          maxLength={24}
          onChange={(e) => {
            setText(e.target.value);
            reset();
          }}
        />
      </label>
      <div className="bracket-tape">
        {Array.from(text).map((char, i) => (
          <span key={i} className={i === position ? 'active' : i < position ? 'done' : ''}>
            {char}
          </span>
        ))}
      </div>
      <div className="stack-well">
        <small>栈顶</small>
        {[...stack].reverse().map((char, i) => (
          <span key={i}>{char}</span>
        ))}
        {!stack.length && <em>空栈</em>}
      </div>
      <div className="bench-actions">
        <button
          className="primary"
          disabled={failed || position >= text.length}
          onClick={() => {
            const char = text[position];
            if ('([{'.includes(char)) {
              setStack([...stack, char]);
              setNote(`左括号 ${char} 入栈。`);
            } else {
              const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
              if (!pair[char] || stack.at(-1) !== pair[char]) {
                setFailed(true);
                setNote(
                  `右括号 ${char} 与当前栈顶 ${stack.at(-1) ?? '空'} 不匹配，已经可以判定失败。`,
                );
              } else {
                setStack(stack.slice(0, -1));
                setNote(`成功配对 ${pair[char]}${char}，弹出栈顶。`);
              }
            }
            setPosition(position + 1);
          }}
        >
          <Play size={16} />
          处理当前字符
        </button>
      </div>
      <Feedback good={!failed}>
        {failed
          ? note
          : position === text.length
            ? stack.length
              ? '输入结束但栈非空，还有左括号未被关闭。'
              : '输入结束且栈为空，全部括号匹配。'
            : note}
      </Feedback>
    </Bench>
  );
}
