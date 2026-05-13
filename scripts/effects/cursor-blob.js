/**
 * cursor-blob.js
 * Two combined effects:
 *  1. Cursor-following radial gradient blob (atmospheric, fixed)
 *  2. Custom cursor ring (replaces native cursor on desktop)
 *
 * Off on mobile (<1024 OR coarse pointer) AND on reduced-motion.
 */

import { motionOk, isMobile, isCoarsePointer } from '../core/reduced-motion.js';

const LERP = 0.12;     // blob follow easing — smaller = laggier
const CURSOR_LERP = 0.28; // custom cursor follow — snappier

export function mountCursorBlob() {
  if (!motionOk() || isMobile() || isCoarsePointer()) return () => {};

  const blob = document.querySelector('.cursor-blob');
  const cursor = document.querySelector('.custom-cursor');
  if (!blob || !cursor) return () => {};

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let blobX = mx, blobY = my;
  let cursorX = mx, cursorY = my;
  let active = false;

  const onMove = (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!active) {
      blob.dataset.active = 'true';
      cursor.dataset.active = 'true';
      active = true;
    }
  };

  const onLeave = () => {
    blob.dataset.active = 'false';
    cursor.dataset.active = 'false';
    active = false;
  };

  const onOver = (e) => {
    const t = e.target;
    const isInteractive = t instanceof Element && t.closest('a, button, [role="button"], input, textarea, select');
    cursor.dataset.hover = isInteractive ? 'true' : 'false';
  };

  let raf;
  const tick = () => {
    blobX += (mx - blobX) * LERP;
    blobY += (my - blobY) * LERP;
    cursorX += (mx - cursorX) * CURSOR_LERP;
    cursorY += (my - cursorY) * CURSOR_LERP;
    blob.style.transform = `translate(${blobX - 300}px, ${blobY - 300}px)`;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    raf = requestAnimationFrame(tick);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseover', onOver);
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mouseover', onOver);
  };
}
