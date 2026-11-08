import { test, expect } from '@playwright/test';

test.describe('Form guide (replaces the old race prediction)', () => {
  test('shows real recent results for the top six, with no prediction wording', async ({ page }) => {
    await page.goto('/');
    const guide = page.getByRole('region', { name: /Form guide/i });
    await expect(guide).toBeVisible();
    await expect(guide.getByText(/Race results · no prediction/i)).toBeVisible();
    await expect(page.getByText(/Predicted winner|Race Prediction|Model output/i)).toHaveCount(0);

    const rows = guide.getByRole('list', { name: /Form of the top six/i }).locator(':scope > li');
    await expect(rows).toHaveCount(6);
    // every row has one chip per Grand Prix in the window
    const first = rows.first().getByRole('list', { name: /last 5 Grand Prix finishes/i }).locator(':scope > li');
    await expect(first).toHaveCount(5);
  });

  test('lists the next circuit facts from circuits.json', async ({ page }) => {
    await page.goto('/');
    const guide = page.getByRole('region', { name: /Form guide/i });
    await expect(guide.getByText('Length')).toBeVisible();
    await expect(guide.getByText('Lap record')).toBeVisible();
  });

  test('glass is limited to bars, the next-race text block and dialogs (tables stay opaque)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header.lg-bar')).toBeVisible();
    await page.goto('/standings');
    await expect(page.locator('table').first()).toBeVisible();
    const tableFilter = await page.locator('table').first().evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(tableFilter === 'none' || tableFilter === '').toBe(true);
  });
});
