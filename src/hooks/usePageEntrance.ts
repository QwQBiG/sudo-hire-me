import { useEffect, type RefObject } from 'react';

const entrances = [
  '.home-heading',
  '.home-stats > div',
  '.home-continue',
  '.binary-warmup',
  '.home-section-title',
  '.starter-links > a',
  '.topic-entry',
  '.revisit-links > a',
  '.overview > h1',
  '.journey-stats > div',
  '.catalog-toolbar',
  '.course-card',
  '.lesson-title',
  '.interview-answer',
  '.feedback',
].join(',');

export function usePageEntrance(
  root: RefObject<HTMLDivElement | null>,
  route: string,
  reduced: boolean,
) {
  useEffect(() => {
    const surface = root.current;
    if (!surface || reduced || !('IntersectionObserver' in window)) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const running = new Set<Animation>();
    const stop = () => {
      for (const animation of running) animation.cancel();
      running.clear();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (preference.matches || !entry.target.isConnected) continue;
          const animation = entry.target.animate(
            [
              { opacity: 0.25, transform: 'translateY(14px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: 460,
              delay: (order++ % 4) * 35,
              easing: 'cubic-bezier(.2,.75,.25,1)',
              fill: 'backwards',
            },
          );
          running.add(animation);
          animation.onfinish = animation.oncancel = () => running.delete(animation);
        }
      },
      { threshold: 0.08 },
    );
    const register = (element: Element) => {
      const candidates = [...element.querySelectorAll(entrances)];
      if (element.matches(entrances)) candidates.unshift(element);
      for (const candidate of candidates) {
        if (seen.has(candidate)) continue;
        seen.add(candidate);
        observer.observe(candidate);
      }
    };
    register(surface);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && surface.contains(node)) register(node);
        }
      }
    });
    mutations.observe(surface, { childList: true, subtree: true });
    const preferenceChanged = () => {
      if (preference.matches) stop();
    };
    preference.addEventListener('change', preferenceChanged);
    return () => {
      mutations.disconnect();
      observer.disconnect();
      preference.removeEventListener('change', preferenceChanged);
      stop();
    };
  }, [root, route, reduced]);
}
