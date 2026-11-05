import {
  computeRacePrediction,
  recencyWeights,
  PREDICTION_WINDOW,
  FORM_WEIGHT,
  SEASON_WEIGHT,
} from './racePrediction.ts';
import type {
  PredictionStandingDriver,
  PredictionResultsData,
  PredictionCalendarRace,
} from './racePrediction.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => {
  if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`);
};
const close = (a: number, b: number, m = '', eps = 1e-9) => {
  if (Math.abs(a - b) > eps) throw new Error(`${m} expected ${b}, got ${a}`);
};

/* ---------------------------------------------------------------- fixtures */

const STANDINGS: PredictionStandingDriver[] = [
  { position: 1, code: 'AAA', name: 'Alice A', team: 'Alpha', points: 200, gap: 0 },
  { position: 2, code: 'BBB', name: 'Bob B', team: 'Beta', points: 150, gap: 50 },
  { position: 3, code: 'CCC', name: 'Cara C', team: 'Gamma', points: 100, gap: 100 },
  { position: 4, code: 'DDD', name: 'Dan D', team: 'Delta', points: 50, gap: 150 },
];

/** Build a race where `order` gives points 25,18,15,12 to the listed codes. */
function race(round: number, order: string[]): { round: number; name: string; date: string; circuit: string; results: Array<{ pos: number | null; driver: string; code: string; team: string; status: string; points: number }> } {
  const pts = [25, 18, 15, 12];
  const results = order.map((code, i) => ({
    pos: i + 1,
    driver: code,
    code,
    team: 'T',
    status: 'Finished',
    points: pts[i] ?? 0,
  }));
  // A retirement for anyone in the standings who is not in `order`.
  for (const d of STANDINGS) {
    if (!order.includes(d.code)) {
      results.push({ pos: null, driver: d.code, code: d.code, team: 'T', status: 'DNF', points: 0 });
    }
  }
  return { round, name: `R${round}`, date: '2026-01-01', circuit: 'C', results };
}

function resultsOf(races: Array<ReturnType<typeof race>>): PredictionResultsData {
  const map: PredictionResultsData['races'] = {};
  for (const r of races) map[String(r.round)] = r;
  return { season: 2026, asOfRound: races.length, races: map };
}

const CALENDAR: PredictionCalendarRace[] = [
  { round: 1, name: 'R1', circuit: 'C', date: '2026-01-01', status: 'completed', isSprint: false },
  { round: 2, name: 'R2', circuit: 'C', date: '2026-01-08', status: 'completed', isSprint: false },
  { round: 3, name: 'R3', circuit: 'C', date: '2026-01-15', status: 'completed', isSprint: false },
  { round: 4, name: 'R4', circuit: 'C', date: '2026-01-22', status: 'next', isSprint: false },
  { round: 5, name: 'R5', circuit: 'C', date: '2026-01-29', status: 'upcoming', isSprint: false },
];

/* ------------------------------------------------------------------- tests */

test('recencyWeights gives the newest race the highest weight', () => {
  eq(JSON.stringify(recencyWeights(3)), JSON.stringify([1, 2, 3]));
  eq(JSON.stringify(recencyWeights(0)), JSON.stringify([]));
  eq(JSON.stringify(recencyWeights(-2)), JSON.stringify([]));
});

test('weights are the constants the UI documents', () => {
  close(FORM_WEIGHT + SEASON_WEIGHT, 1, 'weights sum');
  eq(PREDICTION_WINDOW, 5);
});

test('returns null without enough drivers', () => {
  const results = resultsOf([race(1, ['AAA', 'BBB'])]);
  eq(computeRacePrediction({ drivers: STANDINGS.slice(0, 2), results, calendar: CALENDAR }), null);
});

test('returns null when there are no completed races', () => {
  eq(computeRacePrediction({ drivers: STANDINGS, results: resultsOf([]), calendar: CALENDAR }), null);
});

test('ranks by the documented formula, not by championship position', () => {
  // CCC wins the two most recent races, so the form term outweighs AAA's lead.
  // Standings points here are consistent with the three races below.
  const consistent: PredictionStandingDriver[] = [
    { position: 1, code: 'CCC', name: 'Cara C', team: 'Gamma', points: 65, gap: 0 },
    { position: 2, code: 'AAA', name: 'Alice A', team: 'Alpha', points: 55, gap: 10 },
    { position: 3, code: 'BBB', name: 'Bob B', team: 'Beta', points: 54, gap: 11 },
    { position: 4, code: 'DDD', name: 'Dan D', team: 'Delta', points: 36, gap: 29 },
  ];
  const results = resultsOf([
    race(1, ['AAA', 'BBB', 'CCC', 'DDD']),
    race(2, ['CCC', 'BBB', 'AAA', 'DDD']),
    race(3, ['CCC', 'BBB', 'AAA', 'DDD']),
  ]);
  const p = computeRacePrediction({ drivers: consistent, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  eq(p.winner.code, 'CCC', 'predicted winner');
  eq(p.topThree.length, 3);
  eq(p.topThree[0].code, 'CCC');
});

test('the score is exactly 70% form + 30% season rate', () => {
  const results = resultsOf([
    race(1, ['AAA', 'BBB', 'CCC', 'DDD']),
    race(2, ['AAA', 'BBB', 'CCC', 'DDD']),
  ]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  const a = p.ranked.find((d) => d.code === 'AAA')!;
  // AAA: 25 pts in both races -> form 25; season 200/2 = 100.
  close(a.formScore, 25, 'form');
  close(a.seasonRate, 100, 'season');
  close(a.score, 0.7 * 25 + 0.3 * 100, 'score');
});

test('recency weighting rewards a late-season surge', () => {
  // Two drivers with identical totals, opposite shape.
  const standings: PredictionStandingDriver[] = [
    { position: 1, code: 'EAR', name: 'Early', team: 'T', points: 43, gap: 0 },
    { position: 2, code: 'LATE', name: 'Late', team: 'T', points: 43, gap: 0 },
    { position: 3, code: 'OTH', name: 'Other', team: 'T', points: 0, gap: 43 },
  ];
  const pts = (r: number, code: string) => (r === 1 ? (code === 'EAR' ? 25 : 18) : (code === 'LATE' ? 25 : 18));
  const mk = (round: number) => ({
    round,
    name: `R${round}`,
    date: '2026-01-01',
    circuit: 'C',
    results: ['EAR', 'LATE', 'OTH'].map((code, i) => ({
      pos: i + 1,
      driver: code,
      code,
      team: 'T',
      status: 'Finished',
      points: pts(round, code),
    })),
  });
  const results: PredictionResultsData = { season: 2026, asOfRound: 2, races: { '1': mk(1), '2': mk(2) } };
  const p = computeRacePrediction({ drivers: standings, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  eq(p.winner.code, 'LATE', 'the driver in form wins the projection');
});

test('window only looks at the last N rounds', () => {
  const results = resultsOf([
    race(1, ['DDD', 'AAA', 'BBB', 'CCC']),
    race(2, ['AAA', 'BBB', 'CCC', 'DDD']),
    race(3, ['AAA', 'BBB', 'CCC', 'DDD']),
  ]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR, window: 2 });
  if (!p) throw new Error('expected a prediction');
  eq(JSON.stringify(p.roundsUsed), JSON.stringify([2, 3]), 'rounds used');
  eq(p.winner.code, 'AAA');
});

test('counts wins, podiums, DNFs and average finish inside the window', () => {
  const results = resultsOf([
    race(1, ['AAA', 'BBB', 'CCC', 'DDD']),
    race(2, ['BBB', 'AAA', 'CCC', 'DDD']),
  ]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  const a = p.ranked.find((d) => d.code === 'AAA')!;
  eq(a.wins, 1, 'wins');
  eq(a.podiums, 2, 'podiums');
  eq(a.dnfs, 0, 'dnfs');
  close(a.avgFinish, 1.5, 'avg finish');
  close(a.gapToLeader, 0, 'gap');
});

test('DNFs are counted and excluded from average finish', () => {
  const results = resultsOf([race(1, ['AAA', 'BBB', 'CCC'])]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  const d = p.ranked.find((x) => x.code === 'DDD')!;
  eq(d.dnfs, 1, 'dnf counted');
  eq(d.avgFinish, null, 'no classified finish');
  eq(d.formScore, 0, 'no points');
});

test('confidence tiers follow the documented score spread', () => {
  // Big spread: one driver wins everything.
  const wide = resultsOf([race(1, ['AAA', 'BBB', 'CCC', 'DDD']), race(2, ['AAA', 'BBB', 'CCC', 'DDD'])]);
  const pw = computeRacePrediction({ drivers: STANDINGS, results: wide, calendar: CALENDAR });
  if (!pw) throw new Error('expected a prediction');
  eq(pw.confidence, 'clear-favourite');

  // Identical shape for the top two -> no separation at all.
  const level: PredictionStandingDriver[] = [
    { position: 1, code: 'AAA', name: 'A', team: 'T', points: 0, gap: 0 },
    { position: 2, code: 'BBB', name: 'B', team: 'T', points: 0, gap: 0 },
    { position: 3, code: 'CCC', name: 'C', team: 'T', points: 0, gap: 0 },
  ];
  const even: PredictionResultsData = {
    season: 2026,
    asOfRound: 2,
    races: {
      '1': {
        round: 1, name: 'R1', date: '2026-01-01', circuit: 'C',
        results: [
          { pos: 1, driver: 'AAA', code: 'AAA', team: 'T', status: 'Finished', points: 25 },
          { pos: 2, driver: 'BBB', code: 'BBB', team: 'T', status: 'Finished', points: 25 },
          { pos: 3, driver: 'CCC', code: 'CCC', team: 'T', status: 'Finished', points: 25 },
        ],
      },
    },
  };
  const pe = computeRacePrediction({ drivers: level, results: even, calendar: CALENDAR });
  if (!pe) throw new Error('expected a prediction');
  eq(pe.confidence, 'too-close');
  close(pe.spread, 0, 'spread');
});

test('never publishes a probability field', () => {
  const results = resultsOf([race(1, ['AAA', 'BBB', 'CCC', 'DDD'])]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  const keys = Object.keys(p);
  eq(keys.some((k) => /prob|chance|percent/i.test(k)), false, 'no probability keys');
});

test('championship context exposes remaining points and title state', () => {
  const results = resultsOf([race(1, ['AAA', 'BBB', 'CCC', 'DDD'])]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  eq(p.championship.remainingRaces, 2, 'remaining races');
  eq(p.championship.maxPointsAvailable, 50, 'max points');
  eq(p.championship.completedRaces, 1, 'completed races');
  eq(p.championship.leaderName, 'Alice A');
  eq(p.championship.titleDecided, false, 'title still open');
});

test('sprint weekends add their extra points to the maximum available', () => {
  const calendar: PredictionCalendarRace[] = [
    ...CALENDAR.slice(0, 3),
    { round: 4, name: 'R4', circuit: 'C', date: '2026-01-22', status: 'next', isSprint: true },
  ];
  const results = resultsOf([race(1, ['AAA', 'BBB', 'CCC', 'DDD'])]);
  const p = computeRacePrediction({ drivers: STANDINGS, results, calendar });
  if (!p) throw new Error('expected a prediction');
  eq(p.championship.maxPointsAvailable, 33, '25 + 8 for the sprint');
});

test('output is deterministic for the same input', () => {
  const results = resultsOf([
    race(1, ['AAA', 'BBB', 'CCC', 'DDD']),
    race(2, ['BBB', 'AAA', 'DDD', 'CCC']),
  ]);
  const a = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR })!;
  const b = computeRacePrediction({ drivers: STANDINGS, results, calendar: CALENDAR })!;
  eq(JSON.stringify(a.ranked.map((d) => d.code)), JSON.stringify(b.ranked.map((d) => d.code)));
});

test('tie on score falls back to championship position', () => {
  const standings: PredictionStandingDriver[] = [
    { position: 1, code: 'ZZZ', name: 'Z', team: 'T', points: 100, gap: 0 },
    { position: 2, code: 'AAA', name: 'A', team: 'T', points: 100, gap: 0 },
    { position: 3, code: 'MMM', name: 'M', team: 'T', points: 100, gap: 0 },
  ];
  const same = (round: number) => ({
    round, name: `R${round}`, date: '2026-01-01', circuit: 'C',
    results: [
      { pos: 1, driver: 'AAA', code: 'AAA', team: 'T', status: 'Finished', points: 18 },
      { pos: 2, driver: 'MMM', code: 'MMM', team: 'T', status: 'Finished', points: 18 },
      { pos: 3, driver: 'ZZZ', code: 'ZZZ', team: 'T', status: 'Finished', points: 18 },
    ],
  });
  const results: PredictionResultsData = { season: 2026, asOfRound: 2, races: { '1': same(1), '2': same(2) } };
  const p = computeRacePrediction({ drivers: standings, results, calendar: CALENDAR });
  if (!p) throw new Error('expected a prediction');
  eq(p.ranked[0].code, 'ZZZ', 'championship position breaks the tie (ZZZ is P1)');
});

/* ----------------------------------------------------------------- runner */

let failed = 0;
for (const [n, f] of tests) {
  try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); }
}
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
