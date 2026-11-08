import { test, expect } from '@playwright/test';

/**
 * 2026 champion presentation (Antonelli, clinched at round 21) and the URL-synced
 * UX added to Standings and Track Map. Runs at each configured viewport.
 */
test.describe('Champion on Standings', () => {
  test('hero banner names the champion with season stats', async ({ page }) => {
    await page.goto('/standings');
    const hero = page.getByRole('region', { name: /2026 World Champion/i });
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 2, name: /Kimi Antonelli/i })).toBeVisible();
    await expect(hero.getByText('GP wins')).toBeVisible();
    await expect(hero.getByText('Podiums')).toBeVisible();
    await expect(hero.getByText(/races to spare/i)).toBeVisible();
  });

  test('podium and table mark the leader as Champion', async ({ page }) => {
    await page.goto('/standings');
    const podium = page.getByRole('region', { name: /Drivers' championship podium/i });
    await expect(podium.getByText('Champion', { exact: true })).toBeVisible();
    const row = page.locator('tr.champ-row');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Kimi Antonelli');
  });

  test('progression chart marks where the title was clinched', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.getByText(/Points progression/i).first()).toBeVisible();
    await expect(page.getByText('Title clinched').first()).toBeVisible();
    await expect(page.getByText(/· Champion/).first()).toBeVisible();
  });

  test('dashboard leader card says Champion', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Champion', { exact: true }).first()).toBeVisible();
  });
});

test.describe('Standings URL and keyboard UX', () => {
  test('active tab is kept in the URL and survives reload', async ({ page }) => {
    await page.goto('/standings');
    await page.getByRole('tab', { name: 'Constructors' }).click();
    await expect(page).toHaveURL(/tab=constructors/);
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Drivers' }).click();
    await expect(page).not.toHaveURL(/tab=/);
  });

  test('deep link opens the teammates tab', async ({ page }) => {
    await page.goto('/standings?tab=teammates');
    await expect(page.getByRole('tab', { name: 'Teammates' })).toHaveAttribute('aria-selected', 'true');
  });

  test('slash focuses search and Escape clears it', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard shortcut is for desktop');
    await page.goto('/standings');
    await expect(page.getByRole('tab', { name: 'Drivers' })).toBeVisible();
    await page.keyboard.press('/');
    const search = page.getByLabel(/search drivers/i);
    await expect(search).toBeFocused();
    await search.fill('hamilton');
    await expect(page.getByRole('status')).toContainText('of');
    await page.keyboard.press('Escape');
    await expect(search).toHaveValue('');
  });
});

test.describe('Belgium track map', () => {
  test('circuit data points Spa at a real PNG, not a placeholder', async ({ request }) => {
    const res = await request.get('/data/circuits.json');
    const spa = (await res.json()).circuits.find((c: { id: string }) => c.id === 'spa');
    expect(spa.trackMapUrl).toMatch(/spa\.png$/);
    const img = await request.get(spa.trackMapUrl);
    expect(img.ok()).toBeTruthy();
    expect(img.headers()['content-type']).toContain('image/png');
  });

  test('deep link shows Spa and draws its traced layout', async ({ page }) => {
    await page.goto('/track-map?circuit=spa');
    await expect(page.locator('#circuit-select')).toHaveValue('spa');
    const map = page.getByRole('img', { name: /Interactive circuit map of .*Spa-Francorchamps/i });
    await expect(map).toBeVisible();
    // the traced layout is drawn: the SVG must contain a real, non-empty path
    const len = await map.locator('path').first().evaluate((el: SVGPathElement) => el.getTotalLength());
    expect(len).toBeGreaterThan(100);
  });

  test('next and previous buttons change the circuit in the URL', async ({ page }) => {
    await page.goto('/track-map?circuit=spa');
    await page.getByRole('button', { name: 'Next circuit' }).click();
    await expect(page).not.toHaveURL(/circuit=spa/);
    await page.getByRole('button', { name: 'Previous circuit' }).click();
    await expect(page).toHaveURL(/circuit=spa/);
  });
});

test.describe('Share card, constructors banner and track crowns', () => {
  test('share dialog draws the card and downloads a PNG', async ({ page }) => {
    await page.goto('/standings');
    await page.getByRole('button', { name: /Share champion card/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('canvas')).toBeVisible();
    const download = dialog.getByRole('button', { name: /Download PNG/i });
    await expect(download).toBeEnabled();
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(file.suggestedFilename()).toMatch(/kimi-antonelli.*world-champion\.png$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('constructors tab shows the title status (open now, banner once decided)', async ({ page }) => {
    await page.goto('/standings?tab=constructors');
    // Mercedes lead by 126 with up to 172 still on offer, so the title is open; this flips to the
    // gold "Constructors' Champion" banner by itself once the gap exceeds the points available.
    const status = page.getByRole('region', { name: /Constructors' title status|Constructors' Champion/i });
    await expect(status).toBeVisible();
  });

  test('track map marks circuits the champion won', async ({ page }) => {
    await page.goto('/track-map?circuit=spa');
    await expect(page.getByText(/Antonelli won here · R12/)).toBeVisible();
    await page.goto('/track-map?circuit=silverstone');
    await expect(page.getByRole('img', { name: /Interactive circuit map of .*Silverstone/i })).toBeVisible();
    await expect(page.getByText(/won here · R/)).toHaveCount(0);
  });

  test('crown legend counts the champion wins', async ({ page }) => {
    await page.goto('/track-map');
    await expect(page.getByText(/Crown marks circuits where Kimi Antonelli won in 2026 \(9\)/)).toBeVisible();
  });
});
