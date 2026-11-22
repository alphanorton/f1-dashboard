import { test, expect } from '@playwright/test';

test.describe('Season timeline', () => {
  test('draws one segment per round with the right states and markers', async ({ page }) => {
    await page.goto('/');
    const tl = page.getByRole('region', { name: /Season timeline/i });
    await expect(tl).toBeVisible();
    await expect(tl.locator('.st-seg')).toHaveCount(25);
    await expect(tl.locator('.st-completed')).toHaveCount(20);
    await expect(tl.locator('.st-next')).toHaveCount(1);
    await expect(tl.locator('.st-cancelled')).toHaveCount(2);
    await expect(tl.locator('.st-seg:has(.st-sprint)')).toHaveCount(6);
    // the drivers' title was decided at round 21, the constructors' at round 22
    await expect(tl.locator('.st-seg:has(.st-crown)')).toHaveCount(2);
    await expect(tl.locator('.st-seg[data-round="21"] .st-crown')).toHaveCount(1);
    await expect(tl.locator('.st-seg[data-round="22"] .st-crown')).toHaveCount(1);
    await expect(tl).toContainText('20 of 23 races run');
  });

  test('selecting a segment shows its race and winner; the arrows step through rounds', async ({ page }) => {
    await page.goto('/');
    const tl = page.getByRole('region', { name: /Season timeline/i });
    await tl.locator('.st-seg[data-round="14"]').click();
    await expect(tl.getByRole('status')).toContainText('R14');
    await expect(tl.getByRole('status')).toContainText('Sprint');
    await expect(tl.getByRole('status')).toContainText('Won by');
    await tl.getByRole('button', { name: 'Next round' }).click();
    await expect(tl.getByRole('status')).toContainText('R15');
    await tl.getByRole('button', { name: 'Previous round' }).click();
    await tl.getByRole('button', { name: 'Previous round' }).click();
    await expect(tl.getByRole('status')).toContainText('R13');
  });

  test('segments are keyboard reachable and announce themselves', async ({ page }) => {
    await page.goto('/');
    const seg = page.getByRole('region', { name: /Season timeline/i }).locator('.st-seg[data-round="22"]');
    await seg.focus();
    await expect(seg).toHaveAttribute('aria-label', /Round 22, São Paulo Grand Prix, Completed, won by Lando Norris/i);
  });

  test('with reduced motion the strip is fully drawn immediately and nothing celebrates', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const fill = page.locator('.st-seg[data-round="1"] .st-fill');
    await expect(fill).toBeAttached();
    const t = await fill.evaluate((el) => getComputedStyle(el).transform);
    expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    expect(await page.locator('.cel-piece').count()).toBe(0);
    await ctx.close();
  });
});

test.describe('Champion celebration', () => {
  test('plays once per session, then stays quiet', async ({ page }) => {
    await page.goto('/standings');
    const layer = page.locator('.cel-layer').first();
    await expect(layer).toBeAttached();
    await expect.poll(async () => page.evaluate(() => window.sessionStorage.getItem('f1dash.celebrated.drivers-2026'))).toBe('1');
    await page.reload();
    await expect.poll(async () => page.locator('.cel-layer').first().getAttribute('data-celebration')).toBe('done');
    expect(await page.locator('.cel-piece').count()).toBe(0);
  });

  test('the celebration is decorative: hidden from assistive tech and not clickable', async ({ page }) => {
    await page.goto('/standings');
    const layer = page.locator('.cel-layer').first();
    await expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(await layer.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });
});
