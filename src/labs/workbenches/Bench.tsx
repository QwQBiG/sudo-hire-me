import { RotateCcw, Activity, Check, CircleAlert } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './workbenches.css';

export function Bench({
  title,
  children,
  onReset,
  subtitle,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onReset: () => void;
  subtitle: string;
  className?: string;
}) {
  return (
    <section className={`bench ${className}`} aria-label={title}>
      <header className="bench-heading">
        <div>
          <span className="bench-kicker">
            <Activity size={14} /> 实验现场
          </span>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button className="icon-button" onClick={onReset} title="重置实验" aria-label="重置实验">
          <RotateCcw size={18} />
        </button>
      </header>
      {children}
    </section>
  );
}

export function Feedback({ children, good = true }: { children: ReactNode; good?: boolean }) {
  return (
    <div className={`bench-feedback ${good ? 'good' : 'warn'}`} role="status">
      {good ? <Check size={18} /> : <CircleAlert size={18} />}
      <div>{children}</div>
    </div>
  );
}

export function Meter({
  label,
  value,
  max,
  suffix = '',
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="bench-meter">
      <span>
        {label}
        <b>
          {value}
          {suffix}
        </b>
      </span>
      <div>
        <i style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

export function Choice({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
  label: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = group.current;
    if (!element) return;
    const measure = () => {
      const selected = element.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (selected)
        setIndicator({
          left: selected.offsetLeft,
          top: selected.offsetTop,
          width: selected.offsetWidth,
          height: selected.offsetHeight,
        });
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => resize.disconnect();
  }, [value]);
  return (
    <div className="bench-switch" role="group" aria-label={label} ref={group}>
      <span className="bench-switch-indicator" aria-hidden="true" style={indicator} />
      {options.map(([id, name]) => (
        <button key={id} aria-pressed={value === id} onClick={() => onChange(id)}>
          {name}
        </button>
      ))}
    </div>
  );
}
