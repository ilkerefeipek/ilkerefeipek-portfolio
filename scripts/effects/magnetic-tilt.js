/**
 * magnetic-tilt.js
 * Project cards 3D tilt + glow trail on mousemove.
 * Disabled on reduced-motion + touch devices.
 */

import { motionOk, isCoarsePointer } from '../core/reduced-motion.js';

const MAX_TILT = 8; // degrees

export function mountMagneticTilt(selector = '.tilt') {
  if (!motionOk() || isCoarsePointer()) return () => {};

  const els = document.querySelectorAll(selector);
  if (!els.length) return () => {};

  const handlers = [];

  els.forEach((el) => {
    let raf = 0;
    let cx = 0, cy = 0; // current tilt
    let tx = 0, ty = 0; // target tilt
    let mx = 50, my = 50; // glow position %

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tx = (py - 0.5) * -2 * MAX_TILT;
      ty = (px - 0.5) * 2 * MAX_TILT;
      mx = px * 100;
      my = py * 100;
      el.style.setProperty('--mx', `${mx}%`);
      el.style.setProperty('--my', `${my}%`);
      if (!raf) raf = requestAnimationFrame(animate);
    };

    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(animate);
    };

    const animate = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `perspective(800px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) translateY(-4px) scale(1.02)`;
      if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05 && tx === 0 && ty === 0) {
        el.style.transform = '';
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    handlers.push({ el, onMove, onLeave });
  });

  return () => {
    handlers.forEach(({ el, onMove, onLeave }) => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.style.transform = '';
    });
  };
}
