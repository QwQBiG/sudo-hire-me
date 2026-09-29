import { useState } from 'react';
import { Markdown } from './Markdown';
import type { Lesson } from '../types';

const preferenceKey = 'sudo-hire-me:code-language';

export function LanguageExamples({
  examples,
}: {
  examples: NonNullable<Lesson['languageExamples']>;
}) {
  const [preferred, setPreferred] = useState(() => {
    try {
      return localStorage.getItem(preferenceKey) ?? 'C';
    } catch {
      return 'C';
    }
  });
  const active =
    examples.variants.find((variant) => variant.title === preferred) ?? examples.variants[0];

  const select = (title: string) => {
    setPreferred(title);
    try {
      localStorage.setItem(preferenceKey, title);
    } catch {
      // The in-memory selection still works when storage is unavailable.
    }
  };

  return (
    <div className="language-examples">
      {examples.introduction && <Markdown>{examples.introduction}</Markdown>}
      <div className="language-tabs" role="tablist" aria-label="代码语言">
        {examples.variants.map((variant, index) => (
          <button
            key={variant.title}
            type="button"
            role="tab"
            aria-selected={variant.title === active.title}
            aria-controls="language-example-panel"
            tabIndex={variant.title === active.title ? 0 : -1}
            onClick={() => select(variant.title)}
            onKeyDown={(event) => {
              const count = examples.variants.length;
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % count
                  : event.key === 'ArrowLeft'
                    ? (index + count - 1) % count
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? count - 1
                        : -1;
              if (next < 0) return;
              event.preventDefault();
              select(examples.variants[next].title);
              event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus();
            }}
          >
            {variant.title}
          </button>
        ))}
      </div>
      <div id="language-example-panel" role="tabpanel" aria-label={`${active.title} 示例`}>
        <Markdown>{active.markdown}</Markdown>
      </div>
    </div>
  );
}
