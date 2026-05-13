import { test, expect } from '@playwright/test';

const LINKEDIN_URL = 'https://www.linkedin.com/in/ilker-efe-ipek-b261122b9/';

// Pages that contain a [data-placeholder="linkedin"] span (verified via grep).
// placeholderToAnchor in i18n.js auto-swaps these to <a> anchors when the URL
// is not 'PLACEHOLDER'.
const PAGES_WITH_LINKEDIN = [
  { url: '/about.html', label: 'about' },
  { url: '/contact.html', label: 'contact' },
  { url: '/index.html', label: 'home' },
  { url: '/projects.html', label: 'projects' },
  { url: '/skills.html', label: 'skills' },
];

test.describe('LinkedIn URL integration — Sprint 14', () => {
  for (const { url, label } of PAGES_WITH_LINKEDIN) {
    test(`${label}: linkedin anchor href + target + rel correct`, async ({ page }) => {
      await page.goto(url);
      // injectLinks runs inside initI18n bootstrap; wait for placeholder → anchor swap.
      await page.waitForFunction(
        () => !!document.querySelector('a[href*="linkedin.com"]'),
        null,
        { timeout: 5_000 }
      );

      const linkedinAnchor = page.locator('a[href*="linkedin.com"]').first();

      await expect(linkedinAnchor).toHaveAttribute('href', LINKEDIN_URL);
      await expect(linkedinAnchor).toHaveAttribute('target', '_blank');
      const rel = await linkedinAnchor.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  }
});
