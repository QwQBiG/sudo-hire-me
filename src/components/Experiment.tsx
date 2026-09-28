import { useId, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onReset?: () => void;
  className?: string;
}

export function Experiment({ title, subtitle, children, onReset, className = '' }: Props) {
  const id = useId();
  return (
    <section className={`experiment ${className}`} aria-labelledby={id}>
      <header className="experiment-heading">
        <div>
          <span className="eyebrow">INTERACTIVE LAB</span>
          <h3 id={id}>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {onReset && (
          <button className="icon-button" onClick={onReset} aria-label="重置实验" title="重置实验">
            <RotateCcw size={18} />
          </button>
        )}
      </header>
      <div className="experiment-body">{children}</div>
    </section>
  );
}
