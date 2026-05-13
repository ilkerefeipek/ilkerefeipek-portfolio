/**
 * main.js
 * Orchestrator. Detects current page (body[data-page]) and mounts:
 *  - Always: i18n, nav, reduced-motion-aware effects (cursor-blob, scroll-reveal, view-transitions)
 *  - Per page: code-rain + name-decode + arch-diagram + counter (home);
 *              magnetic-tilt + project modal + skill filter (projects);
 *              constellation (skills);
 *              contact form (contact);
 *              CV print + lang-aware download (cv).
 */

import { initI18n, applyLang, currentLanguage, onLangChange } from './core/i18n.js';
import { initNav } from './core/nav.js';
import { motionOk } from './core/reduced-motion.js';
import {
  loadContent, loadProjects, loadEducation, loadExperience,
  loadLanguages, loadCertificates,
} from './core/data-loader.js';

import { mountCodeRain } from './effects/code-rain.js';
import { decodeName } from './effects/name-decode.js';
import { mountCursorBlob } from './effects/cursor-blob.js';
import { mountArchDiagram } from './effects/arch-diagram.js';
import { mountMagneticTilt } from './effects/magnetic-tilt.js';
// Sprint 4.8: nuclear rewrite — legacy skills-constellation.js,
// skills-hex-grid.js, and Sprint 4.6 skills-bento.js all deleted.
// New minimal skills-bento.js handles only magnetic tilt; <a> tags
// own click navigation natively.
import { mountSkillsBento } from './effects/skills-bento.js';
import { mountScrollReveal } from './effects/scroll-reveal.js';
import { mountViewTransitions } from './effects/view-transitions.js';

const page = document.documentElement.dataset.page || document.body.dataset.page || 'home';

// Module-level UX timing constants (paired with --dur-long: 800ms motion token where applicable).
const COUNTER_DURATION_MS = 800;
const TOAST_DURATION_MS = 4_000;

// Bind the contact form submit handler EAGERLY (before async i18n init) so a fast
// user click doesn't bypass the JS handler and POST natively to Web3Forms.
if (page === 'contact') initContactForm();

(async function bootstrap() {
  // i18n must run first so data-i18n placeholders + tooltips reflect language
  // before effects rely on them.
  await initI18n();

  initNav();
  mountScrollReveal();
  mountCursorBlob();
  mountViewTransitions();

  if (page === 'home') initHome();
  if (page === 'about') initAbout();
  if (page === 'projects') initProjects();
  if (page === 'skills') initSkills();
  if (page === 'cv') initCv();
  if (page === 'contact') initEmailCopy(); // form already bound eagerly above
})();

/* ---------------- HOME ---------------- */

async function initHome() {
  const heroSection = document.querySelector('[data-hero-sequence]');
  const canvas = document.querySelector('canvas.code-rain');
  const heroName = document.querySelector('[data-name-decode]');

  // Mark sequence ready (CSS animations cued by data-state)
  if (heroSection) heroSection.dataset.state = 'ready';

  // Decode name
  decodeName(heroName);

  // Code-rain (no-op on mobile/reduced-motion; the module checks)
  if (canvas) mountCodeRain(canvas);

  // Arch diagram interactivity
  mountArchDiagram();

  // Counter animations
  initCounters();

  // Sprint 7: featured project re-renders title + summary on lang toggle
  let projectsCache = null;
  try {
    projectsCache = await loadProjects();
  } catch { return; }
  const stockMgmt = projectsCache.find((p) => p.id === 'stock-management');
  if (!stockMgmt) return;
  const featuredEl = document.querySelector('[data-featured-project]');
  if (!featuredEl) return;
  const titleEl = featuredEl.querySelector('h3');
  const summaryEl = featuredEl.querySelector('[data-featured-summary]');
  const render = () => {
    const lang = currentLanguage();
    if (titleEl) titleEl.textContent = lang === 'en' ? stockMgmt.titleEn : stockMgmt.titleTr;
    if (summaryEl) summaryEl.textContent = lang === 'en' ? stockMgmt.summaryEn : stockMgmt.summaryTr;
  };
  render();
  onLangChange(render);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter-target]');
  if (!counters.length) return;
  // With reduced motion, snap all counters to their final value immediately
  // (don't wait for IntersectionObserver — final state is what matters).
  if (!motionOk()) {
    counters.forEach((el) => animateCounter(el));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => io.observe(el));
}

