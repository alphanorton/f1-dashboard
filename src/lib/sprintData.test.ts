import { readFileSync } from 'node:fs';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };
const json = (name: string) => JSON.parse(readFileSync(new URL(`../../public/data/${name}`, import.meta.url), 'utf8'));

/** The official 2026 sprint classifications, exactly as supplied: round -> [driver, points] in finishing order. */
const OFFICIAL: Record<number, { name: string; rows: Array<[string, number]> }> = {
  2: { name: 'Chinese Grand Prix', rows: [['George Russell', 8], ['Charles Leclerc', 7], ['Lewis Hamilton', 6], ['Lando Norris', 5], ['Kimi Antonelli', 4], ['Oscar Piastri', 3], ['Liam Lawson', 2], ['Oliver Bearman', 1]] },
  6: { name: 'Miami Grand Prix', rows: [['Lando Norris', 8], ['Oscar Piastri', 7], ['Charles Leclerc', 6], ['George Russell', 5], ['Max Verstappen', 4], ['Kimi Antonelli', 3], ['Lewis Hamilton', 2], ['Pierre Gasly', 1]] },
  7: { name: 'Canadian Grand Prix', rows: [['George Russell', 8], ['Lando Norris', 7], ['Kimi Antonelli', 6], ['Oscar Piastri', 5], ['Charles Leclerc', 4], ['Lewis Hamilton', 3], ['Max Verstappen', 2], ['Arvid Lindblad', 1]] },
  11: { name: 'British Grand Prix', rows: [['Kimi Antonelli', 8], ['Lewis Hamilton', 7], ['Lando Norris', 6], ['George Russell', 5], ['Charles Leclerc', 4], ['Max Verstappen', 3], ['Oscar Piastri', 2], ['Liam Lawson', 1]] },
  14: { name: 'Dutch Grand Prix', rows: [['George Russell', 8], ['Charles Leclerc', 7], ['Lando Norris', 6], ['Kimi Antonelli', 5], ['Oscar Piastri', 4], ['Max Verstappen', 3], ['Lewis Hamilton', 2], ['Pierre Gasly', 1]] },
  19: { name: 'Singapore Grand Prix', rows: [['Max Verstappen', 8], ['Lewis Hamilton', 7], ['Charles Leclerc', 6], ['Kimi Antonelli', 5], ['Liam Lawson', 4], ['Oliver Bearman', 3], ['Nico Hulkenberg', 2], ['Lando Norris', 1]] },
};
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const results = json('results.json');
const calendar = json('calendar.json').races as Array<{ round: number; name: string; isSprint: boolean; status: string }>;
const standings = json('standings.json');

test('every official sprint is stored, in the official order with the official points', () => {
  for (const [round, o] of Object.entries(OFFICIAL)) {
    const stored = results.races[round].sprint as Array<{ pos: number; driver: string; points: number }>;
    eq(stored.length, 8, `round ${round} rows`);
    stored.forEach((row, i) => {
      eq(row.pos, i + 1, `round ${round} position`);
      eq(plain(row.driver), plain(o.rows[i][0]), `round ${round} P${i + 1} driver`);
      eq(row.points, o.rows[i][1], `round ${round} P${i + 1} points`);
    });
  }
});

test('each sprint is attached to its own Grand Prix', () => {
  for (const [round, o] of Object.entries(OFFICIAL)) {
    const cal = calendar.find((c) => c.round === Number(round));
    eq(cal?.name, o.name, `round ${round} name`);
    eq(cal?.isSprint, true, `round ${round} is a sprint weekend`);
    eq(results.races[round].name, o.name, `round ${round} results name`);
  }
});

test('only the six sprint weekends have sprint data, and every completed sprint weekend has it', () => {
  const withSprint = Object.entries(results.races).filter(([, r]: any) => r.sprint).map(([k]) => Number(k)).sort((a, b) => a - b);
  eq(withSprint.join(','), Object.keys(OFFICIAL).map(Number).sort((a, b) => a - b).join(','));
  const calendarSprints = calendar.filter((c) => c.isSprint && c.status === 'completed').map((c) => c.round).sort((a, b) => a - b);
  eq(calendarSprints.join(','), withSprint.join(','));
});

test('only the top eight score sprint points (8 down to 1, no one else)', () => {
  for (const [round, race] of Object.entries<any>(results.races)) {
    if (!race.sprint) continue;
    eq(race.sprint.map((r: any) => r.points).join(','), '8,7,6,5,4,3,2,1', `round ${round}`);
    eq(new Set(race.sprint.map((r: any) => r.code)).size, 8, `round ${round} unique drivers`);
  }
});

test('sprint points are kept apart from the Grand Prix points (race points are untouched)', () => {
  for (const [round, race] of Object.entries<any>(results.races)) {
    const gp = race.results.map((r: any) => r.points ?? 0).filter((p: number) => p > 0).sort((a: number, b: number) => b - a);
    eq(gp.slice(0, 10).join(','), '25,18,15,12,10,8,6,4,2,1', `round ${round} Grand Prix points`);
  }
});

test("each driver's season total = Grand Prix points + sprint points = the championship points", () => {
  const gp = new Map<string, number>(), sp = new Map<string, number>();
  for (const race of Object.values<any>(results.races)) {
    for (const r of race.results) gp.set(r.code, (gp.get(r.code) ?? 0) + (r.points ?? 0));
    for (const r of race.sprint ?? []) sp.set(r.code, (sp.get(r.code) ?? 0) + r.points);
  }
  for (const d of standings.drivers) {
    eq((gp.get(d.code) ?? 0) + (sp.get(d.code) ?? 0), d.points, `${d.code} total`);
    eq(d.sprintPoints, sp.get(d.code) ?? 0, `${d.code} sprintPoints column`);
  }
});

test('the six sprints award 216 points in total (6 x 36)', () => {
  let total = 0;
  for (const race of Object.values<any>(results.races)) for (const r of race.sprint ?? []) total += r.points;
  eq(total, 216);
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
