import { lazy, Suspense } from 'react';
import type { LabProps, Lesson } from '../types';

const Bits = lazy(() => import('../labs/Bits'));
const BinarySearch = lazy(() => import('../labs/BinarySearch'));
const Process = lazy(() => import('../labs/Process'));
const CodeLab = lazy(() => import('../labs/CodeLab'));
const Ownership = lazy(() => import('../labs/Ownership'));
const registry = {
  bits: Bits,
  'binary-search': BinarySearch,
  process: Process,
  javascript: CodeLab,
  sql: CodeLab,
  ownership: Ownership,
} satisfies Record<Lesson['lab'], React.ComponentType<LabProps>>;

export function Lab(props: LabProps) {
  const Component = registry[props.lesson.lab];
  return (
    <Suspense
      fallback={
        <div className="lab-loading" role="status">
          实验加载中…
        </div>
      }
    >
      <Component {...props} />
    </Suspense>
  );
}
