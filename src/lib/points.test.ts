// Points-system and countback checks for the 2026 season.
//
// Follows the same zero-dependency pattern as TireStrategy.helpers.test.ts: a tiny assert, a
// flat list of tests, a non-zero exit code on failure, and no node built-ins (the project has
// no @types/node). Run it with:
//   node src/lib/points.test.ts
//
// The file-level consistency checks live in verify-round-16.cjs, which can read the JSON
// data files the way the other verify-*.cjs scripts do.
//
// What it covers
//   1. the 25-18-15-12-10-8-6-4-2-1 table, including DNF and unscored positions
//   2. every supplied "after the race" figure equals before + this race's points
//   3. the constructor totals supplied for this race
//   4. the countback that separates Norris from Verstappen on 188 points
//   5. the countback that orders the four drivers tied on 7 points

import { pointsForPosition, isPointsPosition, constructorPoints } from './points.ts';

interface TinyAssert {
  equal(actual: unknown, expected: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
}

const assert: TinyAssert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
    }
  },
  ok(value, message) {
    if (!value) throw new Error(message ?? 'expected truthy value');
  },
};

declare const process: { exit(code: number): void };

const tests: Array<[string, () => void]> = [];
function test(name: string, fn: () => void) {
  tests.push([name, fn]);
}

interface RaceResult {
  pos: number | null;
  code: string;
  team: string;
  points: number;
}

/** Round 16 - Bahrain Grand Prix in Malaysia 2026, as published on formula1.com. */
const R16_RESULTS: RaceResult[] = [
  { pos: 1, code: 'VER', team: 'Red Bull Racing', points: 25 },
  { pos: 2, code: 'ANT', team: 'Mercedes', points: 18 },
  { pos: 3, code: 'HAM', team: 'Ferrari', points: 15 },
  { pos: 4, code: 'LEC', team: 'Ferrari', points: 12 },
  { pos: 5, code: 'HAD', team: 'Red Bull Racing', points: 10 },
  { pos: 6, code: 'PIA', team: 'McLaren', points: 8 },
  { pos: 7, code: 'LAW', team: 'Racing Bulls', points: 6 },
  { pos: 8, code: 'ALO', team: 'Aston Martin', points: 4 },
  { pos: 9, code: 'NOR', team: 'McLaren', points: 2 },
  { pos: 10, code: 'LIN', team: 'Racing Bulls', points: 1 },
  { pos: 11, code: 'HUL', team: 'Audi', points: 0 },
  { pos: 12, code: 'STR', team: 'Aston Martin', points: 0 },
  { pos: 13, code: 'COL', team: 'Alpine', points: 0 },
  { pos: 14, code: 'BEA', team: 'Haas', points: 0 },
  { pos: 15, code: 'OCO', team: 'Haas', points: 0 },
  { pos: 16, code: 'GAS', team: 'Alpine', points: 0 },
  { pos: 17, code: 'SAI', team: 'Williams', points: 0 },
  { pos: 18, code: 'BOR', team: 'Audi', points: 0 },
  { pos: 19, code: 'PER', team: 'Cadillac', points: 0 },
  { pos: null, code: 'RUS', team: 'Mercedes', points: 0 },
  { pos: null, code: 'ALB', team: 'Williams', points: 0 },
  { pos: null, code: 'BOT', team: 'Cadillac', points: 0 },
];

/** Season totals before round 16, as supplied in the request. */
const BEFORE: Record<string, number> = {
  ANT: 302, RUS: 236, HAM: 199, LEC: 179, NOR: 186, VER: 163, PIA: 120, HAD: 86,
  LAW: 59, GAS: 41, LIN: 37, COL: 27, BEA: 20, BOR: 10, HUL: 7, SAI: 7, OCO: 7,
  ALO: 3, ALB: 5, TSU: 1, STR: 0, BOT: 0, PER: 0,
};

/** Season totals after round 16, as supplied in the request. */
const SUPPLIED_AFTER: Record<string, number> = {
  ANT: 320, RUS: 236, HAM: 214, LEC: 191, NOR: 188, VER: 188, PIA: 128, HAD: 96,
  LAW: 65, GAS: 41, LIN: 38, COL: 27, BEA: 20, BOR: 10, HUL: 7, SAI: 7, OCO: 7,
  ALO: 7, ALB: 5, TSU: 1, STR: 0, BOT: 0, PER: 0,
};

/** Season wins before round 16, as held in standings.json. */
const WINS_BEFORE: Record<string, number> = {
  ANT: 8, RUS: 3, HAM: 1, NOR: 2, LEC: 1, VER: 0, PIA: 0, HAD: 0,
};

test('points table matches the 2026 system', () => {
  assert.equal(pointsForPosition(1), 25);
  assert.equal(pointsForPosition(2), 18);
  assert.equal(pointsForPosition(3), 15);
  assert.equal(pointsForPosition(4), 12);
  assert.equal(pointsForPosition(5), 10);
  assert.equal(pointsForPosition(6), 8);
  assert.equal(pointsForPosition(7), 6);
  assert.equal(pointsForPosition(8), 4);
  assert.equal(pointsForPosition(9), 2);
  assert.equal(pointsForPosition(10), 1);
});

