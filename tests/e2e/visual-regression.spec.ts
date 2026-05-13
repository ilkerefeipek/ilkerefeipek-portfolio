import { test, expect } from '@playwright/test';

const PAGES = [
  { url: '/',              name: 'home' },
  { url: '/about.html',    name: 'about' },
  { url: '/skills.html',   name: 'skills' },
  { url: '/projects.html', name: 'projects' },
  { url: '/cv.html',       name: 'cv' },
  { url: '/contact.html',  name: 'contact' },
  { url: '/404.html',      name: 'notfound' },
];

for (const p of PAGES) {
  test(`screenshot: ${p.name}`, async ({ page }, testInfo) => {
    await page.goto(p.url);
    // Disable animations for deterministic snapshot — set reduced-motion media
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    const viewportSlug = testInfo.project.name.replace('chromium-', '');
    await expect(page).toHaveScreenshot(`${p.name}-${viewportSlug}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
}
