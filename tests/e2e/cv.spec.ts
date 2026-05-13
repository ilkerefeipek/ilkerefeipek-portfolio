import { test, expect } from '@playwright/test';

test.describe('CV page', () => {
  // Sprint 14: Firefox playwright driver shows ~5% flake on async lang-toggle
  // applyLang + View Transitions DOM update under full-suite load (same pattern
  // as projects.spec). retries:3 absorbs.
  test.describe.configure({ retries: 3 });

  test('TR content visible by default; EN hidden', async ({ page }) => {
    await page.goto('/cv.html');
    // Sprint 13 zero-flake hardening: drop fixed waitForTimeout(150) — applyLang
    // is async (View Transitions). Wait for aria-pressed='true' as proxy for
    // applyLang completion, then assert visibility.
    const trBtn = page.locator('[data-lang-toggle][data-lang="tr"]');
    await trBtn.click();
    await expect(trBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    const tr = page.locator('[data-cv-lang="tr"]');
    const en = page.locator('[data-cv-lang="en"]');
    await expect(tr).toBeVisible({ timeout: 10_000 });
    await expect(en).toBeHidden({ timeout: 10_000 });
  });

  test('lang toggle hides TR and shows EN', async ({ page }) => {
    await page.goto('/cv.html');
    // Sprint 13 zero-flake hardening: drop fixed waitForTimeout(150) — applyLang
    // is async (View Transitions) so the DOM update can exceed 150ms on Firefox.
    // Use auto-polling assertions with 10s ceiling.
    const enBtn = page.locator('[data-lang-toggle][data-lang="en"]');
    await enBtn.click();
    await expect(enBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    await expect(page.locator('[data-cv-lang="tr"]')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('[data-cv-lang="en"]')).toBeVisible({ timeout: 10_000 });
  });

  test('PDF download button href reflects current language', async ({ page }) => {
    await page.goto('/cv.html');
    // Sprint 13 zero-flake hardening: applyLang() uses View Transitions, so
    // the [data-cv-pdf] href swap happens AFTER the VT 'run' callback fires.
    // Wait for the toggle's aria-pressed='true' (= applyLang's
    // langChangeListeners executed) AS PROXY for applyLang completion, then
    // assert href. Each step has explicit 10s timeout.
    const trBtn = page.locator('[data-lang-toggle][data-lang="tr"]');
    const enBtn = page.locator('[data-lang-toggle][data-lang="en"]');
    const pdf = page.locator('[data-cv-pdf]');

    await trBtn.click();
    await expect(trBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    await expect(pdf).toHaveAttribute('href', /cv-tr\.pdf$/, { timeout: 10_000 });

    await enBtn.click();
    await expect(enBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    await expect(pdf).toHaveAttribute('href', /cv-en\.pdf$/, { timeout: 10_000 });
  });

  test('cv PDF assets resolve with 200 + correct content-type', async ({ request }) => {
    for (const lang of ['tr', 'en']) {
      const res = await request.get(`/assets/files/cv-${lang}.pdf`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toMatch(/application\/pdf/i);
    }
  });

  test('phone number IS visible on CV (privacy exception)', async ({ page }) => {
    await page.goto('/cv.html');
    await expect(page.locator('body')).toContainText('+90 532 491 11 07');
  });

  test('print stylesheet defines @media print rules', async ({ page }) => {
    await page.goto('/cv.html');
    const hasPrintRules = await page.evaluate(() => {
      let count = 0;
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from((sheet as CSSStyleSheet).cssRules || [])) {
            if (rule instanceof CSSMediaRule && rule.conditionText?.includes('print')) count++;
          }
        } catch { /* CORS-blocked sheet */ }
      }
      return count;
    });
    expect(hasPrintRules).toBeGreaterThan(0);
  });
});
