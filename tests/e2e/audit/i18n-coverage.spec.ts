/**
 * Sprint 3 audit: compare data-i18n attributes in HTML against
 * data/content.json TR/EN keys. Identify missing + orphan + parity issues.
 *
 * Output: tests/audit/i18n-coverage.log
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..', '..');
const AUDIT_DIR = path.join(__dirname, '..', '..', 'audit');

test.beforeAll(() => fs.mkdirSync(AUDIT_DIR, { recursive: true }));

test('i18n-coverage: HTML data-i18n keys vs content.json TR/EN parity', async ({}, testInfo) => {

  // 1. Collect data-i18n usages from all HTML files
  const htmlFiles = ['index.html', 'about.html', 'skills.html', 'projects.html', 'cv.html', 'contact.html', '404.html'];
  const usedKeys = new Set<string>();
  const usedAttrKeys = new Set<string>();
  const usedKeysByPage = new Map<string, Set<string>>();

  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const pageKeys = new Set<string>();

    // data-i18n="path.to.key"
    const reText = /data-i18n="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = reText.exec(content))) {
      usedKeys.add(m[1]);
      pageKeys.add(m[1]);
    }

    // data-i18n-attr="attr:path.to.key"
    const reAttr = /data-i18n-attr="([^"]+)"/g;
    while ((m = reAttr.exec(content))) {
      const spec = m[1];
      const colonIdx = spec.indexOf(':');
      if (colonIdx > 0) {
        const k = spec.slice(colonIdx + 1).trim();
        usedAttrKeys.add(k);
        pageKeys.add(k);
      }
    }

    usedKeysByPage.set(f, pageKeys);
  }

  // 2. Load content.json
  const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'content.json'), 'utf8'));

  // 3. Recursively flatten content.tr and content.en to dot keys
  const flatten = (obj: any, prefix = ''): string[] => {
    if (obj == null || typeof obj !== 'object') return [];
    if (Array.isArray(obj)) {
      return obj.flatMap((item, idx) => flatten(item, prefix ? `${prefix}.${idx}` : String(idx)));
    }
    const out: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      if (v != null && typeof v === 'object') {
        out.push(...flatten(v, next));
      } else {
        out.push(next);
      }
    }
    return out;
  };

  const trKeys = new Set(flatten(content.tr || {}));
  const enKeys = new Set(flatten(content.en || {}));
  const allUsed = new Set([...usedKeys, ...usedAttrKeys]);

  // 4. Set differences
  const missingTr = [...allUsed].filter((k) => !trKeys.has(k)).sort();
  const missingEn = [...allUsed].filter((k) => !enKeys.has(k)).sort();
  const orphanTr = [...trKeys].filter((k) => !allUsed.has(k)).sort();
  const orphanEn = [...enKeys].filter((k) => !allUsed.has(k)).sort();

  // 5. Parity
  const trOnly = [...trKeys].filter((k) => !enKeys.has(k)).sort();
  const enOnly = [...enKeys].filter((k) => !trKeys.has(k)).sort();

  // Persist log
  const lines = [
    `# i18n coverage audit`,
    `# Generated: ${new Date().toISOString()}`,
    `# HTML data-i18n usage: ${usedKeys.size} text + ${usedAttrKeys.size} attribute = ${allUsed.size} unique`,
    `# content.json TR keys: ${trKeys.size}`,
    `# content.json EN keys: ${enKeys.size}`,
    `# TR-EN parity diff: ${trOnly.length + enOnly.length}`,
    '',
    `## Missing in TR (${missingTr.length}):`,
    ...missingTr.map((k) => `  - ${k}`),
    '',
    `## Missing in EN (${missingEn.length}):`,
    ...missingEn.map((k) => `  - ${k}`),
    '',
    `## Orphan keys in TR (${orphanTr.length}):`,
    ...orphanTr.map((k) => `  - ${k}`),
    '',
    `## Orphan keys in EN (${orphanEn.length}):`,
    ...orphanEn.map((k) => `  - ${k}`),
    '',
    `## TR-only (in TR but not in EN, ${trOnly.length}):`,
    ...trOnly.map((k) => `  - ${k}`),
    '',
    `## EN-only (in EN but not in TR, ${enOnly.length}):`,
    ...enOnly.map((k) => `  - ${k}`),
    '',
    `## Per-page used-keys count:`,
    ...[...usedKeysByPage.entries()].map(([f, k]) => `  ${f}: ${k.size}`),
  ];
  fs.writeFileSync(path.join(AUDIT_DIR, 'i18n-coverage.log'), lines.join('\n'), 'utf8');

  console.log(`i18n: missing TR=${missingTr.length}, missing EN=${missingEn.length}, orphan TR=${orphanTr.length}, orphan EN=${orphanEn.length}`);

  // Soft assertion (audit only):
  // - missing keys are P1+ (visible regression for users)
  // - orphan keys are P3 (cleanup)
  // - TR-EN parity diff is P2
  // For now we just record; rapor agent reads the log.
  expect(allUsed.size).toBeGreaterThan(0);
});
