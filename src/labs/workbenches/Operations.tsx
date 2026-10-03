import { useState } from 'react';
import { Activity, AlertTriangle, Check, Server, Shield, TestTube2 } from 'lucide-react';
import type { LabProps } from '../../types';
import { Bench, Choice, Feedback, Meter } from './Bench';
import './workbench-quality.css';

export default function Operations({ lesson }: LabProps) {
  const s = lesson.slug;
  const [mode, setMode] = useState('first');
  const [selected, setSelected] = useState(0);
  const [value, setValue] = useState(20);
  const [flag, setFlag] = useState(false);
  const [placements, setPlacements] = useState(['repo', 'public', 'runtime']);
  const [actions, setActions] = useState<string[]>([]);
  const [note, setNote] = useState('改变条件或采取行动，观察影响范围与证据。');
  const [result, setResult] = useState<string | null>(null);
  function reset() {
    setSelected(0);
    setValue(20);
    setFlag(false);
    setPlacements(['repo', 'public', 'runtime']);
    setActions([]);
    setResult(null);
    setNote('实验已重置。');
  }
  let title = '';
  let body;
  if (s === 'unit-integration-e2e-tests') {
    title = '把故障放在测试边界的不同位置';
    const levels = ['单元', '集成', '端到端'];
    body = (
      <>
        <Choice
          label="测试层次"
          value={mode}
          options={[
            ['first', '单元'],
            ['integration', '集成'],
            ['e2e', '端到端'],
          ]}
          onChange={(v) => {
            setMode(v);
            setResult(null);
          }}
        />
        <div className="test-boundaries">
          {['价格计算函数', '数据库字段映射', '浏览器表单提交'].map((name, i) => (
            <button
              className={selected === i ? 'fault' : ''}
              key={name}
              onClick={() => {
                setSelected(i);
                setResult(null);
              }}
            >
              <AlertTriangle size={24} />
              <strong>{name}</strong>
              <span>{selected === i ? '故障注入位置' : '点击注入故障'}</span>
            </button>
          ))}
        </div>
        <div className="quality-lattice" aria-label="本次测试实际经过的边界">
          {['计算函数', '数据库交互', '浏览器提交'].map((layer, i) => (
            <div
              key={layer}
              className={
                (mode === 'first' ? 0 : mode === 'integration' ? 1 : 2) >= i
                  ? selected === i
                    ? 'failed'
                    : 'active'
                  : ''
              }
            >
              <small>{layer}</small>
              <output>
                {(mode === 'first' ? 0 : mode === 'integration' ? 1 : 2) >= i
                  ? '本例测试包含'
                  : '本例未覆盖'}
              </output>
            </div>
          ))}
        </div>
        <button
          className="primary"
          onClick={() => {
            const coverage = mode === 'first' ? 0 : mode === 'integration' ? 1 : 2;
            setResult(selected <= coverage ? '发现失败' : '本次通过，但没有覆盖该故障位置');
            setNote(
              `${levels[coverage]}测试的示例边界包含${coverage === 0 ? '计算函数' : coverage === 1 ? '计算函数与数据库交互' : '完整用户提交路径'}。测试种类不能只按运行速度或文件名判断。`,
            );
          }}
        >
          <TestTube2 size={16} />
          运行这层测试
        </button>
        {result && <div className="operation-result">{result}</div>}
      </>
    );
  } else if (s === 'metrics-tracing-basics') {
    title = '找出请求时间花在了哪条路径';
    const spans = [
      { name: '入口处理', start: 0, length: 20 },
      { name: '数据库查询', start: 20, length: 180 },
      { name: '缓存查询（并行）', start: 20, length: 35 },
      { name: '组装响应', start: 200, length: 20 },
    ];
    body = (
      <>
        <div className="trace-waterfall">
          {spans.map((span, i) => (
            <button
              key={span.name}
              className={selected === i ? 'selected' : ''}
              onClick={() => {
                setSelected(i);
                setNote(
                  i === 2
                    ? '缓存查询与数据库查询并行，不能把这 35 ms 再加到请求总耗时里。'
                    : i === 1
                      ? '数据库 span 在此请求的关键路径上，占用 180 ms；下一步还要看 SQL、锁等待和调用次数。'
                      : '这个 span 可以解释局部工作，但不能凭一条 trace 推断所有请求都如此。',
                );
              }}
            >
              <span>{span.name}</span>
              <div>
                <i style={{ marginLeft: `${span.start / 2.2}%`, width: `${span.length / 2.2}%` }} />
              </div>
              <code>{span.length} ms</code>
            </button>
          ))}
        </div>
        <div className="bench-stat">
          <small>根 span：请求总耗时</small>
          <strong>220 ms</strong>
        </div>
        <div className="quality-path">
          <code>入口 20</code>
          <span>→</span>
          <code>并行等待 max(180, 35)</code>
          <span>→</span>
          <code>响应 20</code>
          <output>20 + 180 + 20 = 220 ms</output>
        </div>
        <Feedback>
          并行 span 耗时不能简单相加。指标用于观察分布与趋势，trace 用于关联一次请求的路径。
        </Feedback>
      </>
    );
  } else if (s === 'performance-profiling-basic') {
    title = '先找热点，再计算优化上限';
    const fraction = value / 100;
    const speed = mode === 'first' ? 2 : 5;
    const total = 1 - fraction + fraction / speed;
    body = (
      <>
        <label>
          可优化部分占原耗时 {value}%
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
        <Choice
          label="局部优化倍数"
          value={mode}
          options={[
            ['first', '局部提速 2 倍'],
            ['fast', '局部提速 5 倍'],
          ]}
          onChange={setMode}
        />
        <div className="profile-bars">
          <div>
            <span>优化前</span>
            <i style={{ width: '100%' }}>
              <b style={{ width: `${value}%` }} />
            </i>
          </div>
          <div>
            <span>优化后</span>
            <i style={{ width: `${total * 100}%` }}>
              <b style={{ width: `${(fraction / speed / total) * 100}%` }} />
            </i>
          </div>
        </div>
        <div className="bench-stat">
          <small>整体加速比，固定工作量</small>
          <strong>{(1 / total).toFixed(2)}×</strong>
        </div>
        <div className="quality-observation">
          <div>
            <small>若原总耗时为 1000 ms</small>
            <output>{(total * 1000).toFixed(0)} ms</output>
          </div>
          <div>
            <small>不可优化部分</small>
            <output>{(1 - fraction) * 1000} ms</output>
          </div>
          <div>
            <small>可优化部分的新耗时</small>
            <output>{((fraction / speed) * 1000).toFixed(0)} ms</output>
          </div>
          <div>
            <small>局部无限加速的整体上限</small>
            <output>
              {fraction === 1 ? '无此固定部分限制' : `${(1 / (1 - fraction)).toFixed(2)}×`}
            </output>
          </div>
        </div>
        <Feedback>
          模型按 Amdahl 定律计算：(1 − p) + p /
          s。优化一个只占很小比例的函数，无法把整个程序加速到同样倍数。实际收益仍需同条件复测。
        </Feedback>
      </>
    );
  } else if (s === 'configuration-secrets') {
    title = '把配置放进正确的可见范围';
    const names = ['数据库密码', '公开 API 地址', '日志等级'];
    body = (
      <>
        <div className="secret-items">
          {names.map((name, i) => (
            <div key={name}>
              <Shield size={20} />
              <strong>{name}</strong>
              <Choice
                label={`${name} 放置位置`}
                value={placements[i]}
                options={[
                  ['repo', '版本库'],
                  ['public', '浏览器产物'],
                  ['runtime', '服务端运行时'],
                ]}
                onChange={(v) => {
                  setPlacements((xs) => xs.map((x, j) => (j === i ? v : x)));
                  setResult(null);
                }}
              />
            </div>
          ))}
        </div>
        <div className="quality-observation">
          <div>
            <small>浏览器用户能直接取得的值</small>
            <output>{placements.filter((place) => place === 'public').length} 项</output>
          </div>
          <div>
            <small>密码可见范围</small>
            <output className={placements[0] !== 'runtime' ? 'warning' : ''}>
              {placements[0] === 'runtime'
                ? '仅服务端运行时'
                : placements[0] === 'repo'
                  ? '提交历史 / 仓库读者'
                  : '所有产物用户'}
            </output>
          </div>
        </div>
        <button
          className="primary"
          onClick={() => {
            setResult(placements[0] === 'runtime' ? '密码未进入公共产物' : '敏感值暴露风险');
            setNote(
              placements[0] === 'runtime'
                ? '服务端运行时按最小权限获取密钥；还需避免输出日志、提交历史和错误响应泄露。'
                : '版本库历史或浏览器产物中都不能保住秘密。前端构建时注入的环境变量也会随产物交给用户。',
            );
          }}
        >
          <Check size={16} />
          检查可见范围
        </button>
        {result && <div className="operation-result">{result}</div>}
      </>
    );
  } else if (s === 'deployment-rollback') {
    title = '让真实指标决定是否扩大灰度';
    const errorRate = (100 - value) * 0.01 + value * 0.12;
    body = (
      <>
        <label>
          新版本流量占比 {value}%
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
        <div className="rollout-split">
          <div>
            <Server size={24} />
            <b>旧版本</b>
            <span>{100 - value}%</span>
          </div>
          <div>
            <Server size={24} />
            <b>新版本</b>
            <span>{value}%</span>
          </div>
        </div>
        <div className="rollout-traffic" aria-label={`旧版本 ${100 - value}%，新版本 ${value}%`}>
          <i style={{ width: `${100 - value}%` }} />
          <i style={{ width: `${value}%` }} />
        </div>
        <div className="bench-stat">
          <small>固定样本率：旧版错误率 1%，新版 12%；加权错误率</small>
          <strong>{errorRate.toFixed(1)}%</strong>
        </div>
        <label>
          <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />
          新版本已写入旧版无法读取的数据格式
        </label>
        <div className="bench-actions">
          <button
            className="primary"
            onClick={() => {
              if (flag)
                return setNote(
                  '仅切回旧程序不安全：数据格式不兼容。需要前向修复、兼容层或明确的数据恢复方案。',
                );
              setValue(0);
              setNote('流量切回旧版本，错误率回到示例基线；继续验证系统恢复并保留现场。');
            }}
          >
            回滚流量
          </button>
        </div>
      </>
    );
  } else {
    title = '用证据组织一次故障处置';
    body = (
      <>
        <div className="incident-alert">
          <AlertTriangle size={27} />
          <div>
            <strong>发布后 5xx 从 1% 升到 18%</strong>
            <span>数据库连接池等待上升 · CPU 平稳 · 新版本占流量 40%</span>
          </div>
        </div>
        <div className="incident-actions">
          {[
            ['logs', '检查错误样本'],
            ['pool', '检查连接池'],
            ['rollback', '切回兼容旧版本'],
            ['restart', '无差别重启'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setActions([...actions, id]);
                setNote(
                  (
                    {
                      logs: '错误样本显示 acquire timeout，与连接等待升高相互支持，但还需确认连接是否泄漏。',
                      pool: '活跃连接长时间不归还，等待队列增长；定位新版本异常路径缺少释放。',
                      rollback:
                        '在版本与数据兼容的前提下回滚止损；观察错误率与等待队列是否恢复，不因按钮执行成功就宣布恢复。',
                      restart:
                        '可能暂时释放资源，但会丢失部分现场，且新请求仍可能重新触发泄漏；当前证据不支持把它当根因修复。',
                    } as Record<string, string>
                  )[id],
                );
              }}
            >
              <Activity size={18} />
              {label}
            </button>
          ))}
        </div>
        <Meter
          label="已取得的不同证据"
          value={new Set(actions.filter((id) => id === 'logs' || id === 'pool')).size}
          max={2}
        />
        <div className="bench-tokens">
          {actions.slice(-8).map((id, i) => (
            <span className="bench-token" key={i}>
              {
                (
                  { logs: '样本', pool: '连接池', rollback: '止损', restart: '重启' } as Record<
                    string,
                    string
                  >
                )[id]
              }
            </span>
          ))}
        </div>
        <div className="quality-lattice" aria-label="已取得的证据与仍未证实的结论">
          <div className={actions.includes('logs') ? 'active' : ''}>
            <small>错误样本</small>
            <output>{actions.includes('logs') ? 'acquire timeout' : '尚未检查'}</output>
          </div>
          <div className={actions.includes('pool') ? 'active' : ''}>
            <small>资源证据</small>
            <output>{actions.includes('pool') ? '借出与归还不配对' : '尚未检查'}</output>
          </div>
          <div>
            <small>恢复结论</small>
            <output>
              {actions.includes('rollback') ? '已止损，仍需同条件复测' : '尚未验证恢复'}
            </output>
          </div>
        </div>
      </>
    );
  }
  return (
    <Bench title={title} subtitle="固定工程场景；操作结果由可见条件决定。" onReset={reset}>
      {body}
      <Feedback>{note}</Feedback>
    </Bench>
  );
}
