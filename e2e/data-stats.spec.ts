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
    await expect(page.getByRole('region', { name: /2026 World Champion/i })).toContainText('380 points include 31 from sprints');
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
