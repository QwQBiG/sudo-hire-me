import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import { indexLeaves, queryIndex } from '../../domain/practice.mjs';
import './practice.css';
import './practice-quality.css';

export default function IndexLab() {
  const [target, setTarget] = useState(62);
  const [covering, setCovering] = useState(false);
  const [searched, setSearched] = useState(false);
  const result = queryIndex(target, covering);
  const reset = () => {
    setTarget(62);
    setCovering(false);
    setSearched(false);
  };
  return (
    <Experiment
      className="practice-lab"
      title="沿索引找到一条记录"
      subtitle="两层 B+ 树教学结构；节点访问与行检查不是相同计量单位，不代表实际耗时。"
      onReset={reset}
    >
      <div className="experiment-controls">
        <label>
          目标 score
          <SelectField
            value={target}
            onChange={(event) => {
              setTarget(Number(event.target.value));
              setSearched(false);
            }}
          >
            {[...indexLeaves.flat(), 42]
              .sort((a, b) => a - b)
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                  {value === 42 ? '（不存在）' : ''}
                </option>
              ))}
          </SelectField>
        </label>
        <label>
          <input
            type="checkbox"
            checked={covering}
            onChange={(event) => setCovering(event.target.checked)}
          />
          只取 score（覆盖）
        </label>
        <button onClick={() => setSearched(true)}>
          <Search size={16} />
          查找
        </button>
      </div>
      <code className="practice-query">
        SELECT {covering ? 'score' : 'name'} FROM grades WHERE score = {target};
      </code>
      <div className="practice-index-tree experiment-scene" aria-label="两层索引树">
        <div className={`practice-root ${searched ? 'is-visited' : ''}`}>
          <small>根节点 · 分隔键</small>
          <strong>
            25 <span>|</span> 50 <span>|</span> 75
          </strong>
        </div>
        <div className="practice-index-leaves">
          {indexLeaves.map((keys, leaf) => (
            <div
              key={leaf}
              className={`practice-leaf ${searched && result.leaf === leaf ? 'is-visited' : ''}`}
            >
              <small>叶节点 {leaf + 1}</small>
              <div>
                {keys.map((key) => (
                  <button
                    key={key}
                    className={searched && key === target ? 'is-match' : ''}
                    aria-label={`查询索引键 ${key}`}
                    aria-pressed={searched && key === target}
                    onClick={() => {
                      setTarget(key);
                      setSearched(true);
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={`practice-record ${searched && result.lookups ? 'is-visited' : ''}`}>
          <small>表记录</small>
          <strong>
            {searched && result.found && !covering
              ? `rowid ${result.row} · name: Student ${result.row}`
              : '记录存放在索引之外'}
          </strong>
          <span>
            {!searched
              ? '等待查询'
              : !result.found
                ? '没有匹配行，无需回表'
                : covering
                  ? '索引已提供 score，无需回表'
                  : '按 rowid 读取所需 name'}
          </span>
        </div>
      </div>
      <div className="experiment-metrics">
        <div className="metric">
          <span>全扫描需要检查</span>
          <strong>{searched ? '16 行' : '—'}</strong>
        </div>
        <div className="metric">
          <span>索引路径</span>
          <strong>{searched ? '2 个节点' : '—'}</strong>
        </div>
        <div className="metric">
          <span>额外读取表记录</span>
          <strong>{searched ? `${result.lookups} 行` : '—'}</strong>
        </div>
      </div>
      <p className="experiment-status" aria-live="polite">
        {!searched
          ? '索引按 score 排序，叶节点保存 score 与 rowid，name 保存在表记录中。'
          : result.found
            ? `命中叶节点 ${result.leaf + 1}。${covering ? `直接返回索引中的 score ${target}。` : '找到位置后，还要到表里取 name。'}`
            : `沿分隔键进入叶节点 ${result.leaf + 1}，42 不在其中，返回空结果。`}
      </p>
    </Experiment>
  );
}
