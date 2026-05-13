/**
 * skills-bento.js — Sprint 4.8 nuclear rewrite (minimal interaction layer)
 * Replaces all prior skills-* JS modules. <a href> handles navigation
 * natively; this module adds magnetic tilt for desktop polish only.
 */

import { motionOk, isCoarsePointer } from '../core/reduced-motion.js';
import { mountMagneticTilt } from './magnetic-tilt.js';

export function mountSkillsBento() {
  const grid = document.querySelector('[data-sk-grid]');
  if (!grid) return () => {};

  // Magnetic tilt only on desktop pointer:fine + motion-ok
  // (mountMagneticTilt internally gates these, but we skip the call
  // when it's clearly inapplicable to keep the module tree-shake clean.)
  if (motionOk() && !isCoarsePointer()) {
    mountMagneticTilt('.sk-cell');
  }

  return () => {};
}
