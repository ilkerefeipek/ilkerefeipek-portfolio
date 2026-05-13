import { test, expect } from '@playwright/test';

const PAGES = ['/', '/about.html', '/skills.html', '/projects.html', '/cv.html', '/contact.html', '/404.html'];

test.describe('Dead link scanner', () => {
  test('all unique internal links across all pages resolve 200', async ({ page, request }, testInfo) => {

    const collected = new Set<string>();
    for (const url of PAGES) {
      await page.goto(url);
      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors
          .filter((a) => !a.hasAttribute('data-placeholder'))
          .map((a) => a.getAttribute('href'))
          .filter((h): h is string => Boolean(h))
          .filter((h) => !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('#'))
      );
      for (const h of hrefs) {
        if (!/^https?:\/\//.test(h) || h.startsWith('http://127.0.0.1')) {
          // Normalize to absolute. Treat "/" as "/index.html" since python's http.server
          // returns directory listing for "/" without an index, but we DO have index.html.
          const normalized = h === '/' ? '/index.html' : h;
          const abs = normalized.startsWith('http')
            ? normalized
            : new URL(normalized, `http://127.0.0.1:8765${url}`).toString();
          collected.add(abs);
        }
      }
    }

    const fetchOnce = async (url: string): Promise<number> => {
      const res = await request.get(url).catch(() => null);
      return res ? res.status() : 0;
    };

    const failed: string[] = [];
    for (const target of collected) {
      // Sequential. Python http.server is single-threaded; one retry covers transient resets.
      let status = await fetchOnce(target);
      if (status === 0 || status >= 500) {
        await new Promise((r) => setTimeout(r, 200));
        status = await fetchOnce(target);
      }
      if (status >= 400 || status === 0) failed.push(`${target} → ${status}`);
    }
    expect(failed).toEqual([]);
  });
});
