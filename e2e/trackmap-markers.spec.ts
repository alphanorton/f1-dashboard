import { test, expect } from '@playwright/test';

test.describe('Track map markers and lap direction', () => {
  test('bend markers carry no turn numbers and the page says so', async ({ page }) => {
    await page.goto('/track-map?circuit=spa');
    const map = page.getByRole('img', { name: /Interactive circuit map of .*Spa-Francorchamps/i });
    await expect(map).toBeVisible();
    expect(await page.locator('.tmx-corner').count()).toBeGreaterThan(3);
    await expect(page.locator('.tmx-chiptxt')).toHaveCount(0);
    await expect(page.getByText(/dots are detected bends, not official turn numbers/i)).toBeVisible();
    await expect(page.getByText(/of 19 turns documented/i)).toBeVisible();
  });

  test('no start/finish label is drawn at the arbitrary start of the traced line', async ({ page }) => {
    await page.goto('/track-map?circuit=spa');
    await expect(page.getByRole('img', { name: /Interactive circuit map/i })).toBeVisible();
    await expect(page.locator('.tmx-sflabel')).toHaveCount(0);
  });

  test('every traced outline records its lap direction (anti-clockwise circuits were reversed)', async ({ request }) => {
    const paths = await (await request.get('/data/track-paths.json')).json();
    for (const slug of ['baku', 'cota', 'interlagos', 'las_vegas', 'miami', 'singapore', 'yas_marina']) {
      expect(paths[slug].lapDirection, slug).toBe('anticlockwise');
    }
    for (const slug of ['monza', 'spa', 'silverstone', 'monaco', 'losail', 'madrid']) {
      expect(paths[slug].lapDirection, slug).toBe('clockwise');
    }
  });
});
