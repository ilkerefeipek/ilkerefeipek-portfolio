import { test, expect } from '@playwright/test';

test.describe('CV scroll-state nav/controls flush — Sprint 14', () => {
  test('cv-controls top tracks nav-bar height on scroll (no visible gap)', async ({ page }) => {
    await page.goto('/cv.html');
    await page.waitForLoadState('networkidle');

    const navBar = page.locator('.nav-bar');
    const cvControls = page.locator('.cv-controls');

    // Initial state — both visible at top
    const initialNavRect = await navBar.boundingBox();
    const initialCtrlRect = await cvControls.boundingBox();
    expect(initialNavRect).not.toBeNull();
    expect(initialCtrlRect).not.toBeNull();
    // controls top should be flush with nav bottom within subpixel tolerance.
    // Negative values up to -1px are acceptable (subpixel overlap = perfect flush).
    // Large negative would indicate controls covering nav significantly (real bug).
    const initialGap = (initialCtrlRect!.y) - (initialNavRect!.y + initialNavRect!.height);
    expect(Math.abs(initialGap)).toBeLessThan(2);

    // Scroll past 80px → nav shrinks (.scrolled class added)
    await page.evaluate(() => window.scrollTo(0, 400));
    // Wait for scrolled padding transition (~300ms) + RAF settle
    await page.waitForTimeout(500);

    // Sample again
    const scrolledNavRect = await navBar.boundingBox();
    const scrolledCtrlRect = await cvControls.boundingBox();
    expect(scrolledNavRect).not.toBeNull();
    expect(scrolledCtrlRect).not.toBeNull();

    // After scroll, nav should be SHORTER (compressed padding)
    expect(scrolledNavRect!.height).toBeLessThan(initialNavRect!.height + 1);

    // CRITICAL: cv-controls should still be flush with shrunk nav bottom — no gap.
    // abs() catches both directions: positive gap (the original bug) AND large overlap.
    const scrolledGap = (scrolledCtrlRect!.y) - (scrolledNavRect!.y + scrolledNavRect!.height);
    expect(Math.abs(scrolledGap)).toBeLessThan(3);  // 3px tolerance for subpixel + transition settle
  });
});
