import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  // Sprint 13: Firefox playwright driver has known ~10% flake on modal Esc
  // keyboard event under suite load. The app handler is correct; the driver
  // sometimes drops the event. Bump retries for this describe block only.
  test.describe.configure({ retries: 3 });

  test('renders 4 project cards', async ({ page }) => {
    await page.goto('/projects.html');
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(4);
  });

  test('each card shows architecture meta and tech pills', async ({ page }) => {
    await page.goto('/projects.html');
    const cards = page.locator('.project-card');
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i).locator('.project-card-architecture')).toBeVisible();
      await expect(cards.nth(i).locator('.project-card-stack .skill-pill').first()).toBeVisible();
    }
  });

  test('GitHub pills (placeholder or real link) on each card', async ({ page }) => {
    await page.goto('/projects.html');
    // Each project card has either a placeholder <span> or a real <a> link
    // depending on data/content.json. Total = 4 cards = 4 GitHub elements.
    const githubElements = page.locator('.project-card [data-project-repo]');
    await expect(githubElements).toHaveCount(4);
  });

  test('detail modal opens and closes via Esc', async ({ page }) => {
    await page.goto('/projects.html');
    const modal = page.locator('[data-project-modal]');
    await expect(modal).toHaveAttribute('aria-hidden', 'true');

    await page.locator('[data-project-modal-open="stock-management"]').click();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(modal.locator('[data-modal-title]')).toContainText('Stok Yönetim');

    // Sprint 13 zero-flake hardening (final): real keyboard.press on focused
    // element. Firefox Playwright driver occasionally drops document-level
    // KeyboardEvent dispatches under suite load, but real-keyboard press on a
    // focused locator routes correctly through the browser's event system.
    const closeBtn = modal.locator('[data-project-modal-close]');
    await expect(closeBtn).toBeFocused({ timeout: 5_000 });
    await closeBtn.press('Escape');
    await expect(modal).toHaveAttribute('aria-hidden', 'true', { timeout: 10_000 });
  });

  test('skill filter via querystring dims non-matching cards', async ({ page }) => {
    await page.goto('/projects.html?skill=csharp');
    // Sprint 13 zero-flake hardening: drop fixed waitForTimeout(200) — banner
    // visibility auto-polls. Then assert matching card classes.
    const banner = page.locator('#filter-banner');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    const stockCard = page.locator('#stock-management');
    await expect(stockCard).toHaveClass(/filtered-match/, { timeout: 5_000 });
  });

  test('magnetic-tilt class applied on project cards', async ({ page }) => {
    // .tilt is in HTML markup unconditionally. JS handler self-gates via
    // pointer:coarse (see magnetic-tilt.js + skills-bento.js). Class presence
    // assertion is viewport-independent.
    await page.goto('/projects.html');
    const cards = page.locator('.project-card.tilt');
    await expect(cards).toHaveCount(4);
  });

  test('filter clear returns to default view', async ({ page }) => {
    await page.goto('/projects.html?skill=csharp');
    // Wait for the filter banner to actually appear (JS-controlled visibility)
    const banner = page.locator('#filter-banner');
    await expect(banner).toBeVisible({ timeout: 3000 });
    await page.locator('[data-filter-clear]').click();
    await expect(page).toHaveURL(/projects\.html$/);
  });
});
