import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface Props {
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

interface Option {
  value: string;
  label: string;
  disabled: boolean;
}

function optionText(value: ReactNode): string {
  return Children.toArray(value)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      return isValidElement<{ children?: ReactNode }>(child)
        ? optionText(child.props.children)
        : '';
    })
    .join('');
}

export function SelectField({ value, onChange, children, disabled, className, ...props }: Props) {
  const options: Option[] = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(
        child,
      ) ||
      child.type !== 'option'
    )
      return [];
    const label = optionText(child.props.children);
    return [{ value: String(child.props.value ?? label), label, disabled: !!child.props.disabled }];
  });
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === String(value)),
  );

  const measure = () => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, 190), innerWidth - 16);
    const roomBelow = innerHeight - rect.bottom - 12;
    const roomAbove = rect.top - 12;
    const desiredHeight = Math.min(280, options.length * 35 + 10);
    const above = roomBelow < desiredHeight && roomAbove > roomBelow;
    const maxHeight = Math.max(40, Math.min(desiredHeight, above ? roomAbove : roomBelow));
    setPosition({
      top: above ? rect.top - maxHeight - 5 : rect.bottom + 5,
      left: Math.max(8, Math.min(rect.left, innerWidth - width - 8)),
      width,
      maxHeight,
    });
  };
  const show = () => {
    if (disabled) return;
    setActive(selected);
    measure();
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange({ target: { value: option.value } });
    setOpen(false);
    trigger.current?.focus();
  };
  const move = (direction: number) => {
    if (!options.length) return;
    let next = active;
    for (let count = 0; count < options.length; count++) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActive(next);
  };

  useLayoutEffect(() => {
    if (open) measure();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const leave = (event: FocusEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', leave);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', leave);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, open]);

  return (
    <span className={`select-field ${className ?? ''}`}>
      <button
        {...props}
        ref={trigger}
        type="button"
        className="select-field-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) show();
            else move(event.key === 'ArrowDown' ? 1 : -1);
          }
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            if (!open) show();
            setActive(event.key === 'Home' ? 0 : options.length - 1);
          }
          if ((event.key === 'Enter' || event.key === ' ') && open) {
            event.preventDefault();
            choose(active);
          }
        }}
      >
        <span>{options[selected]?.label ?? '请选择'}</span>
        <ChevronDown size={15} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popup}
            id={`${id}-list`}
            className="select-field-list"
            role="listbox"
            style={position}
          >
            {options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === selected}
                aria-disabled={option.disabled || undefined}
                className={index === active ? 'is-active' : ''}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {index === selected && <Check size={14} />}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
