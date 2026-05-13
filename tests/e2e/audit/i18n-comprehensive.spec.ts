import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const properNounsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'proper-nouns.json'), 'utf8'));
const PROPER_NOUNS: string[] = properNounsRaw.properNouns;

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'about', url: '/about.html' },
  { name: 'skills', url: '/skills.html' },
  { name: 'projects', url: '/projects.html' },
  { name: 'cv', url: '/cv.html' },
  { name: 'contact', url: '/contact.html' },
  { name: 'notfound', url: '/404.html' },
];

interface FieldMap {
  textContent?: string;
  alt?: string;
  title?: string;
  ariaLabel?: string;
  placeholder?: string;
  value?: string;
}
type Capture = Record<string, FieldMap>;

interface I18nIssue {
  page: string;
  selector: string;
  field: string;
  trValue?: string;
  enValue?: string;
  type: 'untranslated' | 'missing-en' | 'missing-tr';
}

const auditDir = path.join(__dirname, '../../audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

async function captureAllText(page: Page): Promise<Capture> {
  return await page.evaluate(() => {
    const out: Record<string, any> = {};

    function selectorOf(el: Element): string {
      if (el.id) return `#${el.id}`;
      const parts: string[] = [];
      let cur: Element | null = el;
      let depth = 0;
      while (cur && cur.nodeType === 1 && depth < 6) {
        let token = cur.nodeName.toLowerCase();
        const cls =
          typeof cur.className === 'string'
            ? cur.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')
            : '';
        if (cls) token += `.${cls}`;
        const sib = Array.from(cur.parentElement?.children || []);
        const idx = sib.indexOf(cur);
        if (sib.length > 1) token += `:nth(${idx})`;
        parts.unshift(token);
        cur = cur.parentElement;
        depth++;
      }
      return parts.join(' > ');
    }

    document.querySelectorAll('*').forEach((el) => {
      // Skip script/style/template elements
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'template', 'noscript'].includes(tag)) return;
      // Skip elements that are part of CV non-active language block
      if (el.closest('[data-cv-lang][hidden]')) return;
      // Skip elements with aria-hidden=true (decorative)
      if ((el as HTMLElement).getAttribute('aria-hidden') === 'true') return;
      // Skip if element itself or any ancestor has hidden attribute
      if ((el as HTMLElement).hidden) return;

      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => (n.textContent || '').trim())
        .filter((t) => t.length > 0)
        .join(' ');

      const cap: any = {};
      if (directText) cap.textContent = directText;

      const attrs: [string, string][] = [
        ['alt', 'alt'],
        ['title', 'title'],
        ['aria-label', 'ariaLabel'],
        ['placeholder', 'placeholder'],
      ];
      // value only on inputs that have user-meaningful default
      if (tag === 'input' || tag === 'textarea' || tag === 'button') {
        attrs.push(['value', 'value']);
      }
      for (const [a, k] of attrs) {
        const v = el.getAttribute(a);
        if (v && v.trim().length > 0) cap[k] = v.trim();
      }

      if (Object.keys(cap).length > 0) {
        const sel = selectorOf(el);
        // Avoid overwriting on selector collision: append index
        let unique = sel;
        let i = 1;
        while (out[unique]) {
          unique = `${sel}#dup${i++}`;
        }
        out[unique] = cap;
      }
    });

    out['__title'] = { textContent: document.title };
    out['__html_lang'] = { value: document.documentElement.lang };

    document.querySelectorAll('meta').forEach((m) => {
      const name = m.getAttribute('name') || m.getAttribute('property');
      const content = m.getAttribute('content');
      if (name && content) {
        // Only translatable meta tags
        const lname = name.toLowerCase();
        if (
          lname.includes('description') ||
          lname.includes('title') ||
          lname.includes('og:') ||
          lname.includes('twitter:')
        ) {
          out[`__meta__${name}`] = { value: content };
        }
      }
    });

    return out;
  });
}

function isProperNoun(text: string, list: string[]): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  // Numeric / pure punctuation are not bugs
  if (/^[\d\s\W_]+$/.test(t)) return true;
  // Single-letter or very short tokens are skipped (often initials, ★, etc.)
  if (t.length <= 2) return true;
  // Email addresses, phone numbers, URLs, file paths are universal
  if (/@|tel:|^https?:\/\/|\.(svg|png|jpg|pdf|css|js|html)$/i.test(t)) return true;
  // Match if the entire string equals a proper noun OR is composed of proper nouns + separators
  for (const pn of list) {
    if (t === pn) return true;
    if (t.toLowerCase() === pn.toLowerCase()) return true;
  }
  // Composite check: if the string is a comma/space/dot-separated list of proper nouns
  const tokens = t
    .split(/[,·\/+&]|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((tok) => list.some((pn) => pn === tok || pn.toLowerCase() === tok.toLowerCase()));
  }
  // Substring proper-noun shield: if a proper noun is a major fraction of the string
  for (const pn of list) {
    if (t.includes(pn) && pn.length / t.length >= 0.7) return true;
  }
  return false;
}

const FIELDS: Array<keyof FieldMap> = ['textContent', 'alt', 'title', 'ariaLabel', 'placeholder', 'value'];

async function auditPage(page: Page, name: string, url: string): Promise<I18nIssue[]> {
  const issues: I18nIssue[] = [];

  // Step 1: TR
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('lang', 'tr'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);
  const trCap = await captureAllText(page);

  // Step 2: EN
  const toggle = page.locator('[data-lang-toggle][data-lang="en"]').first();
  if (await toggle.count() > 0) {
    await toggle.click();
    await page.waitForTimeout(800);
  } else {
    // Fallback: force language via localStorage
    await page.evaluate(() => localStorage.setItem('lang', 'en'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  }
  const enCap = await captureAllText(page);

  const allKeys = new Set<string>([...Object.keys(trCap), ...Object.keys(enCap)]);
  for (const sel of allKeys) {
    const tr = trCap[sel];
    const en = enCap[sel];
    if (!tr || !en) continue; // orphan/dynamic — too noisy, skip

    for (const f of FIELDS) {
      const tv = tr[f];
      const ev = en[f];
      if (tv && ev && tv === ev && !isProperNoun(tv, PROPER_NOUNS)) {
        issues.push({ page: name, selector: sel, field: f, trValue: tv, enValue: ev, type: 'untranslated' });
      } else if (tv && !ev) {
        issues.push({ page: name, selector: sel, field: f, trValue: tv, type: 'missing-en' });
      } else if (!tv && ev) {
        issues.push({ page: name, selector: sel, field: f, enValue: ev, type: 'missing-tr' });
      }
    }
  }

  return issues;
}

for (const { name, url } of PAGES) {
  test(`i18n comprehensive: ${name}`, async ({ page }, testInfo) => {
    const issues = await auditPage(page, name, url);
    fs.writeFileSync(
      path.join(auditDir, `i18n-${name}.json`),
      JSON.stringify({ page: name, totalIssues: issues.length, issues }, null, 2)
    );
    // HARD assertion: Sprint 7 closed at 0 issues across all 7 pages via
    // onLangChange observer + JSON-driven render hooks (about/projects/
    // certificates/featured) + placeholder anchor data-i18n-attr cleanup.
    // Future regressions surface immediately as test failures.
    expect(
      issues,
      `${issues.length} i18n issue(s) in ${name} — see tests/audit/i18n-${name}.json`
    ).toEqual([]);
  });
}
