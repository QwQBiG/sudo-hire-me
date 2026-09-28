import { useState } from 'react';
import { ArrowRight, GitCommitHorizontal } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { gitAction, gitStatus, newGitState, snapshotDiff } from '../../domain/practice.mjs';
import './practice.css';

export default function GitLab() {
  const [state, setState] = useState(newGitState);
  const status = gitStatus(state);
  return (
    <Experiment
      className="practice-lab"
      title="同一文件，三个版本"
      subtitle="单个已跟踪文件的快照模型；普通 commit 只记录暂存区，不操作真实仓库。"
      onReset={() => setState(newGitState())}
    >
      <div className="practice-git-columns experiment-scene">
        <section>
          <small>WORKING TREE</small>
          <h4>工作区</h4>
          <label htmlFor="practice-git-file">notes.txt</label>
          <textarea
            id="practice-git-file"
            maxLength={100}
            value={state.working}
            onChange={(event) => setState(gitAction(state, 'edit', event.target.value))}
            spellCheck={false}
          />
          <span>{state.working === state.staged ? '与暂存区相同' : '存在未暂存修改'}</span>
        </section>
        <section>
          <small>INDEX</small>
          <h4>暂存区</h4>
          <code>{state.staged || '(empty file)'}</code>
          <span>下一次普通提交的内容</span>
        </section>
        <section>
          <small>HEAD</small>
          <h4>当前提交</h4>
          <code>{state.head || '(empty file)'}</code>
          <span>{state.count ? `已新增 ${state.count} 次提交` : '初始快照'}</span>
        </section>
      </div>
      <div className="experiment-controls">
        <button
          disabled={state.working === state.staged}
          onClick={() => setState(gitAction(state, 'stage'))}
        >
          <ArrowRight size={16} />
          git add notes.txt
        </button>
        <button
          disabled={state.staged === state.head}
          onClick={() => setState(gitAction(state, 'commit'))}
        >
          <GitCommitHorizontal size={16} />
          git commit
        </button>
      </div>
      <div className="practice-diffs">
        {[
          { title: 'git diff', from: state.staged, to: state.working },
          { title: 'git diff --cached', from: state.head, to: state.staged },
        ].map((diff) => (
          <div key={diff.title}>
            <strong>{diff.title}</strong>
            {diff.from === diff.to ? (
              <pre>没有差异</pre>
            ) : (
              <pre>
                {snapshotDiff(diff.from, diff.to).map((line, index) => (
                  <span key={index} className={`practice-${line.kind}`}>
                    {line.text}
                  </span>
                ))}
              </pre>
            )}
          </div>
        ))}
      </div>
      <small>简化差异：变更时列出整份旧、新快照的各行，未计算最小差异与区块头。</small>
      <p className="experiment-status" aria-live="polite">
        <code>{status.trim() ? `${status} notes.txt` : 'working tree clean'}</code>
        <br />
        {status === 'MM'
          ? '暂存之后再次编辑，两个比较范围都有变化。此时 commit 会保存中间那一版。'
          : state.working !== state.staged
            ? '工作区的新编辑尚未加入下一次提交。'
            : state.staged !== state.head
              ? '暂存内容已准备好，commit 将保存这一版。'
              : '三个位置的文件内容相同。'}
      </p>
    </Experiment>
  );
}
