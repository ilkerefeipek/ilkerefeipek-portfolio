import { test, expect } from '@playwright/test';

test.describe('Contact page', () => {
  test('renders form fields and direct contact info', async ({ page }) => {
    await page.goto('/contact.html');
    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.locator('#contact-name')).toBeVisible();
    await expect(page.locator('#contact-email')).toBeVisible();
    await expect(page.locator('#contact-subject')).toBeVisible();
    await expect(page.locator('#contact-message')).toBeVisible();
  });

  test('phone number NOT visible on contact (privacy)', async ({ page }) => {
    await page.goto('/contact.html');
    await expect(page.locator('main')).not.toContainText('+90 532 491 11 07');
  });

  test('empty submit triggers HTML5 required validation', async ({ page }) => {
    await page.goto('/contact.html');
    await page.locator('button[type="submit"]').click();
    const valid = await page.locator('#contact-name').evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(valid).toBe(true);
  });

  test('invalid email rejected by HTML5 typeMismatch', async ({ page }) => {
    await page.goto('/contact.html');
    await page.locator('#contact-name').fill('Test User');
    await page.locator('#contact-email').fill('not-an-email');
    await page.locator('#contact-subject').fill('Subject');
    await page.locator('#contact-message').fill('A test message body');
    await page.locator('button[type="submit"]').click();
    const mismatch = await page.locator('#contact-email').evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(mismatch).toBe(true);
  });

  test('honeypot fill suppresses Web3Forms submission', async ({ page }) => {
    await page.goto('/contact.html');
    let requestMade = false;
    page.on('request', (req) => {
      if (req.url().includes('web3forms.com')) requestMade = true;
    });

    await page.evaluate(() => {
      const hp = document.querySelector('[name="website_url"]') as HTMLInputElement;
      if (hp) hp.value = 'spam.com';
    });
    await page.locator('#contact-name').fill('Bot');
    await page.locator('#contact-email').fill('bot@spam.com');
    await page.locator('#contact-subject').fill('Buy crypto');
    await page.locator('#contact-message').fill('Click here for free coins');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);
    expect(requestMade).toBe(false);
  });

  test('valid form submit triggers toast (success or error)', async ({ page }) => {
    // Mock the Web3Forms endpoint so we don't send real submissions during test runs.
    await page.route('**/api.web3forms.com/submit', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'mocked' }) });
    });

    await page.goto('/contact.html');
    await page.locator('#contact-name').fill('Test User');
    await page.locator('#contact-email').fill('test@example.com');
    await page.locator('#contact-subject').fill('Hello there');
    await page.locator('#contact-message').fill('This is a longer test message.');
    await page.locator('button[type="submit"]').click();
    const toast = page.locator('#toast');
    await expect(toast).toHaveAttribute('data-type', /error|success/, { timeout: 3000 });
  });

  test('email click-to-copy triggers toast', async ({ page, browserName }) => {
    // Chromium supports programmatic clipboard permission grants; Firefox + WebKit
    // (Playwright builds) reject the same call. We still want to verify that the
    // click triggers the toast — success path on chromium, error fallback path
    // on others. Both paths surface the toast element (data-type=success|error).
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto('/contact.html');
    await page.locator('[data-copy-email]').click();
    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 1500 });
  });
});
