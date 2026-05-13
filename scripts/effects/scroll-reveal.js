/**
 * scroll-reveal.js
 * IntersectionObserver-based reveal for [data-reveal] and [data-reveal-stagger].
 */

export function mountScrollReveal() {
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  if (!targets.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.dataset.revealed = 'true';
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => io.observe(el));

  return () => io.disconnect();
}
