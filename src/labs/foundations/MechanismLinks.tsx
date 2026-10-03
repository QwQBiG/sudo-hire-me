import { useId } from 'react';
import './foundations-quality.css';

interface Props {
  nodes: (string | number)[];
  links: Record<string, string | number | null>;
  active?: (string | number | null)[];
  invalid?: (string | number)[];
  label: string;
}

export function MechanismLinks({ nodes, links, active = [], invalid = [], label }: Props) {
  const marker = useId().replace(/:/g, '');
  if (!nodes.length) return null;
  const x = (index: number) => 24 + ((index + 0.5) * 552) / nodes.length;
  return (
    <svg className="foundation-links" viewBox="0 0 600 130" role="img" aria-label={label}>
      <defs>
        <marker
          id={marker}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
        </marker>
      </defs>
      {nodes.map((node, index) => {
        const target = links[String(node)];
        const to = nodes.findIndex((item) => item === target);
        if (to < 0) return null;
        const start = x(index);
        const end = x(to);
        const d =
          to === index
            ? `M ${start - 10} 83 C ${start - 48} 16 ${start + 48} 16 ${start + 10} 83`
            : `M ${start} 83 C ${start} ${20 + Math.abs(to - index) * 2} ${end} ${20 + Math.abs(to - index) * 2} ${end} 83`;
        return (
          <path
            key={String(node)}
            className="foundation-link"
            data-active={active.includes(node)}
            data-invalid={invalid.includes(node)}
            d={d}
            markerEnd={`url(#${marker})`}
          />
        );
      })}
      {nodes.map((node, index) => (
        <g key={String(node)} className="foundation-link-node" data-active={active.includes(node)}>
          <rect x={x(index) - 17} y="87" width="34" height="30" rx="4" />
          <text x={x(index)} y="107" textAnchor="middle">
            {node}
          </text>
          {links[String(node)] === null && (
            <text className="foundation-null" x={x(index)} y="78" textAnchor="middle">
              null
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
