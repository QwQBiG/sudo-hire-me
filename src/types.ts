export interface DocumentSummary {
  slug: string;
  title: string;
  description: string;
  subject: string;
  order: number;
  minutes: number;
  prerequisites: string[];
  headings: { id: string; title: string; depth: number }[];
}
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