test('positions outside the top ten score nothing', () => {
  assert.equal(pointsForPosition(11), 0);
  assert.equal(pointsForPosition(17), 0);
  assert.equal(pointsForPosition(null), 0, 'a DNF with no classified position scores nothing');
  assert.equal(isPointsPosition(10), true);
  assert.equal(isPointsPosition(11), false);
  assert.equal(isPointsPosition(null), false);
});

test('the round 16 classification matches the position table', () => {
  for (const row of R16_RESULTS) {
    assert.equal(
      row.points,
      pointsForPosition(row.pos),
      `${row.code} classified ${String(row.pos)} should score ${pointsForPosition(row.pos)}`
    );
  }
});

test('every supplied after-race driver total equals before + race points', () => {
  const gained = new Map<string, number>(R16_RESULTS.map((r) => [r.code, r.points]));
  for (const code of Object.keys(BEFORE)) {
    const racePoints: number = gained.get(code) ?? 0;
    assert.equal(
      BEFORE[code] + racePoints,
      SUPPLIED_AFTER[code],
      `${code}: ${BEFORE[code]} + ${racePoints} should be ${SUPPLIED_AFTER[code]}`
    );
  }
});

test('Tsunoda scored nothing and is absent from the classification', () => {
  assert.equal('TSU' in BEFORE, true, 'Tsunoda is in the season table');
  const gained = new Map<string, number>(R16_RESULTS.map((r) => [r.code, r.points]));
  assert.equal(gained.has('TSU'), false, 'Tsunoda did not start this race');
  assert.equal(SUPPLIED_AFTER.TSU, BEFORE.TSU, 'so his total is unchanged');
});

test('constructor totals equal the sum of their drivers race points', () => {
  const totals = constructorPoints(R16_RESULTS);
  const before: Record<string, number> = {
    Mercedes: 538, Ferrari: 378, McLaren: 306, 'Red Bull Racing': 263, 'Racing Bulls': 83,
    Alpine: 68, Haas: 27, Audi: 17, Williams: 12, 'Aston Martin': 3, Cadillac: 0,
  };
  const suppliedAfter: Record<string, number> = {
    Mercedes: 556, Ferrari: 405, McLaren: 316, 'Red Bull Racing': 298, 'Racing Bulls': 90,
    Alpine: 68, Haas: 27, Audi: 17, Williams: 12, 'Aston Martin': 7, Cadillac: 0,
  };
  for (const team of Object.keys(before)) {
    const gained: number = totals.get(team) ?? 0;
    assert.equal(before[team] + gained, suppliedAfter[team], `${team}: ${before[team]} + ${gained}`);
  }
});

test('Lawson and Lindblad are credited to Racing Bulls', () => {
  const totals = constructorPoints(R16_RESULTS);
  assert.equal(totals.get('Racing Bulls'), 7, 'Lawson 6 plus Lindblad 1');
  const lawson = R16_RESULTS.find((r) => r.code === 'LAW');
  const lindblad = R16_RESULTS.find((r) => r.code === 'LIN');
  assert.equal(lawson?.team, 'Racing Bulls');
  assert.equal(lindblad?.team, 'Racing Bulls');
});

test('countback puts Norris ahead of Verstappen on 188 points', () => {
  assert.equal(SUPPLIED_AFTER.NOR, SUPPLIED_AFTER.VER, 'the tie only matters while they are level');
  const norWins = WINS_BEFORE.NOR + (R16_RESULTS.find((r) => r.code === 'NOR')?.pos === 1 ? 1 : 0);
  const verWins = WINS_BEFORE.VER + (R16_RESULTS.find((r) => r.code === 'VER')?.pos === 1 ? 1 : 0);
  assert.equal(norWins, 2);
  assert.equal(verWins, 1);
  assert.ok(norWins > verWins, `wins decide the tie: Norris ${norWins} vs Verstappen ${verWins}`);
});

test('countback orders the four drivers tied on 7 points', () => {
  const tied = Object.keys(SUPPLIED_AFTER).filter((code) => SUPPLIED_AFTER[code] === 7);
  assert.equal(tied.length, 4, 'expected Hulkenberg, Sainz, Ocon and Alonso on 7 points');
  // None of the four has a win or a podium, so the countback falls through to finishing
  // positions. Hulkenberg, Ocon and Alonso each have one eighth place; Sainz has none
  // (three ninths and a tenth), so Sainz sits last in the group.
  const eighths: Record<string, number> = { HUL: 1, OCO: 1, ALO: 1, SAI: 0 };
  const withEighth = tied.filter((code) => eighths[code] > 0);
  assert.equal(withEighth.length, 3);
  assert.equal(tied.filter((code) => eighths[code] === 0).join(','), 'SAI', 'Sainz is the one without an eighth');
});

let passed = 0;
const failures: string[] = [];
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

console.log(failures.length === 0 ? `ok ${passed} passed` : `FAIL ${failures.length} failed\n${failures.join('\n')}`);
if (failures.length > 0) {
  process.exit(1);
}