function animateCounter(el) {
  const targetStr = el.dataset.counterTarget || '0';
  const target = parseFloat(targetStr.replace(/[^\d.]/g, '')) || 0;
  const suffix = targetStr.replace(/[\d.]/g, '');
  // Honor the original decimal precision (e.g. "1.5+" → 1, "3.32" → 2, "11" → 0)
  const decimals = (targetStr.match(/\.(\d+)/)?.[1] || '').length;
  const fmt = (v) => `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}${suffix}`;

  if (!motionOk()) {
    el.textContent = fmt(target);
    return;
  }

  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / COUNTER_DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}

/* ---------------- ABOUT ---------------- */

async function initAbout() {
  let education = [];
  let experience = [];
  let languages = [];
  try {
    [education, experience, languages] = await Promise.all([
      loadEducation(), loadExperience(), loadLanguages(),
    ]);
  } catch (e) {
    console.warn('[about] data load failed', e);
    return;
  }
  const render = () => {
    const lang = currentLanguage();
    renderEducation(education, lang);
    renderExperience(experience, lang);
    renderLanguages(languages, lang);
  };
  render();
  onLangChange(render);
}

function renderEducation(items, lang) {
  const list = document.querySelector('[data-education-list]');
  if (!list) return;
  list.innerHTML = items.map((e) => {
    const inst = lang === 'en' ? e.institutionEn : e.institutionTr;
    const deg = lang === 'en' ? e.degreeEn : e.degreeTr;
    const highlights = lang === 'en' ? e.highlightsEn : e.highlightsTr;
    const meta = lang === 'en'
      ? `${e.startYear} — ${e.isCurrent ? 'Present' : e.endYear}`
      : `${e.startYear} — ${e.isCurrent ? 'devam ediyor' : e.endYear}`;
    const gpaLine = e.gpa ? `${deg} · GPA ${e.gpa}` : deg;
    return `<article class="timeline-item">
      <p class="timeline-meta">${escapeHtml(meta)}</p>
      <h3>${escapeHtml(inst)}</h3>
      <p style="color: var(--text-secondary); margin-top: var(--sp-2);">${escapeHtml(gpaLine)}</p>
      <ul style="color: var(--text-secondary); margin-top: var(--sp-3);">
        ${(highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
      </ul>
    </article>`;
  }).join('');
}

function renderExperience(items, lang) {
  const list = document.querySelector('[data-experience-list]');
  if (!list) return;
  list.innerHTML = items.map((x) => {
    const role = lang === 'en' ? x.roleEn : x.roleTr;
    const duration = lang === 'en' ? x.durationLabelEn : x.durationLabelTr;
    const highlights = lang === 'en' ? x.highlightsEn : x.highlightsTr;
    const loc = lang === 'en' ? x.locationEn : x.locationTr;
    const heading = `${escapeHtml(x.company)} · ${escapeHtml(loc)}`;
    return `<article class="timeline-item">
      <p class="timeline-meta">${escapeHtml(duration)}</p>
      <h3>${heading}</h3>
      <p style="color: var(--text-muted); font-size: var(--fs-sm); margin-top: var(--sp-1);">${escapeHtml(role)}</p>
      <ul style="color: var(--text-secondary); margin-top: var(--sp-3);">
        ${(highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
      </ul>
    </article>`;
  }).join('');
}

