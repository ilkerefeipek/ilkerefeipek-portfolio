/**
 * Sprint 3 audit: deep dead-link scan including external URLs.
 * Skips placeholder elements (data-placeholder OR href === "PLACEHOLDER" OR
 * the linked URL is "PLACEHOLDER" in data/content.json).
 *
 * Output: tests/audit/dead-links.log
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_DIR = path.join(__dirname, '..', '..', 'audit');

const PAGES = ['/', '/about.html', '/skills.html', '/projects.html', '/cv.html', '/contact.html', '/404.html'];

test.beforeAll(() => fs.mkdirSync(AUDIT_DIR, { recursive: true }));

test('dead-links-deep: all unique links across all pages', async ({ page, request }, testInfo) => {
  test.setTimeout(120_000);

  // Load content.json to know which links are PLACEHOLDER
  const contentRaw = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'data', 'content.json'),
    'utf8'
  );
  const content = JSON.parse(contentRaw);
  const placeholderUrls = new Set<string>(
    [content.links?.linkedin, content.links?.github, ...Object.values(content.links?.projectRepos || {}), content.links?.web3formsKey]
      .filter((v) => typeof v === 'string' && v === 'PLACEHOLDER')
  );

  const internal = new Set<string>();
  const external = new Set<string>();

  for (const url of PAGES) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors
        .filter((a) => !a.hasAttribute('data-placeholder'))
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('#'))
    );
    for (const h of hrefs) {
      if (h === 'PLACEHOLDER' || placeholderUrls.has(h)) continue;
      try {
        const abs = new URL(h, `http://127.0.0.1:8765${url}`).toString();
        if (abs.startsWith('http://127.0.0.1') || abs.startsWith('https://127.0.0.1')) {
          internal.add(abs);
        } else if (/^https?:\/\//.test(abs)) {
          external.add(abs);
        }
      } catch {
        // ignore malformed
      }
    }
  }

  type Result = { url: string; status: number; ms: number; kind: 'internal' | 'external'; error?: string };
  const results: Result[] = [];

  const probe = async (url: string, kind: 'internal' | 'external'): Promise<Result> => {
    const start = Date.now();
    try {
      const res = await request.get(url, { timeout: 10_000, maxRedirects: 5 });
      return { url, status: res.status(), ms: Date.now() - start, kind };
    } catch (e: any) {
      return { url, status: 0, ms: Date.now() - start, kind, error: String(e?.message || e) };
    }
  };

  for (const u of internal) results.push(await probe(u, 'internal'));
  for (const u of external) results.push(await probe(u, 'external'));

  const broken = results.filter((r) => r.status === 0 || r.status >= 400);

  // Persist
  const lines = [
    `# Dead-link deep scan`,
    `# Generated: ${new Date().toISOString()}`,
    `# Internal: ${internal.size}, External: ${external.size}, Total broken: ${broken.length}`,
    `# Placeholder URLs skipped: ${placeholderUrls.size}`,
    '',
    '## All probed:',
    ...results.map((r) => `[${r.status}] ${r.kind.padEnd(8)} ${r.ms.toString().padStart(5)}ms ${r.url}${r.error ? ' — ' + r.error : ''}`),
    '',
    '## Broken (status 0 or 4xx/5xx):',
    ...broken.map((r) => `[${r.status}] ${r.kind} ${r.url}${r.error ? ' — ' + r.error : ''}`),
  ];
  fs.writeFileSync(path.join(AUDIT_DIR, 'dead-links.log'), lines.join('\n'), 'utf8');

  if (broken.length) console.log(`Dead links: ${broken.length} (see tests/audit/dead-links.log)`);

  // Soft assertion — the audit captures, doesn't gate.
  // Hard assertion: no internal-broken (those are deploy bloklayıcı).
  const internalBroken = broken.filter((r) => r.kind === 'internal');
  expect(internalBroken).toEqual([]);
});
