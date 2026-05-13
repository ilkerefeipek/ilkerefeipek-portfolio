/**
 * code-rain.js
 * Hero atmospheric canvas — falling code-like fragments.
 * Off on mobile (<768) and reduced-motion.
 */

import { motionOk } from '../core/reduced-motion.js';

const FRAGMENTS = [
  'public', 'async', 'await', 'SELECT', 'FROM', '=>', 'IRepository<T>',
  'DbContext', 'var', 'using', 'namespace', 'interface', 'JOIN',
  'WHERE', 'INSERT INTO', 'void', 'Task<T>', '[HttpGet]', 'ICollection',
  'IQueryable', 'ToList()', 'GROUP BY', 'EXEC', 'BEGIN TRAN', 'ROLLBACK',
];

const MAX_FRAGMENTS = 30;
const ENTRANCE_FADE_MS = 400;

class CodeRain {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fragments = [];
    this.raf = null;
    this.startedAt = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.onResize = this.onResize.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    this.onResize();
    window.addEventListener('resize', this.onResize, { passive: true });
    this.startedAt = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
  }

  onResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  spawn() {
    const text = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
    const speed = 0.3 + Math.random() * 0.7; // px/frame ~ 18..60 px/sec @ 60fps
    this.fragments.push({
      x: Math.random() * this.w,
      y: -20 - Math.random() * 200,
      text,
      speed,
      size: 11 + Math.floor(Math.random() * 3),
      alpha: 0,
    });
  }

  tick(now) {
    if (!this.ctx) return;
    const elapsed = now - this.startedAt;
    const fadeIn = Math.min(1, elapsed / ENTRANCE_FADE_MS);

    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.fillStyle = 'rgba(171, 159, 242, 0.07)';
    this.ctx.font = "var(--font-mono)";

    // Top up
    while (this.fragments.length < MAX_FRAGMENTS) {
      this.spawn();
    }

    // Update + render
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      f.y += f.speed;
      if (f.alpha < 1) f.alpha = Math.min(1, f.alpha + 0.02);

      this.ctx.font = `${f.size}px JetBrains Mono, ui-monospace, monospace`;
      this.ctx.globalAlpha = f.alpha * fadeIn;
      this.ctx.fillText(f.text, f.x, f.y);

      if (f.y > this.h + 40) {
        this.fragments.splice(i, 1);
      }
    }
    this.ctx.globalAlpha = 1;

    this.raf = requestAnimationFrame(this.tick);
  }
}

/**
 * @param {HTMLCanvasElement | null} canvas
 * @returns {() => void} cleanup function
 */
export function mountCodeRain(canvas) {
  if (!canvas) return () => {};
  if (!motionOk()) return () => {};
  if (window.matchMedia('(max-width: 767px)').matches) return () => {};

  const rain = new CodeRain(canvas);
  rain.start();
  return () => rain.stop();
}