function renderLanguages(items, lang) {
  const row = document.querySelector('[data-languages-list]');
  if (!row) return;
  row.innerHTML = items.map((l) => {
    const name = lang === 'en' ? l.nameEn : l.nameTr;
    const level = l.cefr || (lang === 'en' ? l.levelEn : l.levelTr);
    return `<div class="language-pill">
      <span class="language-pill-name">${escapeHtml(name)}</span>
      <span class="language-pill-level">${escapeHtml(level)}</span>
    </div>`;
  }).join('');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/* ---------------- PROJECTS ---------------- */

async function initProjects() {
  mountMagneticTilt('.tilt');
  mountProjectModal();
  applySkillFilter();

  // JSON-driven re-render of project card title + summary on lang toggle
  let projectsCache = null;
  try {
    projectsCache = await loadProjects();
  } catch (e) {
    console.warn('[projects] data load failed', e);
    return;
  }
  const render = () => {
    const lang = currentLanguage();
    document.querySelectorAll('[data-project-id]').forEach((card) => {
      const id = card.dataset.projectId;
      const project = projectsCache.find((p) => p.id === id);
      if (!project) return;
      const titleEl = card.querySelector('.project-card-title');
      const summaryEl = card.querySelector('.project-card-summary');
      if (titleEl) titleEl.textContent = lang === 'en' ? project.titleEn : project.titleTr;
      if (summaryEl) summaryEl.textContent = lang === 'en' ? project.summaryEn : project.summaryTr;
    });
  };
  render();
  onLangChange(render);
}

function mountProjectModal() {
  const modal = document.querySelector('[data-project-modal]');
  if (!modal) return;

  const titleEl = modal.querySelector('[data-modal-title]');
  const metaEl = modal.querySelector('[data-modal-meta]');
  const summaryEl = modal.querySelector('[data-modal-summary]');
  const stackEl = modal.querySelector('[data-modal-stack]');
  const featuresEl = modal.querySelector('[data-modal-features]');
  const learningsEl = modal.querySelector('[data-modal-learnings]');
  const githubEl = modal.querySelector('[data-modal-github]');
  const closeEl = modal.querySelector('[data-project-modal-close]');

  let lastFocus = null;
  let projectsCache = null;

  const open = async (id) => {
    if (!projectsCache) {
      try { projectsCache = await loadProjects(); } catch { projectsCache = []; }
    }
    const project = projectsCache.find((p) => p.id === id);
    if (!project) return;

    const lang = currentLanguage();
    const title = lang === 'en' ? project.titleEn : project.titleTr;
    const summary = lang === 'en' ? project.summaryEn : project.summaryTr;
    const features = lang === 'en' ? project.featuresEn : project.featuresTr;
    const learnings = lang === 'en' ? project.learningsEn : project.learningsTr;

    titleEl.textContent = title;
    metaEl.textContent = `${project.year} · ${project.architecture}`;
    summaryEl.textContent = summary;

    stackEl.innerHTML = '';
    project.stack.forEach((s) => {
      const span = document.createElement('span');
      span.className = 'pill skill-pill';
      span.textContent = s;
      stackEl.appendChild(span);
    });

    featuresEl.innerHTML = '';
    (features || []).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      featuresEl.appendChild(li);
    });

    learningsEl.innerHTML = '';
    (learnings || []).forEach((l) => {
      const li = document.createElement('li');
      li.textContent = l;
      learningsEl.appendChild(li);
    });

    // GitHub link / placeholder
    if (project.githubUrl && project.githubUrl !== 'PLACEHOLDER') {
      githubEl.classList.remove('placeholder-pill');
      githubEl.classList.add('skill-pill');
      githubEl.setAttribute('href', project.githubUrl);
      githubEl.removeAttribute('data-placeholder');
      githubEl.textContent = 'GitHub →';
      githubEl.setAttribute('target', '_blank');
      githubEl.setAttribute('rel', 'noopener noreferrer');
    } else {
      githubEl.classList.add('placeholder-pill');
      githubEl.classList.remove('skill-pill');
      githubEl.removeAttribute('href');
      githubEl.dataset.placeholder = 'github';
    }

    lastFocus = document.activeElement;
    modal.dataset.open = 'true';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    // Attach keydown handler BEFORE focus() — Firefox async focus event can
    // beat focus() return on slow loads, leaving a brief window where Esc
    // would be lost. Listener-first guarantees Esc reaches close() always.
    document.addEventListener('keydown', onKey);
    closeEl?.focus();
  };

  const close = () => {
    modal.dataset.open = 'false';
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  // Click handlers
  document.querySelectorAll('[data-project-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.projectModalOpen));
  });
  closeEl?.addEventListener('click', close);

  // Backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}

