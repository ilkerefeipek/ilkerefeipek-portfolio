/**
 * i18n.js
 * TR/EN content switcher. data-i18n on text, data-i18n-attr on attributes.
 * CV uses [data-cv-lang] hidden toggle (long-form content, no dictionary).
 * Persists to localStorage; falls back to navigator.language; default TR.
 */

import { loadContent, getPath } from './data-loader.js';

const STORAGE_KEY = 'lang';
const DEFAULT_LANG = 'tr';
const SUPPORTED = ['tr', 'en'];

let dict = null;
let currentLang = DEFAULT_LANG;
const langChangeListeners = new Set();

/**
 * Register a callback that runs after each applyLang(). Used by page
 * init functions (initAbout, initProjects, etc.) to re-render JSON-driven
 * content on TR/EN toggle. Returns an unsubscribe function.
 *
 * @param {(lang: 'tr'|'en') => void} callback
 * @returns {() => void}
 */
export function onLangChange(callback) {
  langChangeListeners.add(callback);
  return () => langChangeListeners.delete(callback);
}

/**
 * Initialize i18n. Loads content.json, applies stored or detected language.
 */
export async function initI18n() {
  try {
    dict = await loadContent();
  } catch (err) {
    console.warn('[i18n] content.json yüklenemedi, fallback HTML default kullanılıyor:', err);
    return;
  }

  // diagnostic handle
  window.__i18n = dict;

  // Resolve initial language
  const stored = localStorage.getItem(STORAGE_KEY);
  let lang = stored;
  if (!lang) {
    // Query string ?lang=en|tr override (used e.g. by hreflang alternate)
    const qs = new URLSearchParams(window.location.search);
    const qsLang = qs.get('lang');
    if (qsLang && SUPPORTED.includes(qsLang)) {
      lang = qsLang;
    } else {
      const nav = (navigator.language || DEFAULT_LANG).toLowerCase();
      lang = nav.startsWith('tr') ? 'tr' : 'en';
    }
  }
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;

  applyLang(lang, { animate: false });
  bindToggleButtons();
  bindPlaceholderTooltips();
  injectLinks();
}

/**
 * Apply a language across the page.
 * @param {'tr'|'en'} lang
 * @param {{ animate?: boolean }} [options]
 */
export function applyLang(lang, { animate = true } = {}) {
  if (!SUPPORTED.includes(lang)) return;

  const run = () => {
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    if (!dict) return;
    const langDict = dict[lang];
    if (!langDict) return;

    // textContent updates via data-i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const path = el.dataset.i18n;
      const v = getPath(langDict, path);
      if (typeof v === 'string') el.textContent = v;
    });

    // attribute updates via data-i18n-attr (format: "attrName:path.to.key")
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.dataset.i18nAttr;
      if (!spec) return;
      const [attr, path] = spec.split(':');
      if (!attr || !path) return;
      const v = getPath(langDict, path);
      if (typeof v === 'string') el.setAttribute(attr.trim(), v);
    });

    // CV special case: hide all blocks except matching lang
    document.querySelectorAll('[data-cv-lang]').forEach((el) => {
      el.hidden = el.dataset.cvLang !== lang;
    });

    // CV download href reflects language
    document.querySelectorAll('[data-cv-pdf]').forEach((el) => {
      el.setAttribute('href', `assets/files/cv-${lang}.pdf`);
    });

    // Lang toggle aria-pressed state
    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });

    // Update <title> meta tag (for browsers that don't react to text update)
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = titleEl.textContent;

    // Re-localize placeholder pill tooltips on lang toggle
    bindPlaceholderTooltips();

    // Notify subscribed render hooks (about, projects, certs, etc.)
    for (const cb of langChangeListeners) {
      try { cb(lang); } catch (e) { console.warn('[i18n] lang-change callback error', e); }
    }
  };

  if (animate && document.startViewTransition) {
    document.startViewTransition(run);
  } else {
    run();
  }
}

