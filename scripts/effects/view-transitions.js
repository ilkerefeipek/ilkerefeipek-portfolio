/**
 * view-transitions.js
 * Intercept same-origin link clicks → wrap navigation in document.startViewTransition.
 * Fallback: native navigation (no-op intercept).
 * Skipped on reduced-motion (browser will still no-op transition CSS but we avoid the intercept).
 */

import { motionOk } from '../core/reduced-motion.js';

export function mountViewTransitions() {
  if (!('startViewTransition' in document) || !motionOk()) return () => {};

  const onClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }

    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (link.hasAttribute('data-no-transition')) return;

    e.preventDefault();
    document.startViewTransition(() => {
      window.location.href = url.href;
    });
  };

  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
