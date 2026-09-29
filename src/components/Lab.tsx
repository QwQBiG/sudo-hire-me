import { lazy, Suspense } from 'react';
import type { LabProps, Lesson } from '../types';

const Bits = lazy(() => import('../labs/Bits'));
const BinarySearch = lazy(() => import('../labs/BinarySearch'));
const Process = lazy(() => import('../labs/Process'));
const CodeLab = lazy(() => import('../labs/CodeLab'));
const Ownership = lazy(() => import('../labs/Ownership'));
const Walkthrough = lazy(() => import('../labs/Walkthrough'));
const registry = {
  bits: Bits,
  'binary-search': BinarySearch,
  process: Process,
  javascript: CodeLab,
  sql: CodeLab,
  ownership: Ownership,
  walkthrough: Walkthrough,
  memory: lazy(() => import('../labs/foundations/Memory')),
  cpu: lazy(() => import('../labs/foundations/Cpu')),
  cache: lazy(() => import('../labs/foundations/Cache')),
  complexity: lazy(() => import('../labs/foundations/Complexity')),
  sorting: lazy(() => import('../labs/foundations/Sorting')),
  heap: lazy(() => import('../labs/foundations/Heap')),
  sequence: lazy(() => import('../labs/foundations/Sequence')),
  'stack-queue': lazy(() => import('../labs/foundations/StackQueue')),
  hash: lazy(() => import('../labs/foundations/Hash')),
  recursion: lazy(() => import('../labs/foundations/Recursion')),
  tree: lazy(() => import('../labs/foundations/Tree')),
  paging: lazy(() => import('../labs/systems/Paging')),
  race: lazy(() => import('../labs/systems/Race')),
  locks: lazy(() => import('../labs/systems/Locks')),
  encapsulation: lazy(() => import('../labs/systems/Encapsulation')),
  transport: lazy(() => import('../labs/systems/Transport')),
  tcp: lazy(() => import('../labs/systems/Tcp')),
  'tcp-window': lazy(() => import('../labs/systems/Window')),
  replacement: lazy(() => import('../labs/systems/Replacement')),
  subnet: lazy(() => import('../labs/systems/Subnet')),
  dns: lazy(() => import('../labs/systems/Dns')),
  http: lazy(() => import('../labs/systems/Http')),
  'http-cache': lazy(() => import('../labs/systems/HttpCache')),
  index: lazy(() => import('../labs/practice/IndexLab')),
  transaction: lazy(() => import('../labs/practice/TransactionLab')),
  git: lazy(() => import('../labs/practice/GitLab')),
  debug: lazy(() => import('../labs/practice/DebugLab')),
  isolation: lazy(() => import('../labs/practice/IsolationLab')),
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
