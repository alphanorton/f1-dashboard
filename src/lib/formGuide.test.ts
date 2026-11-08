import { computeFormGuide } from './formGuide.ts';
import type { FormResultsData, FormStandingDriver, FormCalendarRace } from './formGuide.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };

const DRIVERS: FormStandingDriver[] = [
  { position: 1, code: 'AAA', name: 'Alice', team: 'T', points: 100 },
  { position: 2, code: 'BBB', name: 'Bob', team: 'T', points: 80 },
  { position: 3, code: 'CCC', name: 'Cara', team: 'T', points: 40 },
];
// 7 races; BBB skips round 6, CCC retires in round 7, AAA is lapped out of the points in round 5
const races: FormResultsData['races'] = {};
for (let r = 1; r <= 7; r++) {
  races[String(r)] = {
    round: r, name: `R${r}`, circuit: 'C',
    results: [
      { pos: r === 5 ? 12 : 1, code: 'AAA', status: 'Finished', points: r === 5 ? 0 : 25 },
      ...(r === 6 ? [] : [{ pos: 2, code: 'BBB', status: 'Finished', points: 18 }]),
      r === 7 ? { pos: null, code: 'CCC', status: 'DNF', points: 0 } : { pos: 3, code: 'CCC', status: 'Finished', points: 15 },
    ],
  };
}
const CAL: FormCalendarRace[] = [
  { round: 7, name: 'R7', circuit: 'C', status: 'completed' },
  { round: 8, name: 'R8', circuit: 'Next', status: 'next' },
  { round: 9, name: 'R9', circuit: 'Later', status: 'upcoming' },
];
const guide = computeFormGuide({ drivers: DRIVERS, results: { races }, calendar: CAL });

test('uses only the last 5 completed races, oldest first', () => {
  eq(guide.rounds.map((r) => r.round).join(','), '3,4,5,6,7');
  eq(guide.rows[0].chips.length, 5);
});
test('rows follow championship order and respect the limit', () => {
  eq(guide.rows.map((r) => r.code).join(''), 'AAABBBCCC');
  eq(computeFormGuide({ drivers: DRIVERS, results: { races }, calendar: CAL, limit: 2 }).rows.length, 2);
});
test('next race is the one flagged next', () => { eq(guide.nextRace?.round, 8); });
test('chips are classified: win, points, out of the points', () => {
  const a = guide.rows[0].chips;
  eq(a[0].kind, 'p1'); eq(a[2].kind, 'other'); eq(a[2].label, 'P12');
});
test('a race the driver did not take part in keeps the column but is blank', () => {
  const b = guide.rows[1].chips; // rounds 3..7, BBB absent in round 6 (index 3)
  eq(b[3].label, '–'); eq(b[3].kind, 'other');
});
test('DNF is shown and counted; DNS is not counted as a retirement', () => {
  const c = guide.rows[2];
  eq(c.chips[4].kind, 'dnf'); eq(c.dnfs, 1);
});
test('average finish ignores retirements and absences', () => {
  eq(guide.rows[2].avgFinish, 3);          // CCC: P3 in 4 races, DNF in the 5th
  eq(guide.rows[1].avgFinish, 2);          // BBB: P2 in 4 races, absent once
  eq(guide.rows[0].avgFinish, (1 + 1 + 12 + 1 + 1) / 5);
});
test('form points sum Grand Prix points inside the window only', () => {
  eq(guide.rows[0].formPoints, 25 * 4);    // rounds 3,4,6,7; round 5 scored 0
  eq(guide.rows[1].formPoints, 18 * 4);
  eq(guide.rows[0].sprintPoints, 0);
});
test('sprint points inside the window are included, sprints outside it are not', () => {
  const withSprints = JSON.parse(JSON.stringify(races)) as typeof races;
  withSprints['4'].sprint = [{ code: 'BBB', points: 8 }, { code: 'AAA', points: 7 }]; // inside (rounds 3-7)
  withSprints['1'].sprint = [{ code: 'AAA', points: 8 }];                              // outside
  const g = computeFormGuide({ drivers: DRIVERS, results: { races: withSprints }, calendar: CAL });
  eq(g.rows[0].formPoints, 25 * 4 + 7); eq(g.rows[0].sprintPoints, 7);
  eq(g.rows[1].formPoints, 18 * 4 + 8); eq(g.rows[1].sprintPoints, 8);
  eq(g.rows[2].sprintPoints, 0);
});
test('wins and podiums are counted inside the window', () => {
  eq(guide.rows[0].wins, 4); eq(guide.rows[0].podiums, 4);
  eq(guide.rows[2].podiums, 4);
});
test('a driver with no classified finish has no average', () => {
  const g = computeFormGuide({
    drivers: [DRIVERS[2]],
    results: { races: { '1': { round: 1, name: 'R1', circuit: 'C', results: [{ pos: null, code: 'CCC', status: 'DNF', points: 0 }] } } },
    calendar: [],
  });
  eq(g.rows[0].avgFinish, null); eq(g.nextRace, null);
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
