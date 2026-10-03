import { lazy, Suspense } from 'react';
import type { LabProps, Lesson } from '../types';
import { useLabMotion } from './useLabMotion';
import { workbenchFor } from '../domain/workbench-catalog.mjs';
import '../styles/lab-polish.css';
import '../labs/foundations/foundations-quality.css';

const Bits = lazy(() => import('../labs/Bits'));
const BinarySearch = lazy(() => import('../labs/BinarySearch'));
const Process = lazy(() => import('../labs/Process'));
const CodeLab = lazy(() => import('../labs/CodeLab'));
const Ownership = lazy(() => import('../labs/Ownership'));
const Workbench = lazy(() => import('../labs/workbenches/Workbench'));
const registry = {
  bits: Bits,
  'binary-search': BinarySearch,
  process: Process,
  javascript: CodeLab,
  sql: CodeLab,
  ownership: Ownership,
  workbench: Workbench,
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
  arithmetic: lazy(() => import('../labs/foundations/Arithmetic')),
  endian: lazy(() => import('../labs/foundations/Endian')),
  'graph-bfs': lazy(() => import('../labs/foundations/GraphBfs')),
  'lower-bound': lazy(() => import('../labs/foundations/LowerBound')),
  arp: lazy(() => import('../labs/systems/Arp')),
  dispatch: lazy(() => import('../labs/foundations/Dispatch')),
  syscall: lazy(() => import('../labs/systems/Syscall')),
  fd: lazy(() => import('../labs/systems/FileDescriptor')),
  scheduling: lazy(() => import('../labs/systems/Scheduling')),
  'io-mode': lazy(() => import('../labs/systems/IoMode')),
  bitwise: lazy(() => import('../labs/foundations/Bitwise')),
  alignment: lazy(() => import('../labs/foundations/Alignment')),
  'two-pointers': lazy(() => import('../labs/foundations/TwoPointers')),
  'sliding-window': lazy(() => import('../labs/foundations/SlidingWindow')),
  'prefix-sums': lazy(() => import('../labs/foundations/PrefixSums')),
  'union-find': lazy(() => import('../labs/foundations/UnionFind')),
  'process-state': lazy(() => import('../labs/systems/ProcessState')),
  tlb: lazy(() => import('../labs/systems/Tlb')),
  'io-buffer': lazy(() => import('../labs/systems/IoBuffer')),
  contribution: lazy(() => import('../labs/practice/ContributionLab')),
  identity: lazy(() => import('../labs/foundations/Identity')),
  cstring: lazy(() => import('../labs/foundations/CString')),
  lifetime: lazy(() => import('../labs/foundations/Lifetime')),
  'linked-reversal': lazy(() => import('../labs/foundations/LinkedReversal')),
  'floyd-cycle': lazy(() => import('../labs/foundations/FloydCycle')),
  'quick-partition': lazy(() => import('../labs/foundations/QuickPartition')),
  'kmp-prefix': lazy(() => import('../labs/foundations/KmpPrefix')),
  'knapsack-grid': lazy(() => import('../labs/foundations/KnapsackGrid')),
  'dijkstra-path': lazy(() => import('../labs/foundations/DijkstraPath')),
  'array-decay': lazy(() => import('../labs/foundations/ArrayDecay')),
  'move-ownership': lazy(() => import('../labs/foundations/MoveOwnership')),
  'mutable-default': lazy(() => import('../labs/foundations/MutableDefault')),
  'io-readiness': lazy(() => import('../labs/systems/IoReadiness')),
  'tcp-framing': lazy(() => import('../labs/systems/TcpFraming')),
  'bplus-tree': lazy(() => import('../labs/systems/BplusTree')),
  wal: lazy(() => import('../labs/systems/Wal')),
  'boundary-tests': lazy(() => import('../labs/practice/BoundaryTests')),
  'log-trace': lazy(() => import('../labs/practice/LogTrace')),
  cas: lazy(() => import('../labs/systems/Cas')),
  'bounded-queue': lazy(() => import('../labs/systems/BoundedQueue')),
  'token-bucket': lazy(() => import('../labs/systems/TokenBucket')),
  'cache-mapping': lazy(() => import('../labs/foundations/CacheMapping')),
  'branch-predict': lazy(() => import('../labs/foundations/BranchPredict')),
  'dma-transfer': lazy(() => import('../labs/foundations/DmaTransfer')),
} satisfies Record<Lesson['lab'], React.ComponentType<LabProps>>;

export function Lab(props: LabProps) {
  const root = useLabMotion(props.lesson.slug);
  const Component = registry[props.lesson.lab];
  return (
    <div
      className="lab-surface"
      ref={root}
      data-lab-family={workbenchFor(props.lesson.slug) ?? props.lesson.lab}
    >
      <Suspense
        fallback={
          <div className="lab-loading" role="status">
            实验加载中…
          </div>
        }
      >
        <Component {...props} />
      </Suspense>
    </div>
  );
}
