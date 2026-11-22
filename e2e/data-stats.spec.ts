import { test, expect } from '@playwright/test';

/** Wins, podiums and sprint points now come from results.json (they used to be empty). */
test.describe('Standings statistics', () => {
  test('Most wins and Most podiums are filled in', async ({ page }) => {
    await page.goto('/standings');
    const wins = page.locator('.standings-stat-card', { hasText: 'Most wins' });
    await expect(wins).toContainText('Kimi Antonelli');
    await expect(wins).toContainText('9 wins');
    const podiums = page.locator('.standings-stat-card', { hasText: 'Most podiums' });
    await expect(podiums).toContainText('Kimi Antonelli');
    await expect(podiums).toContainText('16');
  });

  test('the champion banner mentions the sprint points inside the total', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.getByRole('region', { name: /2026 World Champion/i })).toContainText('390 points include 31 from sprints');
  });

  test('data files agree: GP + sprint points equal the standings', async ({ request }) => {
    const results = await (await request.get('/data/results.json')).json();
    const standings = await (await request.get('/data/standings.json')).json();
    const total: Record<string, number> = {};
    for (const race of Object.values<any>(results.races)) {
      for (const r of race.results) total[r.code] = (total[r.code] ?? 0) + (r.points ?? 0);
      for (const r of race.sprint ?? []) total[r.code] = (total[r.code] ?? 0) + r.points;
    }
    for (const d of standings.drivers) expect(total[d.code] ?? 0, d.code).toBe(d.points);
  });
});

test.describe('Constructors title (Mercedes, decided at the São Paulo Grand Prix)', () => {
  test('constructors tab shows the champion banner and a shareable card', async ({ page }) => {
    await page.goto('/standings?tab=constructors');
    const banner = page.getByRole('region', { name: /Mercedes.*Constructors' Champion/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('3 races to spare');
    await banner.getByRole('button', { name: /Share constructors' card/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('canvas')).toBeVisible();
    const download = dialog.getByRole('button', { name: /Download PNG/i });
    await expect(download).toBeEnabled();
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(file.suggestedFilename()).toMatch(/mercedes.*constructors-champion\.png$/);
  });

  test('dashboard calls Mercedes the constructors champion', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: /Mercedes.*Constructors' Champion/i })).toBeVisible();
  });

  test('race data: São Paulo is complete and Las Vegas is next', async ({ request }) => {
    const results = await (await request.get('/data/results.json')).json();
    const race = results.races['22'];
    expect(race.results).toHaveLength(22);
    expect(race.results[0]).toMatchObject({ code: 'NOR', points: 25 });
    expect(race.results.find((r: any) => r.code === 'LAW').pos).toBe(7); // final classification, after the Leclerc penalty
    expect(race.results.find((r: any) => r.code === 'LEC').pos).toBe(8);
    const cal = await (await request.get('/data/calendar.json')).json();
    expect(cal.races.find((r: any) => r.round === 23).status).toBe('next');
  });
});
