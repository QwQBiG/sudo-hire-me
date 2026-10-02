import { useEffect, useRef } from 'react';

const readouts =
  'output, .metric > strong, .bench-stat strong, .object-cell strong, .worker-slots strong, .server-fleet strong, .version-chain strong, .http-response strong, .bench-feedback > div, .experiment-status, [data-readout]';

export function useLabMotion(identity: string) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map<HTMLElement, Animation>();
    let actionAt = -Infinity;
    let frame = 0;
    const changed = new Set<HTMLElement>();
    const positions = new Map<string, DOMRect>();
    const reduced = () => media.matches || document.documentElement.dataset.motion === 'reduced';
    const markAction = () => {
      actionAt = performance.now();
      // Measure tokens before React moves them to a different queue or slot.
      positions.clear();
      element.querySelectorAll<HTMLElement>('[data-token-id]').forEach((token) => {
        if (token.dataset.tokenId)
          positions.set(token.dataset.tokenId, token.getBoundingClientRect());
      });
    };
    const stop = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const flush = () => {
      frame = 0;
      if (!reduced()) {
        element.querySelectorAll<HTMLElement>('[data-token-id]').forEach((token) => {
          const before = positions.get(token.dataset.tokenId ?? '');
          if (!before) return;
          animations.get(token)?.cancel();
          animations.delete(token);
          const after = token.getBoundingClientRect();
          const x = before.x - after.x;
          const y = before.y - after.y;
          if (Math.abs(x) + Math.abs(y) < 2) return;
          changed.delete(token);
          const animation = token.animate(
            [
              { translate: `${x}px ${y}px`, opacity: 0.65 },
              { translate: '0 0', opacity: 1 },
            ],
            { duration: 520, easing: 'cubic-bezier(.22,.8,.2,1)' },
          );
          animations.set(token, animation);
          animation.onfinish = () => {
            if (animations.get(token) === animation) animations.delete(token);
          };
        });
        [...changed].slice(0, 12).forEach((target) => {
          if (!target.isConnected || typeof target.animate !== 'function') return;
          animations.get(target)?.cancel();
          const feedback = target.matches('.bench-feedback > div, .experiment-status');
          const animation = target.animate(
            feedback
              ? [
                  { opacity: 0.35, translate: '0 5px' },
                  { opacity: 1, translate: '0 0' },
                ]
              : [
                  { opacity: 0.45, scale: '.94' },
                  { opacity: 1, scale: '1.035', offset: 0.6 },
                  { scale: '1' },
                ],
            { duration: feedback ? 260 : 420, easing: 'cubic-bezier(.2,.8,.2,1)' },
          );
          animations.set(target, animation);
          animation.onfinish = () => {
            if (animations.get(target) === animation) animations.delete(target);
          };
        });
      }
      changed.clear();
    };
    const observer = new MutationObserver((records) => {
      // Initial lazy loading must not look like a user-triggered operation.
      if (performance.now() - actionAt > 1000 || reduced()) return;
      for (const record of records) {
        const parent =
          record.target instanceof HTMLElement ? record.target : record.target.parentElement;
        const target = parent?.closest<HTMLElement>(readouts);
        if (target && element.contains(target)) changed.add(target);
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(readouts)) changed.add(node);
          node.querySelectorAll<HTMLElement>(readouts).forEach((child) => changed.add(child));
        }
      }
      if ((changed.size || positions.size) && !frame) frame = requestAnimationFrame(flush);
    });
    const preference = new MutationObserver(() => {
      if (reduced()) stop();
    });
    observer.observe(element, { subtree: true, childList: true, characterData: true });
    preference.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-motion'],
    });
    element.addEventListener('click', markAction, true);
    element.addEventListener('input', markAction, true);
    media.addEventListener('change', stop);
    return () => {
      observer.disconnect();
      preference.disconnect();
      element.removeEventListener('click', markAction, true);
      element.removeEventListener('input', markAction, true);
      media.removeEventListener('change', stop);
      cancelAnimationFrame(frame);
      stop();
    };
  }, [identity]);
  return root;
}
