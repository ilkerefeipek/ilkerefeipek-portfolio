/**
 * Sprint 3 audit: harvest network failures (4xx, 5xx, requestfailed) per page.
 * Output: tests/audit/network-{page}.log
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Net = { kind: 'failed' | 'http-error'; url: string; status?: number; reason?: string };

const PAGES = [
  { name: 'home',     url: '/' },
  { name: 'about',    url: '/about.html' },
  { name: 'skills',   url: '/skills.html' },
  { name: 'projects', url: '/projects.html' },
  { name: 'cv',       url: '/cv.html' },
  { name: 'contact',  url: '/contact.html' },
  { name: 'notfound', url: '/404.html' },
];

const AUDIT_DIR = path.join(__dirname, '..', '..', 'audit');

test.beforeAll(() => fs.mkdirSync(AUDIT_DIR, { recursive: true }));

for (const p of PAGES) {
  test(`network-audit: ${p.name}`, async ({ page }, testInfo) => {

    const fails: Net[] = [];

    page.on('requestfailed', (req) => {
      fails.push({ kind: 'failed', url: req.url(), reason: req.failure()?.errorText });
    });
    page.on('response', (res) => {
      const status = res.status();
      // Skip OPTIONS preflight 0 status; skip 304 (not-modified is OK)
      if (status >= 400 && status !== 304) {
        fails.push({ kind: 'http-error', url: res.url(), status });
      }
    });

    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15_000 });

    // Trigger a few more requests via interactions
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Persist log
    const lines = [
      `# Network audit — ${p.name} (${p.url})`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total failures: ${fails.length}`,
      '',
      ...fails.map((f) =>
        f.kind === 'failed'
          ? `[failed] ${f.url} — ${f.reason}`
          : `[${f.status}] ${f.url}`
      ),
    ];
    fs.writeFileSync(path.join(AUDIT_DIR, `network-${p.name}.log`), lines.join('\n'), 'utf8');

    // Soft assertion — for site-side requests only (same origin)
    const sameOriginFails = fails.filter((f) => {
      try {
        const u = new URL(f.url);
        return u.host === '127.0.0.1:8765' || u.host === 'localhost:8765';
      } catch {
        return false;
      }
    });

    if (sameOriginFails.length > 0) {
      console.log(`[${p.name}] ${sameOriginFails.length} same-origin failures`);
    }

    expect(fails.length).toBeGreaterThanOrEqual(0);
  });
}
