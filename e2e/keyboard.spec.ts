import { test, expect } from '@playwright/test';

/**
 * Keyboard navigation and accessibility checks.
 *
 * These run on each configured viewport project (375 / 768 / 1280) via
 * playwright.config.ts.
 */
test.describe('Keyboard & accessibility', () => {
  test('skip-to-content link exists and targets main content', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveText(/skip to content/i);

    // Verify the target id is present.
    const main = page.locator('#main');
    await expect(main).toBeAttached();
  });

  test('constructor detail dialog opens and closes with Escape', async ({ page }) => {
    await page.goto('/standings');
    await page.getByRole('tab', { name: 'Constructors' }).click();
    await expect(page.getByText(/Championship leader/i).first()).toBeVisible();

    const detailBtn = page.getByRole('button', { name: /View details for/i }).first();
    await detailBtn.click();

    const dialog = page.locator('[data-standings-dialog]');
    await expect(dialog).toBeVisible();

    const title = dialog.getByRole('heading', { level: 2 });
    await expect(title).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('GrandPrix filter tabs are keyboard accessible', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();

    // Dismiss the auto-opened detail modal so the tabs are reachable.
    const backdrop = page.locator('div.fixed.inset-0.z-50');
    if ((await backdrop.count()) > 0 && (await backdrop.first().isVisible())) {
      const closeBtn = page.getByRole('button', { name: /^Close$/i });
      if ((await closeBtn.count()) > 0) await closeBtn.first().click();
    }

    const sprintTab = page.getByRole('tab', { name: /^Sprint /i });
    await sprintTab.focus();
    await expect(sprintTab).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(sprintTab).toHaveAttribute('aria-selected', 'true');
  });

  test('GrandPrix detail dialog can be dismissed with the Close button', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();

    // The GrandPrix page auto-opens the next-race detail modal on load.
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    await expect(closeBtn.first()).toBeVisible();

    await closeBtn.first().click();
    await expect(closeBtn.first()).toBeHidden();
  });

  test('focus visible indicators appear on the skip link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main"]');
    await skipLink.focus();
    const focused = page.locator(':focus');
    const hasIndicator = await focused.evaluate((el) => {
      const cls = el.classList;
      return (
        Array.from(cls).some((c) => c.includes('focus-visible')) ||
        getComputedStyle(el).outlineWidth !== '0px'
      );
    });
    expect(hasIndicator).toBe(true);
  });
});
