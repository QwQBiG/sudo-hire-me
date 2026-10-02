import { ArrowLeftRight, ArrowRight, CircleCheck, Package, ShieldX } from 'lucide-react';
import './signals.css';

export type Signal = { id: number; label: string; kind: 'send' | 'reply' | 'blocked' | 'cached' };

export function SignalRoute({
  signal,
  nodes,
}: {
  signal: Signal | null;
  nodes: readonly string[];
}) {
  return (
    <div className={`signal-route ${signal?.kind ?? 'idle'}`}>
      <div
        className="signal-nodes"
        style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0,1fr))` }}
      >
        {nodes.map((name, i) => (
          <div key={`${i}-${name}`}>
            <small>{String(i + 1).padStart(2, '0')}</small>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="signal-rail" aria-hidden="true">
        <i />
        <i />
        <i />
        {signal && (
          <span className="signal-packet" key={signal.id}>
            <Package size={14} />
          </span>
        )}
      </div>
      <div className="signal-receipt" role="status" key={signal?.id ?? 0}>
        {signal?.kind === 'blocked' ? (
          <ShieldX size={15} />
        ) : signal?.kind === 'reply' ? (
          <ArrowLeftRight size={15} />
        ) : signal ? (
          <CircleCheck size={15} />
        ) : (
          <ArrowRight size={15} />
        )}
        <code>{signal?.label ?? '等待请求'}</code>
      </div>
    </div>
  );
}
