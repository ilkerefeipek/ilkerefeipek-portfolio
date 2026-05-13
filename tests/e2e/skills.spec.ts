import { test, expect } from '@playwright/test';

test.describe('Skills page (sk-* nuclear rewrite — Sprint 4.8)', () => {
  test('renders 30 cells: 1 hero + 4 featured + 18 standard + 7 compact', async ({ page }) => {
    await page.goto('/skills.html');
    await expect(page.locator('.sk-cell--hero')).toHaveCount(1);
    await expect(page.locator('.sk-cell--featured')).toHaveCount(4);
    await expect(page.locator('.sk-cell--standard')).toHaveCount(18);
    await expect(page.locator('.sk-cell--compact')).toHaveCount(7);
    await expect(page.locator('.sk-cell')).toHaveCount(30);
  });

  test('Sprint 5 added skills present (PHP, Python, Java, Excel, Jira)', async ({ page }) => {
    await page.goto('/skills.html');
    for (const slug of ['php', 'python', 'java', 'excel', 'jira']) {
      await expect(page.locator(`.sk-cell[data-skill="${slug}"]`)).toHaveCount(1);
    }
  });

  test('hero is C# with logo + name + descriptor + 3 chips (no stars)', async ({ page }) => {
    await page.goto('/skills.html');
    const hero = page.locator('.sk-cell--hero');
    await expect(hero).toHaveAttribute('data-skill', 'csharp');
    await expect(hero.locator('.sk-name')).toHaveText('C#');
    await expect(hero.locator('.sk-logo')).toBeVisible();
    await expect(hero.locator('.sk-desc')).toBeVisible();
    await expect(hero.locator('.sk-chip')).toHaveCount(3);
  });

  test('featured cells are .NET Core, ASP.NET MVC, SQL Server, EF Core (Alt A)', async ({ page }) => {
    await page.goto('/skills.html');
    const slugs = await page.locator('.sk-cell--featured').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.skill || '')
    );
    expect(slugs.sort()).toEqual(['aspnet-mvc', 'dotnet', 'ef-core', 'mssql']);
  });

  test('cell head uses flex space-between (logo TL + eyebrow TR)', async ({ page }) => {
    await page.goto('/skills.html');
    const featured = page.locator('.sk-cell--featured').first();
    const head = featured.locator('.sk-cell-head');
    const display = await head.evaluate((el) => getComputedStyle(el).display);
    const justify = await head.evaluate((el) => getComputedStyle(el).justifyContent);
    expect(display).toBe('flex');
    expect(justify).toBe('space-between');
  });

  test('logo and eyebrow are on same row in featured cells (anatomy guarantee)', async ({ page }) => {
    await page.goto('/skills.html');
    const cells = page.locator('.sk-cell--featured');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const logoTop = await cell.locator('.sk-logo').evaluate((el) => el.getBoundingClientRect().top);
      const eyebrowTop = await cell.locator('.sk-eyebrow').evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(logoTop - eyebrowTop)).toBeLessThan(8);
    }
  });

  test('EF Core icon is unique from .NET Core (no duplicate src)', async ({ page }) => {
    await page.goto('/skills.html');
    const efSrc = await page.locator('.sk-cell[data-skill="ef-core"] .sk-logo').getAttribute('src');
    const dnSrc = await page.locator('.sk-cell[data-skill="dotnet"] .sk-logo').getAttribute('src');
    expect(efSrc).not.toBe(dnSrc);
  });

  test('animated gradient border applied to featured cells (::before pseudo)', async ({ page }) => {
    await page.goto('/skills.html');
    const dotnet = page.locator('.sk-cell--featured[data-skill="dotnet"]');
    const beforeContent = await dotnet.evaluate((el) =>
      getComputedStyle(el, '::before').getPropertyValue('content')
    );
    expect(beforeContent).not.toBe('none');
  });

  test('15 certificates listed', async ({ page }) => {
    await page.goto('/skills.html');
    await expect(page.locator('.certificate-item')).toHaveCount(15);
  });

  test('5 soft-skill cards rendered', async ({ page }) => {
    await page.goto('/skills.html');
    await expect(page.locator('.soft-skills-grid .card')).toHaveCount(5);
  });

  test('click a cell navigates to projects.html with skill query', async ({ page }) => {
    // <a href> native navigation — viewport-independent.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/skills.html');
    await page.locator('.sk-cell--hero').click();
    await expect(page).toHaveURL(/projects\.html\?skill=csharp/);
  });

  test('bento grid columns per viewport', async ({ page }, testInfo) => {
    await page.goto('/skills.html');
    const grid = page.locator('[data-sk-grid]');
    await expect(grid).toBeVisible();
    const hero = page.locator('.sk-cell--hero');
    const heroBox = await hero.boundingBox();
    const gridBox = await grid.boundingBox();
    if (!heroBox || !gridBox) throw new Error('grid/hero not measurable');
    const ratio = heroBox.width / gridBox.width;
    const name = testInfo.project.name;
    if (name === 'chromium-mobile') {
      // ≤767px: 2-col grid + hero overrides to span 2 → full row, ratio ≈ 1.0
      expect(ratio).toBeGreaterThan(0.9);
    } else if (name === 'chromium-tablet') {
      // 768-1023px: 3-col grid (container @media), hero default span 2 → ~2/3
      expect(ratio).toBeGreaterThan(0.55);
      expect(ratio).toBeLessThan(0.8);
    } else {
      // Desktop/firefox/webkit (≥1440px): 5-col grid, hero spans 2 → ratio ≈ 0.4
      expect(ratio).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(0.55);
    }
  });

  test('reduced-motion: animated border + transitions disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/skills.html');
    const featured = page.locator('.sk-cell--featured').first();
    const animationName = await featured.evaluate((el) =>
      getComputedStyle(el, '::before').animationName
    );
    expect(animationName).toBe('none');
  });

  test('no legacy bento-* or hex-* classes in DOM', async ({ page }) => {
    await page.goto('/skills.html');
    const legacy = await page.evaluate(() => ({
      bentoCell: document.querySelectorAll('.bento-cell').length,
      bentoIcon: document.querySelectorAll('.bento-icon').length,
      bentoName: document.querySelectorAll('.bento-name').length,
      bentoMeta: document.querySelectorAll('.bento-meta').length,
      hex: document.querySelectorAll('.hex').length,
      skillsHexStack: document.querySelectorAll('.skills-hex-stack').length,
    }));
    expect(legacy.bentoCell).toBe(0);
    expect(legacy.bentoIcon).toBe(0);
    expect(legacy.bentoName).toBe(0);
    expect(legacy.bentoMeta).toBe(0);
    expect(legacy.hex).toBe(0);
    expect(legacy.skillsHexStack).toBe(0);
  });
});
