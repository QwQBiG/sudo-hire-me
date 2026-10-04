import { lazy, Suspense, type ComponentType } from 'react';
import type { LabProps } from '../../types';
import { workbenchFor, workbenchGroups } from '../../domain/workbench-catalog.mjs';
import './objects.css';
import './diagrams.css';
import './practice.css';
import './scenes.css';

const components: Record<keyof typeof workbenchGroups, ComponentType<LabProps>> = {
  'algorithm-practice': lazy(() => import('../expansion/Algorithms')),
  'c-mechanics': lazy(() => import('../expansion/CMechanics')),
  'cpp-mechanics': lazy(() => import('../expansion/CppMechanics')),
  'vector-storage': lazy(() => import('../expansion/VectorStorage')),
  'runtime-mechanics': lazy(() => import('../expansion/Runtime')),
  'counter-schedule': lazy(() => import('../expansion/CounterSchedule')),
  'rust-sharing': lazy(() => import('../expansion/RustSharing')),
  'zig-memory': lazy(() => import('../expansion/ZigMemory')),
  'unix-basics': lazy(() => import('../expansion/Unix')),
  'security-basics': lazy(() => import('../expansion/Security')),
  'sql-parameters': lazy(() => import('../expansion/SqlParameters')),
  account: lazy(() => import('./Account')),
  objects: lazy(() => import('./Objects')),
  lifetime: lazy(() => import('./Lifetime')),
  errors: lazy(() => import('./Errors')),
  'queue-contract': lazy(() => import('../oop/QueueContract')),
  'shape-contract': lazy(() => import('../oop/ShapeContract')),
  'java-roles': lazy(() => import('../oop/JavaRoles')),
  contracts: lazy(() => import('./Contracts')),
  representation: lazy(() => import('./Representation')),
  hardware: lazy(() => import('./Hardware')),
  structures: lazy(() => import('./Structures')),
  traversal: lazy(() => import('./Traversal')),
  sequences: lazy(() => import('./Sequences')),
  dp: lazy(() => import('./DynamicProgramming')),
  greedy: lazy(() => import('./Greedy')),
  kernel: lazy(() => import('./Kernel')),
  network: lazy(() => import('./Network')),
  database: lazy(() => import('./Database')),
  concurrency: lazy(() => import('./Concurrency')),
  delivery: lazy(() => import('./Delivery')),
  queues: lazy(() => import('./Queues')),
  resilience: lazy(() => import('./Resilience')),
  build: lazy(() => import('./Build')),
  git: lazy(() => import('./GitWorkbench')),
  operations: lazy(() => import('./Operations')),
  interview: lazy(() => import('./Interview')),
  dispatch: lazy(() => import('../foundations/Dispatch')),
};

export default function Workbench(props: LabProps) {
  const slug = props.lesson.slug;
  const group = workbenchFor(slug);
  const Component = group && components[group];
  if (!Component) throw new Error(`Missing interactive workbench: ${slug}`);
  return (
    <Suspense
      fallback={
        <div className="lab-loading" role="status">
          实验加载中…
        </div>
      }
    >
      <Component key={slug} {...props} />
    </Suspense>
  );
}
