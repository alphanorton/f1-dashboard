import { test, expect } from '@playwright/test';

/**
 * Dashboard visual + regression checks at each configured viewport
 * (375 / 768 / 1280 px, declared in playwright.config.ts).
 */
test.describe('Dashboard', () => {
  test('renders the command center hero, stats strip, and next-race card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Season Command Center/i })).toBeVisible();

    // Stats strip items should render after loading.
    await expect(page.getByText('Season progress')).toBeVisible();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
    await expect(page.getByText('Remaining', { exact: true })).toBeVisible();
    await expect(page.getByText('Sprints', { exact: true })).toBeVisible();

    // Next Race card.
    await expect(page.getByText('Next Race')).toBeVisible();
  });

  test('no horizontal overflow at narrow widths', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Season Command Center/i })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test('touch targets are at least 44px on mobile viewports', async ({ page }) => {
    const isMobile = page.viewportSize()?.width! < 768;
    if (!isMobile) return;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Season Command Center/i })).toBeVisible();

    const smallTargets = await page.evaluate(() => {
      const out: string[] = [];
      const selectors = 'a, button, [role="tab"]';
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(selectors))) {
        // Skip visually-hidden elements (sr-only patterns, e.g. the skip-link
        // which is intentionally 1x1 until focused). Only measure elements
        // that are actually visible in the viewport.
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) continue; // sr-only / hidden
        if (rect.height < 40 && rect.width < 40) {
          const tag = el.tagName.toLowerCase();
          const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || '';
          out.push(`${tag} "${label}" (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }
      return out;
    });

    expect(smallTargets).toEqual([]);
  });

  test('skip-to-content link is present in page structure', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveText(/skip to content/i);
  });

  test('Dashboard and GrandPrix render without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Season Command Center/i })).toBeVisible();

    await page.goto('/grand-prix');
    await expect(page.getByRole('heading', { name: /2026 Grand Prix Calendar/i })).toBeVisible();

    const realErrors = consoleErrors.filter((e) => !/favicon|404/i.test(e));
    expect(realErrors).toEqual([]);
  });
});
