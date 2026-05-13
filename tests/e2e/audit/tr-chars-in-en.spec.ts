import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auditDir = path.join(__dirname, '../../audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'about', url: '/about.html' },
  { name: 'skills', url: '/skills.html' },
  { name: 'projects', url: '/projects.html' },
  { name: 'cv', url: '/cv.html' },
  { name: 'contact', url: '/contact.html' },
  { name: 'notfound', url: '/404.html' },
];

const WHITELIST_TR_TERMS = [
  'İlker Efe İpek',
  'İlker',
  'İpek',
  'Yazılım Marketi',
  'İnnosa Yazılım',
  'İzmir Ekonomi Üniversitesi',
];

interface TrIssue {
  page: string;
  selector: string;
  field: string;
  text: string;
  matches: string[];
}

async function auditPage(page: Page, name: string): Promise<TrIssue[]> {
  return (await page.evaluate(
    ({ whitelist }) => {
      const trRegex = /[İıŞşĞğÇçÖöÜü]/;
      const tokenRegex = /\S*[İıŞşĞğÇçÖöÜü]\S*/g;
      const found: any[] = [];

      function isWhite(t: string): boolean {
        return whitelist.some((term: string) => t.includes(term));
      }

      function check(selector: string, field: string, text: string | null) {
        if (!text) return;
        if (!trRegex.test(text)) return;
        if (isWhite(text)) return;
        const matches = text.match(tokenRegex) || [];
        const offending = matches.filter((m) => !isWhite(m));
        if (offending.length === 0) return;
        found.push({ selector, field, text: text.slice(0, 100), matches: offending });
      }

      function selectorOf(el: Element): string {
        const tag = el.tagName.toLowerCase();
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
        const cls = typeof el.className === 'string' && el.className.trim()
          ? `.${el.className.trim().split(/\s+/)[0]}`
          : '';
        return `${tag}${id}${cls}`;
      }

      document.querySelectorAll('*').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'template', 'noscript'].includes(tag)) return;
        if (el.closest('[data-cv-lang][hidden]')) return;
        if ((el as HTMLElement).hidden) return;
        if ((el as HTMLElement).getAttribute('aria-hidden') === 'true') return;

        const directText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => (n.textContent || '').trim())
          .filter((t) => t)
          .join(' ');
        check(selectorOf(el), 'textContent', directText);

        for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
          check(selectorOf(el), attr, el.getAttribute(attr));
        }
      });

      document.querySelectorAll('meta[content]').forEach((m) => {
        const key = m.getAttribute('name') || m.getAttribute('property') || '';
        check(`meta[${key}]`, 'content', m.getAttribute('content'));
      });

      check('document.title', 'title', document.title);

      return found;
    },
    { whitelist: WHITELIST_TR_TERMS }
  )).map((i: any) => ({ ...i, page: name }));
}

for (const { name, url } of PAGES) {
  test(`tr-chars in EN mode: ${name}`, async ({ page }) => {
    await page.goto(url);
    await page.evaluate(() => localStorage.setItem('lang', 'en'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    const issues = await auditPage(page, name);
    fs.writeFileSync(
      path.join(auditDir, `tr-chars-${name}.json`),
      JSON.stringify({ page: name, totalIssues: issues.length, issues }, null, 2)
    );
    expect(
      issues,
      `${issues.length} TR char leak(s) in EN ${name} — see tests/audit/tr-chars-${name}.json`
    ).toEqual([]);
  });
}
