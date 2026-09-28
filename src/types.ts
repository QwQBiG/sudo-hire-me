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
    | 'walkthrough'
    | 'memory'
    | 'cpu'
    | 'cache'
    | 'complexity'
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
    | 'dns'
    | 'http'
    | 'http-cache'
    | 'index'
    | 'transaction'
    | 'git'
    | 'debug'
    | 'isolation';
  objectives: string[];
  prerequisites: string[];
  quiz: { prompt: string; options: string[]; answer: number; explanation: string };
  sections: { title: string; markdown: string }[];
  steps: { title: string; markdown: string }[];
  code: string;
  source: string;
}

export type LessonSummary = Omit<Lesson, 'quiz' | 'sections' | 'steps' | 'code'>;

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
