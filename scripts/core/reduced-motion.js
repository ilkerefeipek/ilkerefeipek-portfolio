/**
 * reduced-motion.js
 * Utility for honoring `prefers-reduced-motion: reduce`.
 */

const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @returns {boolean} true if motion is allowed */
export function motionOk() {
  return !mql.matches;
}

/**
 * @returns {boolean} true if viewport is below desktop breakpoint (1024px)
 */
export function isMobile() {
  return window.matchMedia('(max-width: 1023px)').matches;
}

/**
 * @returns {boolean} true if pointer is coarse (touch device)
 */
export function isCoarsePointer() {
  return window.matchMedia('(pointer: coarse)').matches;
}
