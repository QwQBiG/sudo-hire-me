import { ArrowRight, BookOpen, Check } from 'lucide-react';
import type { DocumentSummary, Progress } from '../types';

export function Catalog({
  documents,
  progress,
  query,
}: {
  documents: DocumentSummary[];
  progress: Progress;
  query: string;
}) {
  const groups = [...new Set(documents.map((document) => document.subject))];
  return (
    <div className="catalog">
      <header className="catalog-heading">
        <span className="eyebrow">INTERVIEW / FOUNDATIONS</span>
        <h1>
          面试基础文档<span>_</span>
        </h1>
        <p>
          {query
            ? `“${query}” · ${documents.length} 篇结果`
            : `${documents.length} 篇课程 · 从基础概念到面试表达`}
        </p>
      </header>
      {!documents.length && <p className="empty">没有找到相关课程</p>}
      {groups.map((subject) => (
        <section className="catalog-group" key={subject}>
          <header>
            <BookOpen size={17} />
            <h2>{subject}</h2>
            <span>{documents.filter((document) => document.subject === subject).length} 篇</span>
          </header>
          <div className="catalog-list">
            {documents
              .filter((document) => document.subject === subject)
              .map((document) => (
                <a href={`#/lesson/${document.slug}`} key={document.slug}>
                  <span className="course-order">
                    {progress.lessons[document.slug]?.read ? (
                      <Check size={16} />
                    ) : (
                      String(document.order + 1).padStart(2, '0')
                    )}
                  </span>
                  <div>
                    <h3>{document.title}</h3>
                    <p>{document.description}</p>
                  </div>
                  <small>{document.minutes} 分钟</small>
                  <ArrowRight size={16} />
                </a>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
