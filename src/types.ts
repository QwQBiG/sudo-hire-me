export interface Lesson {
  slug: string;
  title: string;
  description: string;
  subject: string;
  order: number;
  minutes: number;
  lab:
    | 'bits'
    | 'binary-search'
    | 'process'
    | 'javascript'
    | 'sql'
    | 'ownership'
    | 'workbench'
    | 'memory'
    | 'cpu'
    | 'cache'
    | 'complexity'
    | 'sorting'
    | 'heap'
    | 'sequence'
    | 'stack-queue'
    | 'hash'
    | 'recursion'
    | 'tree'
    | 'paging'
    | 'race'
    | 'locks'
    | 'encapsulation'
    | 'transport'
    | 'tcp'
    | 'tcp-window'
    | 'replacement'
    | 'subnet'
    | 'dns'
    | 'http'
    | 'http-cache'
    | 'index'
    | 'transaction'
    | 'git'
    | 'debug'
    | 'isolation'
    | 'arithmetic'
    | 'endian'
    | 'graph-bfs'
    | 'lower-bound'
    | 'arp'
    | 'dispatch'
    | 'syscall'
    | 'fd'
    | 'scheduling'
    | 'io-mode'
    | 'bitwise'
    | 'alignment'
    | 'two-pointers'
    | 'sliding-window'
    | 'prefix-sums'
    | 'union-find'
    | 'process-state'
    | 'tlb'
    | 'io-buffer'
    | 'contribution'
    | 'identity'
    | 'cstring'
    | 'lifetime'
    | 'linked-reversal'
    | 'floyd-cycle'
    | 'quick-partition'
    | 'kmp-prefix'
    | 'knapsack-grid'
    | 'dijkstra-path'
    | 'array-decay'
    | 'move-ownership'
    | 'mutable-default'
    | 'io-readiness'
    | 'tcp-framing'
    | 'bplus-tree'
    | 'wal'
    | 'boundary-tests'
    | 'log-trace'
    | 'cas'
    | 'bounded-queue'
    | 'token-bucket'
    | 'cache-mapping'
    | 'branch-predict'
    | 'dma-transfer';
  objectives: string[];
  prerequisites: string[];
  quiz: { prompt: string; options: string[]; answer: number; explanation: string };
  sections: { title: string; markdown: string }[];
  steps: { title: string; markdown: string }[];
  languageExamples: {
    introduction: string;
    variants: { title: string; markdown: string }[];
  } | null;
  code: string;
  source: string;
}

export type LessonSummary = Omit<
  Lesson,
  'quiz' | 'sections' | 'steps' | 'languageExamples' | 'code'
>;

export interface LessonProgress {
  read: boolean;
  passed: boolean;
  attempts: number;
  bookmark: boolean;
  note: string;
}

export interface Progress {
  version: 1;
  lessons: Record<string, LessonProgress>;
  reducedMotion: boolean;
}

export interface LabProps {
  lesson: Lesson;
  reducedMotion: boolean;
}
