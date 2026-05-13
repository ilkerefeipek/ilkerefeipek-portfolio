/**
 * name-decode.js
 * Character scramble → reveal effect for hero h1.
 * Reduced-motion: instant final text.
 */

import { motionOk } from '../core/reduced-motion.js';

const SCRAMBLE_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}<>/=*+@#$';
const TICK_MS = 60;
const STAGGER_MS = 60;

/**
 * @param {HTMLElement | null} el
 * @returns {Promise<void>}
 */
export function decodeName(el) {
  if (!el) return Promise.resolve();
  const target = el.dataset.nameDecode || el.textContent.trim();
  if (!target) return Promise.resolve();

  if (!motionOk()) {
    el.textContent = target;
    return Promise.resolve();
  }

  // Schedule from end → start: last char locks first.
  const chars = Array.from(target);
  const lockedAt = chars.map((_, i) => (chars.length - 1 - i) * STAGGER_MS);
  const totalDuration = lockedAt[0] + 200;

  return new Promise((resolve) => {
    const startTime = performance.now();
    const render = (now) => {
      const elapsed = now - startTime;
      const out = chars.map((c, i) => {
        if (c === ' ') return ' ';
        const lockTime = lockedAt[i];
        if (elapsed >= lockTime) return c;
        return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
      });
      el.textContent = out.join('');

      if (elapsed < totalDuration) {
        requestAnimationFrame(render);
      } else {
        el.textContent = target;
        // glow flash
        el.classList.add('glowed');
        setTimeout(() => el.classList.remove('glowed'), 600);
        resolve();
      }
    };
    requestAnimationFrame(render);
  });
}
