import { test, expect } from '@playwright/test';

/**
 * Standings visual + regression checks at each configured viewport.
 */
test.describe('Standings', () => {
  test('renders driver and constructor tabs', async ({ page }) => {
    await page.goto('/standings');
    await expect(
      page.getByRole('heading', { name: /2026 Championship Standings/i })
    ).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Drivers' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Constructors' })).toBeVisible();
  });

  test('driver search filters rows', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.getByRole('tab', { name: 'Drivers' })).toBeVisible();

    const search = page.getByLabel(/search drivers/i);
    await search.fill('verstappen');
    await expect(page.getByText('Max Verstappen').first()).toBeVisible();

    await search.fill('');
    await expect(page.getByText('No drivers match')).not.toBeVisible();
  });

  test('constructor details dialog opens and closes with Escape', async ({ page }) => {
    await page.goto('/standings');
    await page.getByRole('tab', { name: 'Constructors' }).click();
    await expect(page.getByText(/Championship leader/i).first()).toBeVisible();

    const detailBtn = page
      .getByRole('button', { name: /View details for/i })
      .first();
    await detailBtn.click();

    const dialog = page.locator('[data-standings-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('points progression chart renders', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.getByText(/Points progression/i).first()).toBeVisible();

    const chart = page.locator('[role="img"]').first();
    await expect(chart).toBeVisible();
  });

  test('no horizontal overflow on mobile viewports', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.getByRole('tab', { name: 'Drivers' })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
