import { test, expect } from '@playwright/test';

const EXPECTED_REPOS = [
  {
    project: 'Stock Management',
    cardId: 'stock-management',
    url: 'https://github.com/ilkerefeipek/proje1',
  },
  {
    project: 'E-Commerce DB',
    cardId: 'ecommerce-db',
    url: 'https://github.com/ilkerefeipek/proje2',
  },
  {
    project: 'Event Registration',
    cardId: 'event-registration',
    url: 'https://github.com/ilkerefeipek/proje3',
  },
];

test.describe('project repo links — Sprint 12', () => {
  for (const { project, cardId, url } of EXPECTED_REPOS) {
    test(`${project}: anchor href + target + rel correct`, async ({ page }) => {
      await page.goto('/projects.html');
      // injectLinks runs inside initI18n bootstrap; wait for placeholder → anchor swap
      await page.waitForFunction(
        (id) => {
          const card = document.getElementById(id);
          if (!card) return false;
          return !!card.querySelector('a[href*="github.com"]');
        },
        cardId,
        { timeout: 5000 }
      );

      const card = page.locator(`#${cardId}`);
      const repoLink = card.locator('a[href*="github.com"]').first();

      await expect(repoLink).toHaveAttribute('href', url);
      await expect(repoLink).toHaveAttribute('target', '_blank');
      const rel = await repoLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  }
});
