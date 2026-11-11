import { teamSeason } from './constructorSeason.ts';
import type { TeamBlock } from './constructorSeason.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };

const row = (pos: number | null, code: string, team: string, points: number, status = 'Finished') => ({ pos, code, driver: code + ' Driver', team, status, points });
const blocks: TeamBlock[] = [
  { round: 1, name: 'R1', results: [row(1, 'AAA', 'X', 25), row(2, 'BBB', 'X', 18), row(3, 'CCC', 'Y', 15)] },            // X: 1-2
  { round: 2, name: 'R2', results: [row(1, 'CCC', 'Y', 25), row(2, 'AAA', 'X', 18), row(3, 'DDD', 'Y', 15), row(null, 'BBB', 'X', 0, 'DNF')],
    sprint: [{ code: 'AAA', team: 'X', points: 8 }, { code: 'CCC', team: 'Y', points: 7 }] },
  { round: 3, name: 'R3', results: [row(1, 'DDD', 'Y', 25), row(2, 'CCC', 'Y', 18), row(3, 'AAA', 'X', 15)] },
];

test('points per weekend include the sprint', () => {
  const s = teamSeason(blocks, 'X');
  eq(s.weekends.map((w) => w.points).join(','), '43,26,15'); eq(s.weekends[1].sprint, 8); eq(s.total, 84);
});
test('wins, podiums and 1-2 finishes are counted from classified results', () => {
  const x = teamSeason(blocks, 'X'), y = teamSeason(blocks, 'Y');
  eq(x.wins, 1); eq(x.podiums, 4); eq(x.oneTwos, 1);
  eq(y.wins, 2); eq(y.oneTwos, 1);
});
test('a retirement scores nothing and is not a podium', () => { eq(teamSeason(blocks, 'X').drivers.find((d) => d.code === 'BBB')?.points, 18); });
test('drivers are listed by points, only those who scored for the team', () => {
  const s = teamSeason(blocks, 'X');
  eq(s.drivers.map((d) => d.code).join(''), 'AAABBB'); eq(s.drivers[0].points, 25 + 18 + 8 + 15); // AAA: 25 (R1) + 18 + 8 sprint (R2) + 15 (R3)
});
test('a team that never appears has an empty season', () => { const s = teamSeason(blocks, 'Z'); eq(s.total, 0); eq(s.drivers.length, 0); });

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
