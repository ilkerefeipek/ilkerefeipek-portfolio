import { test, expect } from '@playwright/test';

test.describe('About page', () => {
  test('renders bio + education + experience timeline', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.about-bio')).toBeVisible();
    await expect(page.locator('#education')).toBeVisible();
    await expect(page.locator('#experience')).toBeVisible();

    // Two internships in timeline (sibling of the H2 with id="experience")
    const items = page.locator('[data-experience-list] .timeline-item');
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText('Yazılım Marketi');
    await expect(items.nth(1)).toContainText('İnnosa Yazılım');
  });

  test('side meta card shows 4 languages and Rotaract club', async ({ page }) => {
    await page.goto('/about.html');
    const meta = page.locator('.about-meta-card');
    await expect(meta).toBeVisible();
    await expect(meta.locator('.language-pill')).toHaveCount(4);
    await expect(meta).toContainText('Rotaract');
  });

  test('TR/EN toggle changes content', async ({ page }) => {
    await page.goto('/about.html');
    // Force TR first to ensure baseline
    await page.locator('[data-lang-toggle][data-lang="tr"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('h1')).toContainText('Hakkımda');

    await page.locator('[data-lang-toggle][data-lang="en"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('h1')).toContainText('About');
  });

  test('localStorage persists language across reload', async ({ page }) => {
    await page.goto('/about.html');
    // Wait for i18n to be ready before toggling (avoids racing with bootstrap)
    await page.waitForFunction(() => typeof window.__i18n !== 'undefined', null, { timeout: 3000 });
    await page.locator('[data-lang-toggle][data-lang="en"]').click();
    // Wait for the toggle to actually apply (lang attribute reflects EN)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 1500 });
    // Verify localStorage was written
    const stored = await page.evaluate(() => localStorage.getItem('lang'));
    expect(stored).toBe('en');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('About');
  });

  test('avatar initials render gradient circle', async ({ page }) => {
    await page.goto('/about.html');
    const avatar = page.locator('.avatar-initials').first();
    await expect(avatar).toBeVisible();
    await expect(avatar).toContainText('İE');
  });

  test('phone NOT visible on about page (privacy)', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('body')).not.toContainText('+90 532 491 11 07');
  });
});
