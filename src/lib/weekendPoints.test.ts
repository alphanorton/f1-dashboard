import { gpPoints, sprintPoints, weekendPoints, seasonTotals } from './weekendPoints.ts';
import type { WeekendBlock } from './weekendPoints.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };

const sprintWeekend: WeekendBlock = {
  results: [{ code: 'AAA', points: 25 }, { code: 'BBB', points: 18 }, { code: 'CCC', points: 0 }],
  sprint: [{ code: 'BBB', points: 8 }, { code: 'AAA', points: 7 }],
};
const normalWeekend: WeekendBlock = { results: [{ code: 'AAA', points: 18 }, { code: 'BBB', points: 25 }] };

test('grand prix and sprint points are separate', () => {
  eq(gpPoints(sprintWeekend, 'AAA'), 25); eq(sprintPoints(sprintWeekend, 'AAA'), 7);
});
test('a weekend is the sum of both', () => { eq(weekendPoints(sprintWeekend, 'BBB'), 26); });
test('no sprint block means no sprint points', () => { eq(sprintPoints(normalWeekend, 'AAA'), 0); eq(weekendPoints(normalWeekend, 'AAA'), 18); });
test('a driver who scored only in the sprint still gets the points', () => {
  const b: WeekendBlock = { results: [{ code: 'AAA', points: 25 }], sprint: [{ code: 'ZZZ', points: 3 }] };
  eq(weekendPoints(b, 'ZZZ'), 3);
});
test('null points count as zero', () => { eq(gpPoints({ results: [{ code: 'AAA', points: null }] }, 'AAA'), 0); });
test('season totals split grand prix and sprint points', () => {
  const t = seasonTotals([sprintWeekend, normalWeekend]);
  eq(t.get('AAA')?.gp, 43); eq(t.get('AAA')?.sprint, 7); eq(t.get('AAA')?.total, 50);
  eq(t.get('BBB')?.total, 18 + 8 + 25);
  eq(t.get('CCC')?.total, 0);
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
