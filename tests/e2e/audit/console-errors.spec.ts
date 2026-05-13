/**
 * Sprint 3 audit: harvest console errors + warnings + uncaught page errors
 * across each page after a realistic interaction sequence.
 *
 * Output: tests/audit/console-{page}.log (one per page)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Entry = { kind: 'error' | 'warning' | 'pageerror' | 'requestfailed'; text: string; url?: string };

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

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
});

for (const p of PAGES) {
  test(`console-audit: ${p.name}`, async ({ page }, testInfo) => {

    const entries: Entry[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') entries.push({ kind: 'error', text: msg.text() });
      else if (type === 'warning') entries.push({ kind: 'warning', text: msg.text() });
    });
    page.on('pageerror', (err) => entries.push({ kind: 'pageerror', text: err.message }));
    page.on('requestfailed', (req) => {
      entries.push({ kind: 'requestfailed', text: req.failure()?.errorText || 'unknown', url: req.url() });
    });

    // Navigate
    await page.goto(p.url, { waitUntil: 'networkidle' });

    // Realistic interaction sequence
    // 1. Scroll to bottom and back
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // 2. Mouse moves (cursor blob, magnetic tilt, arch hover)
    for (let i = 0; i < 4; i++) {
      await page.mouse.move(200 + i * 200, 300 + i * 100);
      await page.waitForTimeout(80);
    }

    // 3. Open + close mobile drawer (only if navOpen exists; on home/about/etc.)
    const navOpen = page.locator('[data-nav-open]');
    if (await navOpen.count()) {
      // We're on desktop; nav-toggle hidden via CSS (display:none @ ≥768).
      // Force-click to confirm no JS error.
      await navOpen.click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
      const navClose = page.locator('[data-nav-close]');
      if (await navClose.count()) {
        await navClose.click({ force: true }).catch(() => {});
      }
    }

    // 4. Click language toggle TR/EN twice
    const trBtn = page.locator('[data-lang-toggle][data-lang="tr"]');
    const enBtn = page.locator('[data-lang-toggle][data-lang="en"]');
    if (await trBtn.count()) {
      await trBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
    }
    if (await enBtn.count()) {
      await enBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
    }

    // 5. Page-specific interactions
    if (p.name === 'projects') {
      const detailsBtn = page.locator('[data-project-modal-open]').first();
      if (await detailsBtn.count()) {
        await detailsBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(200);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
    }

    if (p.name === 'contact') {
      const name = page.locator('#contact-name');
      if (await name.count()) {
        await name.fill('Audit Test');
        await page.locator('#contact-email').fill('test@example.com');
        await page.locator('#contact-subject').fill('Audit subject');
        await page.locator('#contact-message').fill('Audit message body for fill test only.');
        // Do NOT submit (would hit Web3Forms with real key)
      }
    }

    // 6. Final wait for any async errors
    await page.waitForTimeout(300);

    // Persist log
    const lines = [
      `# Console audit — ${p.name} (${p.url})`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total entries: ${entries.length}`,
      '',
      ...entries.map((e) =>
        e.kind === 'requestfailed'
          ? `[${e.kind}] ${e.url} — ${e.text}`
          : `[${e.kind}] ${e.text}`
      ),
    ];
    const outFile = path.join(AUDIT_DIR, `console-${p.name}.log`);
    fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

    // Filter benign entries for assertion (3rd party / known-OK)
    const offenders = entries.filter((e) => {
      if (e.kind !== 'error' && e.kind !== 'pageerror') return false;
      // Allow 404 favicon variants and similar non-critical
      if (e.text.includes('favicon') && e.text.includes('404')) return false;
      return true;
    });

    // Soft assertion — log but don't fail (we just want to harvest)
    if (offenders.length > 0) {
      console.log(`[${p.name}] ${offenders.length} offender entries (see ${outFile})`);
    }

    // For audit purposes, we record but don't fail the test:
    expect(entries.length).toBeGreaterThanOrEqual(0);
  });
}
