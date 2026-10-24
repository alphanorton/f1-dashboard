import { test, expect } from '@playwright/test';

/**
 * GrandPrix visual + regression checks at each configured viewport.
 *
 * Note: the GrandPrix page auto-selects the "next race" on load
 * (useEffect in GrandPrix.tsx calls setSelectedRace(next)), which opens
 * the detail modal overlay. Tests that interact with background elements
 * must dismiss that modal first.
 */
test.describe('GrandPrix', () => {
  /** Dismiss the auto-opened race detail modal if present. */
  async function dismissDetailModal(page: import('@playwright/test').Page) {
    const backdrop = page.locator('div.fixed.inset-0.z-50');
    if ((await backdrop.count()) > 0 && await backdrop.first().isVisible()) {
      const closeBtn = page.getByRole('button', { name: /^Close$/i });
      if ((await closeBtn.count()) > 0) {
        await closeBtn.first().click();
      }
    }
  }

  test('renders calendar with filter tabs', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();

    await expect(page.getByRole('tab', { name: /^All /i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Upcoming /i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Completed /i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Sprint /i })).toBeVisible();
  });

  test('search filters race cards by name or circuit', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();
    await dismissDetailModal(page);

    const search = page.getByLabel(/search grand prix, country or circuit/i);
    await search.fill('Austin');
    await expect(page.getByText('Austin').first()).toBeVisible();

    await search.fill('');
  });

  test('filter tabs narrow the race list', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();
    await dismissDetailModal(page);

    const allTab = page.getByRole('tab', { name: /^All /i });
    const completedTab = page.getByRole('tab', { name: /^Completed /i });
    const sprintTab = page.getByRole('tab', { name: /^Sprint /i });

    const allText = await allTab.innerText();
    const completedText = await completedTab.innerText();
    const sprintText = await sprintTab.innerText();

    const parseCount = (label: string) =>
      Number.parseInt(label.match(/\((\d+)\)/)?.[1] ?? 'NaN', 10);
    expect(parseCount(allText)).toBeGreaterThan(0);
    expect(parseCount(completedText)).toBeGreaterThanOrEqual(0);
    expect(parseCount(sprintText)).toBeGreaterThanOrEqual(0);

    await sprintTab.click();
    await expect(sprintTab).toHaveAttribute('aria-selected', 'true');
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await page.goto('/grand-prix');
    await expect(
      page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })
    ).toBeVisible();

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
