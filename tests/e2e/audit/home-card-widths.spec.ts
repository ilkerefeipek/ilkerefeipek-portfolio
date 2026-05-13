import { test, expect } from '@playwright/test';

// Sprint 15: ensure the two 3-card grids on home (.capabilities-grid used by
// both "What I build" and "By the numbers" sections) render equal-width
// columns. Pre-fix bug: `repeat(3, 1fr)` = `minmax(auto, 1fr)` let the first
// card expand to its content's min-content width (long descriptor / wide
// counter glyph), making it visibly wider than the other two.
// Post-fix: `repeat(3, minmax(0, 1fr))` forces equal columns.

test.describe('Home 3-card grids — equal widths (Sprint 15)', () => {
  test('Capabilities + Metrics: both .capabilities-grid blocks have 3 equal-width cards', async ({ page }, testInfo) => {
    // Sprint 9 config: this spec runs on chromium-desktop only (audit folder).
    // At ≥768px viewport the 3-column grid is active.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const grids = page.locator('.capabilities-grid');
    await expect(grids).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const grid = grids.nth(i);
      const cards = grid.locator('> .card');
      await expect(cards).toHaveCount(3);

      const widths = await cards.evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().width)
      );
      expect(widths).toHaveLength(3);

      // Max-min spread must be < 2px (sub-pixel tolerance). The pre-fix bug
      // produced spreads in the 50-100px range; post-fix should be near 0.
      const spread = Math.max(...widths) - Math.min(...widths);
      expect(spread, `grid #${i} card width spread (${widths.map((w) => w.toFixed(2)).join(', ')})`).toBeLessThan(2);
    }
  });
});