function applySkillFilter() {
  const params = new URLSearchParams(window.location.search);
  const skill = params.get('skill');
  if (!skill) return;

  const banner = document.getElementById('filter-banner');
  if (banner) {
    banner.style.display = '';
    banner.hidden = false;
    const target = banner.querySelector('[data-filter-skill]');
    if (target) target.textContent = skill;
    const clear = banner.querySelector('[data-filter-clear]');
    clear?.addEventListener('click', () => {
      window.location.href = 'projects.html';
    });
  }

  document.querySelectorAll('[data-skills]').forEach((card) => {
    const skills = (card.dataset.skills || '').split(/\s+/);
    if (skills.includes(skill)) {
      card.classList.add('filtered-match');
    } else {
      card.style.opacity = '0.35';
    }
  });
}

/* ---------------- SKILLS ---------------- */

async function initSkills() {
  // Sprint 4.8: nuclear rewrite. Single mount entry point.
  // Magnetic tilt is gated inside mountSkillsBento (motion-ok + pointer:fine).
  if (document.querySelector('[data-sk-grid]')) {
    mountSkillsBento();
  }

  // Sprint 7: certificates list re-renders from certificates.json on lang toggle
  let certs = [];
  try {
    certs = await loadCertificates();
  } catch (e) {
    console.warn('[skills] certificates load failed', e);
    return;
  }
  const render = () => {
    const lang = currentLanguage();
    const list = document.querySelector('.certificates-list');
    if (!list) return;
    list.innerHTML = certs.map((c) => {
      const title = lang === 'en' ? c.titleEn : c.titleTr;
      return `<li class="certificate-item">
        <span class="certificate-year">${escapeHtml(c.year)}</span>
        <div>
          <p class="certificate-title">${escapeHtml(title)}</p>
          <p class="certificate-issuer">${escapeHtml(c.issuer)}</p>
        </div>
        <span class="pill skill-pill">${escapeHtml(c.category)}</span>
      </li>`;
    }).join('');
  };
  render();
  onLangChange(render);
}

/* ---------------- CV ---------------- */

function initCv() {
  // Update download href on initial language
  const lang = currentLanguage();
  document.querySelectorAll('[data-cv-pdf]').forEach((a) => {
    a.setAttribute('href', `assets/files/cv-${lang}.pdf`);
  });

  const printBtn = document.querySelector('[data-cv-print]');
  printBtn?.addEventListener('click', () => window.print());
}

/* ---------------- CONTACT ---------------- */

// (initContact removed; initContactForm bound eagerly, initEmailCopy after i18n)

function initEmailCopy() {
  const btn = document.querySelector('[data-copy-email]');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText('ilkerefeipek00@gmail.com');
      showToast('success', getCopyMessage());
    } catch {
      showToast('error', 'ilkerefeipek00@gmail.com');
    }
  });
}

function getCopyMessage() {
  const dict = window.__i18n;
  const lang = currentLanguage();
  return dict?.[lang]?.contact?.copySuccess || 'Kopyalandı';
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  let lastSubmitTs = 0;
  const RATE_LIMIT_MS = 60_000;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check (silent)
    const hp = form.querySelector('[name="website_url"]');
    if (hp && hp.value !== '') return;

    // Client-side rate limit (UX)
    const now = Date.now();
    if (now - lastSubmitTs < RATE_LIMIT_MS) {
      showToast('error', getFormMessage('errors.rateLimit', 'Lütfen bir dakika sonra tekrar deneyin'));
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = getFormMessage('form.submitting', 'Gönderiliyor...');

    try {
      const formData = new FormData(form);
      // If web3forms key still placeholder, prevent live submission
      const key = formData.get('access_key');
      if (!key || key === 'PLACEHOLDER') {
        throw new Error('No Web3Forms key configured.');
      }

      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }
      showToast('success', getFormMessage('toast.success', 'Mesajınız iletildi.'));
      form.reset();
      lastSubmitTs = now;
    } catch (err) {
      console.warn('[contact-form]', err);
      showToast('error', getFormMessage('toast.error', 'Form gönderilemedi.'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function getFormMessage(path, fallback) {
  const dict = window.__i18n;
  const lang = currentLanguage();
  const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), dict?.[lang]?.contact);
  return typeof v === 'string' ? v : fallback;
}

/* ---------------- TOAST ---------------- */

let toastTimer = 0;
function showToast(type, msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.dataset.type = type;
  toast.textContent = msg;
  toast.hidden = false;
  toast.dataset.visible = 'true';
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.dataset.visible = 'false';
    toast.hidden = true;
  }, TOAST_DURATION_MS);
}
