/**
 * arch-diagram.js
 * Interactive 4-layer SVG architecture diagram in hero.
 * Hover layer dims others; click navigates to target page (with View Transitions if available).
 */

export function mountArchDiagram() {
  const svg = document.querySelector('[data-arch-diagram]');
  if (!svg) return () => {};

  const layers = svg.querySelectorAll('.layer');

  const onEnter = () => svg.dataset.hovered = 'true';
  const onLeave = () => svg.dataset.hovered = 'false';

  const handlers = [];
  layers.forEach((layer) => {
    const onLayerEnter = () => onEnter();
    const onLayerLeave = () => onLeave();
    const onClick = () => {
      const target = layer.dataset.target;
      if (!target) return;
      if (document.startViewTransition) {
        document.startViewTransition(() => { window.location.href = target; });
      } else {
        window.location.href = target;
      }
    };
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };

    layer.setAttribute('role', 'link');
    layer.setAttribute('tabindex', '0');
    layer.setAttribute('aria-label', layer.dataset.layer);
    layer.addEventListener('mouseenter', onLayerEnter);
    layer.addEventListener('mouseleave', onLayerLeave);
    layer.addEventListener('focus', onLayerEnter);
    layer.addEventListener('blur', onLayerLeave);
    layer.addEventListener('click', onClick);
    layer.addEventListener('keydown', onKey);

    handlers.push({ layer, onLayerEnter, onLayerLeave, onClick, onKey });
  });

  return () => {
    handlers.forEach(({ layer, onLayerEnter, onLayerLeave, onClick, onKey }) => {
      layer.removeEventListener('mouseenter', onLayerEnter);
      layer.removeEventListener('mouseleave', onLayerLeave);
      layer.removeEventListener('focus', onLayerEnter);
      layer.removeEventListener('blur', onLayerLeave);
      layer.removeEventListener('click', onClick);
      layer.removeEventListener('keydown', onKey);
    });
  };
}
