import { test, expect } from '@playwright/test';

test('find overflowing elements', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
      const rect = el.getBoundingClientRect();
      if (rect.right > clientWidth + 1) {
        const cls = el.className?.toString().slice(0, 80) ?? '';
        const id = el.id ? `#${el.id}` : '';
        offenders.push(`${el.tagName.toLowerCase()}${id} (${Math.round(rect.right)}px) class="${cls}"`);
      }
    }
    return {
      clientWidth,
      scrollWidth: doc.scrollWidth,
      offenders: offenders.slice(0, 20),
    };
  });

  console.log('CLIENT:', overflow.clientWidth, 'SCROLL:', overflow.scrollWidth);
  console.log('OFFENDERS:');
  for (const o of overflow.offenders) console.log(' ', o);
});