function bindToggleButtons() {
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lang;
      applyLang(target);
    });
  });
}

/**
 * Add accessible tooltips to placeholder pills.
 * The HTML already has title="...", but we replace with current language tooltip text.
 */
function bindPlaceholderTooltips() {
  if (!dict) return;
  const tooltips = {
    linkedin: 'placeholderMicrocopy.tooltip',
    github: 'placeholderMicrocopy.tooltip',
  };
  document.querySelectorAll('[data-placeholder]').forEach((el) => {
    const kind = el.dataset.placeholder;
    if (kind === 'github' && el.dataset.projectRepo) {
      // project repo placeholder uses different tooltip
      const v = getPath(dict[currentLang], 'placeholderMicrocopy.projectRepoTooltip');
      if (v) el.setAttribute('title', v);
      el.setAttribute('aria-label', v || '');
    } else if (tooltips[kind]) {
      const v = getPath(dict[currentLang], tooltips[kind]);
      if (v) el.setAttribute('title', v);
      el.setAttribute('aria-label', v || '');
    }
  });
}

/**
 * Replace a placeholder <span> element with a real <a> anchor.
 * Placeholders are <span> in HTML (so they don't fail Lighthouse SEO
 * "crawlable-anchors"); when a real URL is configured we swap to <a>.
 *
 * @param {Element} el
 * @param {string} url
 * @param {string} label
 * @returns {HTMLAnchorElement}
 */
function placeholderToAnchor(el, url, label) {
  const a = document.createElement('a');
  // Preserve relevant attributes — but skip placeholder-only ones (title /
  // aria-label held the "link will be updated soon" tooltip; meaningless
  // on the resolved anchor — text label is sufficient).
  for (const attr of el.attributes) {
    if (attr.name === 'class') continue;
    if (attr.name === 'data-placeholder') continue;
    if (attr.name === 'data-i18n-attr') continue; // placeholder tooltip binding (irrelevant on resolved anchor)
    if (attr.name === 'data-i18n') continue;      // placeholder text binding (we set our own anchor label)
    if (attr.name === 'title') continue;
    if (attr.name === 'aria-label') continue;
    a.setAttribute(attr.name, attr.value);
  }
  a.className = el.className.replace(/\bplaceholder-pill\b/, 'skill-pill').trim();
  a.setAttribute('href', url);
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  a.textContent = label;
  el.replaceWith(a);
  return a;
}

/**
 * Inject real URLs into placeholder elements when content.json links are not 'PLACEHOLDER'.
 * If still placeholder, leave the styled .placeholder-pill as-is.
 */
function injectLinks() {
  if (!dict?.links) return;
  const { linkedin, github, projectRepos = {}, web3formsKey } = dict.links;

  // LinkedIn
  if (linkedin && linkedin !== 'PLACEHOLDER') {
    document.querySelectorAll('[data-placeholder="linkedin"]').forEach((el) => {
      placeholderToAnchor(el, linkedin, 'LinkedIn');
    });
  }
  // GitHub (kişisel)
  if (github && github !== 'PLACEHOLDER') {
    document.querySelectorAll('[data-placeholder="github"]:not([data-project-repo])').forEach((el) => {
      placeholderToAnchor(el, github, 'GitHub');
    });
  }
  // Project repos
  document.querySelectorAll('[data-project-repo]').forEach((el) => {
    const key = el.dataset.projectRepo;
    const url = projectRepos[key];
    if (url && url !== 'PLACEHOLDER') {
      placeholderToAnchor(el, url, 'GitHub →');
    }
  });
  // Web3Forms key
  if (web3formsKey && web3formsKey !== 'PLACEHOLDER') {
    const input = document.getElementById('web3forms-key');
    if (input) input.value = web3formsKey;
  }
}

/** @returns {string} current language code */
export function currentLanguage() {
  return currentLang;
}
