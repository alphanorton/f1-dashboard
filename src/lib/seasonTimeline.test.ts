import { buildSeasonTimeline, timelineSummary, titleDecisions } from './seasonTimeline.ts';
import type { TimelineCalendarRace, TimelineResults } from './seasonTimeline.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };

const cal: TimelineCalendarRace[] = [
  { round: 1, name: 'R1', status: 'completed' },
  { round: 2, name: 'R2', status: 'completed', isSprint: true },
  { round: 3, name: 'R3', status: 'cancelled' },
  { round: 4, name: 'R4', status: 'completed' },
  { round: 5, name: 'R5', status: 'next' },
  { round: 6, name: 'R6', status: 'upcoming' },
];
const row = (pos: number | null, code: string, team: string, points: number) => ({ pos, code, driver: code + ' Driver', team, status: 'Finished', points });
const results: TimelineResults = { races: {
  '1': { round: 1, results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'X', 18), row(3, 'CCC', 'Y', 15)] },
  '2': { round: 2, results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'X', 18), row(3, 'CCC', 'Y', 15)], sprint: [{ code: 'AAA', team: 'X', points: 8 }] },
  '4': { round: 4, results: [row(1, 'CCC', 'Y', 25), row(2, 'AAA', 'X', 18), row(3, 'BBB', 'X', 15)] },
} };

test('one segment per round, in order, with the right status', () => {
  const s = buildSeasonTimeline(cal, results);
  eq(s.map((x) => x.status).join(','), 'completed,completed,cancelled,completed,next,upcoming');
  eq(s[1].isSprint, true);
});
test('completed rounds are coloured by the winner, others have no winner', () => {
  const s = buildSeasonTimeline(cal, results);
  eq(s[0].winnerCode, 'AAA'); eq(s[0].winnerTeam, 'X'); eq(s[3].winnerCode, 'CCC'); eq(s[4].winnerCode, null); eq(s[2].winnerCode, null);
});
test('summary counts run, to go and cancelled rounds', () => {
  const m = timelineSummary(buildSeasonTimeline(cal, results));
  eq(m.run, 3); eq(m.toGo, 2); eq(m.cancelled, 1); eq(m.total, 5);
});
test('a title is decided once the lead beats the points still available', () => {
  // after R4: AAA 25+25+8+18 = 76, BBB 18+18+15 = 51 -> gap 25; two races left (R5, R6) = 50 points: still open
  const d = titleDecisions(cal, results);
  eq(d.drivers, null);
});
test('an early runaway leader decides the title at the first race that makes it certain', () => {
  const c2: TimelineCalendarRace[] = [
    { round: 1, name: 'R1', status: 'completed' }, { round: 2, name: 'R2', status: 'completed' }, { round: 3, name: 'R3', status: 'completed' },
    { round: 4, name: 'R4', status: 'upcoming' },
  ];
  const r2: TimelineResults = { races: {
    '1': { round: 1, results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'Y', 10)] },
    '2': { round: 2, results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'Y', 10)] },
    '3': { round: 3, results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'Y', 10)] },
  } };
  const d = titleDecisions(c2, r2);
  eq(d.drivers, 3); // after R3: AAA 75, BBB 30, gap 45 > the 25 left; after R2 the gap (30) is still below the 50 left
});
test('without results nothing is marked', () => {
  const s = buildSeasonTimeline(cal, null);
  eq(s.some((x) => x.driversTitle || x.constructorsTitle), false);
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
