/**
 * nav.js
 * Sticky nav scroll shrink + mobile drawer (focus trap, Esc close).
 */

export function initNav() {
  const navBar = document.querySelector('.nav-bar');
  if (!navBar) return;

  const drawer = document.querySelector('[data-nav-drawer]');
  const openBtn = document.querySelector('[data-nav-open]');
  const closeBtn = document.querySelector('[data-nav-close]');

  // Track actual nav-bar height in a CSS custom property so sticky descendants
  // (e.g. .cv-controls) can offset correctly. Without this, the scrolled state
  // shrinks the nav-bar but cv-controls top stays at the original --nav-height,
  // leaving a visible hoverable gap between nav bottom and controls top.
  const updateNavHeight = () => {
    const h = Math.round(navBar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-height-current', `${h}px`);
  };

  // Prefer ResizeObserver — fires exactly when nav-bar's box changes (catches
  // CSS transition settle, orientation change, font load shift). Avoids
  // resize-event thrash and ad-hoc setTimeout polling.
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(updateNavHeight);
    ro.observe(navBar);
  } else {
    // Fallback: debounced resize listener (one rAF coalesce)
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(updateNavHeight);
    }, { passive: true });
  }

  // Scroll shrink (subtle padding compression after 80px)
  let scrolled = false;
  const onScroll = () => {
    const isScrolled = window.scrollY > 80;
    if (isScrolled !== scrolled) {
      scrolled = isScrolled;
      navBar.classList.toggle('scrolled', isScrolled);
      // ResizeObserver (above) catches the transition-settled height
      // automatically — no setTimeout polling needed.
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  updateNavHeight();
  onScroll();

  // Mobile drawer
  if (!drawer || !openBtn) return;

  let lastFocus = null;

  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.dataset.open = 'true';
    drawer.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    // Move focus into drawer
    const firstLink = drawer.querySelector('a, button');
    firstLink?.focus();
    document.addEventListener('keydown', onDrawerKeydown);
  };

  const closeDrawer = () => {
    drawer.dataset.open = 'false';
    drawer.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onDrawerKeydown);
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  const onDrawerKeydown = (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (e.key !== 'Tab') return;

    // Focus trap
    const focusables = drawer.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  openBtn.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);

  // Close drawer when clicking a nav link inside
  drawer.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeDrawer);
  });
}
