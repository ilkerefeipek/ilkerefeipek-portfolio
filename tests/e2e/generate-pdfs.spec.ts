/**
 * generate-pdfs.spec.ts
 * Sprint 20: reproducible CV PDF generation via Playwright.
 *
 * Run: npx playwright test e2e/generate-pdfs.spec.ts --project=chromium-desktop
 */

import { test } from '@playwright/test';

const langs = ['tr', 'en'];

for (const lang of langs) {
  test(`generate cv-${lang}.pdf`, async ({ page }) => {
    // Set localStorage BEFORE navigation so lang-init.js sees it
    await page.addInitScript((l) => {
      localStorage.setItem('lang', l);
    }, lang);

    await page.goto(`/cv.html?lang=${lang}`);
    await page.waitForLoadState('networkidle');

    // Belt-and-suspenders: confirm <html lang> matches
    await page.waitForFunction(
      (l) => document.documentElement.lang === l,
      lang,
      { timeout: 5_000 }
    );

    // Force print media emulation so the @media print rules apply
    await page.emulateMedia({ media: 'print' });

    await page.pdf({
      path: `../assets/files/cv-${lang}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    });
  });
}
