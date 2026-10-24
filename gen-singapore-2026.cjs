// Folds the 2026 Singapore Grand Prix (Marina Bay Street Circuit, 11 Oct 2026) into the
// dashboard data files.
//
// This round has no cache/ snapshot: the classification, both standings and the sector
// figures were supplied directly and are reproduced verbatim below. Nothing is derived from
// a feed and nothing is filled in where the supplied data was silent - unavailable sector
// times, fastest-lap points, win/podium counts and sprint points are written as null.
//
// The script is idempotent: it always writes the supplied totals, so a re-run reproduces the
// same files rather than adding the race twice.
//
// Inputs
//   public/data/{results,calendar,standings,fastest_laps_2026}.json   existing season data
// Outputs
//   public/data/results.json             race added under the project round key 19
//   public/data/calendar.json            race marked completed, "next" handed to round 20
//   public/data/standings.json           driver + constructor tables replaced with the supplied ones
//   public/data/fastest_laps_2026.json   race fastest lap added under the official round key 17
//   public/data/singapore_2026.json      full weekend dataset used by the Singapore GP page
//
// Usage
//   node gen-singapore-2026.cjs             # write everything
//   node gen-singapore-2026.cjs --dry-run   # report only, write nothing
//
// ROUND NUMBERING WARNING
//   Official round (formula1.com / Jolpica / OpenF1) = 17.
//   This project counts the cancelled Sakhir and Jeddah weekends as rounds 4 and 5, so its own
//   keys run two ahead of the official calendar from round 6 onwards. results.json keys must stay
//   in step with calendar.json (verify-rounds.cjs enforces it), so the race is stored under key 19
//   and carries officialRound: 17. fastest_laps_2026.json is keyed by the official round, so the
//   same race is stored there under key 17.

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'public', 'data');

const OFFICIAL_ROUND = 17;
const PROJECT_ROUND = 19;

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');

// --------------------------------------------------------------------- supplied data

const RACE = {
  name: 'Singapore Grand Prix',
  circuit: 'Marina Bay Street Circuit',
  locality: 'Singapore',
  country: 'Singapore',
  date: '2026-10-11',
  weekendDates: '09 - 11 Oct',
  isSprint: true,
  distanceKm: 4.927,
  raceLaps: 62,
  winnerTime: '1:42:00.785',
  pole: { code: 'VER', time: '1:31.373' },
  ledEveryLap: true,
  fastestLapPoints: null, // no point available for the fastest lap
  pointsSystem: '25-18-15-12-10-8-6-4-2-1',
  source: 'Supplied 2026 Singapore Grand Prix classification and standings',
};

// pos null = not classified. time_or_gap holds the interval exactly as supplied; `laps` is
// filled in only where the supplied interval determines it - a lapped finisher's completed
// laps follow from the 62-lap distance and the interval - and stays null when it does not.
const CLASSIFICATION = [
  { pos: 1, code: 'VER', team: 'Red Bull Racing', time_or_gap: '1:42:00.785', status: 'Finished', points: 25 },
  { pos: 2, code: 'LEC', team: 'Ferrari', time_or_gap: '+7.335', status: 'Finished', points: 18 },
  { pos: 3, code: 'ANT', team: 'Mercedes', time_or_gap: '+24.573', status: 'Finished', points: 15 },
  { pos: 4, code: 'NOR', team: 'McLaren', time_or_gap: '+40.506', status: 'Finished', points: 12 },
  { pos: 5, code: 'PIA', team: 'McLaren', time_or_gap: '+49.644', status: 'Finished', points: 10 },
  { pos: 6, code: 'HAM', team: 'Ferrari', time_or_gap: '+53.188', status: 'Finished', points: 8 },
  { pos: 7, code: 'LAW', team: 'Racing Bulls', time_or_gap: '+1:21.666', status: 'Finished', points: 6 },
  { pos: 8, code: 'HUL', team: 'Audi', time_or_gap: '+1:23.386', status: 'Finished', points: 4 },
  { pos: 9, code: 'RUS', team: 'Mercedes', time_or_gap: '+1:24.677', status: 'Finished', points: 2 },
  { pos: 10, code: 'HAD', team: 'Red Bull Racing', time_or_gap: '+1:30.862', status: 'Finished', points: 1 },
  { pos: 11, code: 'GAS', team: 'Alpine', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 12, code: 'BEA', team: 'Haas', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 13, code: 'OCO', team: 'Haas', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 14, code: 'SAI', team: 'Williams', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 15, code: 'LIN', team: 'Racing Bulls', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 16, code: 'ALO', team: 'Aston Martin', time_or_gap: '+1 lap', status: 'Finished', points: 0 },
  { pos: 17, code: 'PER', team: 'Cadillac', time_or_gap: '+2 laps', status: 'Finished', points: 0 },
  { pos: 18, code: 'ALB', team: 'Williams', time_or_gap: 'DNF (59 laps)', status: 'DNF', points: 0 },
  { pos: 19, code: 'BOT', team: 'Cadillac', time_or_gap: '+3 laps', status: 'Finished', points: 0 },
  { pos: null, code: 'STR', team: 'Aston Martin', time_or_gap: 'DNF', status: 'DNF', points: 0 },
  { pos: null, code: 'COL', team: 'Alpine', time_or_gap: 'DNF', status: 'DNF', points: 0 },
  { pos: null, code: 'BOR', team: 'Audi', time_or_gap: 'DNF', status: 'DNF', points: 0 },
];

// Driver championship after the race, exactly as supplied. wins, podiums and sprintPoints were
// not part of the supplied table and are written as null rather than carried over from the
// previous round's file, which would imply totals the supplied data does not support.
const DRIVER_STANDINGS = [
  { position: 1, code: 'ANT', team: 'Mercedes', points: 340 },
  { position: 2, code: 'RUS', team: 'Mercedes', points: 238 },
  { position: 3, code: 'HAM', team: 'Ferrari', points: 229 },
  { position: 4, code: 'VER', team: 'Red Bull Racing', points: 221 },
  { position: 5, code: 'LEC', team: 'Ferrari', points: 215 },
  { position: 6, code: 'NOR', team: 'McLaren', points: 201 },
  { position: 7, code: 'PIA', team: 'McLaren', points: 138 },
  { position: 8, code: 'HAD', team: 'Red Bull Racing', points: 97 },
  { position: 9, code: 'LAW', team: 'Racing Bulls', points: 75 },
  { position: 10, code: 'GAS', team: 'Alpine', points: 41 },
  { position: 11, code: 'LIN', team: 'Racing Bulls', points: 38 },
  { position: 12, code: 'COL', team: 'Alpine', points: 27 },
  { position: 13, code: 'BEA', team: 'Haas', points: 23 },
  { position: 14, code: 'HUL', team: 'Audi', points: 13 },
  { position: 15, code: 'BOR', team: 'Audi', points: 10 },
  { position: 16, code: 'OCO', team: 'Haas', points: 7 },
  { position: 17, code: 'ALO', team: 'Aston Martin', points: 7 },
  { position: 18, code: 'SAI', team: 'Williams', points: 7 },
  { position: 19, code: 'ALB', team: 'Williams', points: 5 },
  { position: 20, code: 'STR', team: 'Aston Martin', points: 0 },
  { position: 21, code: 'BOT', team: 'Cadillac', points: 0 },
  { position: 22, code: 'PER', team: 'Cadillac', points: 0 },
];

const TEAM_STANDINGS = [
  { position: 1, team: 'Mercedes', points: 578 },
  { position: 2, team: 'Ferrari', points: 444 },
  { position: 3, team: 'McLaren', points: 339 },
  { position: 4, team: 'Red Bull Racing', points: 318 },
  { position: 5, team: 'Racing Bulls', points: 113 },
  { position: 6, team: 'Alpine', points: 68 },
  { position: 7, team: 'Haas', points: 30 },
  { position: 8, team: 'Audi', points: 23 },
  { position: 9, team: 'Williams', points: 12 },
  { position: 10, team: 'Aston Martin', points: 7 },
  { position: 11, team: 'Cadillac', points: 0 },
];

// Points scored in the race itself. Supplied directly, then cross-checked below against the
// classification.
const RACE_TEAM_POINTS = {
  'Red Bull Racing': 26,
  Ferrari: 26,
  McLaren: 22,
  Mercedes: 17,
  'Racing Bulls': 6,
  Audi: 4,
  Alpine: 0,
  Haas: 0,
  Williams: 0,
  'Aston Martin': 0,
  Cadillac: 0,
};

const FASTEST_LAPS = {
  race: { code: 'LEC', team: 'Ferrari', lap_time: '1:35.202', lap_number: 41, points: null },
  sprint: { code: 'HAM', team: 'Ferrari', lap_time: '1:45.457', lap_number: 20, points: null },
  practice1: { code: 'RUS', team: 'Mercedes', lap_time: '1:32.274', lap_number: null, points: null },
};

// Only these sector figures were supplied. Everything else stays null.
const SUPPLIED_SECTORS = {
  VER: { sprint_qualifying: { s1: 26.832, s2: null, s3: 25.675 } },
  LEC: { sprint_qualifying: { s1: null, s2: 38.445, s3: null } },
};

// Practice 1: fastest sector owner only, no times were supplied.
const PRACTICE_1_SECTOR_LEADERS = [
  { code: 'RUS', sector: 'S1', time: null },
  { code: 'NOR', sector: 'S2', time: null },
  { code: 'RUS', sector: 'S3', time: null },
];

const CHAMPIONSHIP = {
  leaderCode: 'ANT',
  runnerUpCode: 'RUS',
  gap: 102,
  clench: { round: PROJECT_ROUND + 1, officialRound: OFFICIAL_ROUND + 1 },
};

// ------------------------------------------------------------------- load + helpers

const results = readJson(path.join(DATA, 'results.json'));
const calendar = readJson(path.join(DATA, 'calendar.json'));
const standings = readJson(path.join(DATA, 'standings.json'));
const fastestLaps = readJson(path.join(DATA, 'fastest_laps_2026.json'));

const identityByCode = new Map(standings.drivers.map((d) => [d.code, d]));
const teamMetaByName = new Map(standings.constructors.map((c) => [c.shortName, c]));

const nameOf = (code) => identityByCode.get(code)?.name ?? null;
const lapsOf = (time) => {
  if (time === null || time === undefined) return null;
  const [m, s] = String(time).split(':');
  return Math.round(parseInt(m, 10) * 60 * parseFloat(s) * 1000) / 1000;
};

// "given NAME" -> "given SURNAME", the format fastest_laps_2026.json uses.
const surnameUpper = (full) => {
  if (!full) return null;
  const parts = full.split(' ');
  const last = parts.pop();
  return [...parts, last.toUpperCase()].join(' ');
};

// Laps completed, read off the supplied interval only:
//   "+N lap(s)"   -> raceLaps - N      (a lapped finisher over the full distance)
//   "DNF (N laps)" -> N                 (stated outright in the interval)
//   anything else, and any bare "DNF"   -> null (not determinable, left empty)
function completedLaps(interval, raceLaps) {
  const dnfLaps = /DNF \((\d+) laps?\)/i.exec(interval);
  if (dnfLaps) return parseInt(dnfLaps[1], 10);
  const lapped = /^\+(\d+) laps?$/.exec(interval);
  if (lapped) return raceLaps - parseInt(lapped[1], 10);
  if (/DNF/i.test(interval)) return null;
  return raceLaps;
}

CLASSIFICATION.forEach((r) => {
  r.laps = completedLaps(r.time_or_gap, RACE.raceLaps);
});

let problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
  return ok;
};

// ------------------------------------------------------------------ cross-checks

const classificationCodes = new Set(CLASSIFICATION.map((r) => r.code));
check(classificationCodes.size === CLASSIFICATION.length, 'duplicate driver code in the classification');
check(
  CLASSIFICATION.filter((r) => r.pos === null).length === 3,
  'expected three unclassified (pos null) drivers'
);

// Every driver's two team-mates' points must add up to the supplied constructor total.
for (const team of TEAM_STANDINGS) {
  const scored = DRIVER_STANDINGS.filter((d) => d.team === team.team).reduce((sum, d) => sum + d.points, 0);
  check(
    scored === team.points,
    `${team.team}: driver points sum to ${scored} but the constructor total is ${team.points}`
  );
  const inRace = CLASSIFICATION.filter((r) => r.team === team.team).reduce((sum, r) => sum + r.points, 0);
  check(
    inRace === RACE_TEAM_POINTS[team.team],
    `${team.team}: race classification sums to ${inRace} but the supplied race total is ${RACE_TEAM_POINTS[team.team]}`
  );
}

// The championship note: the gap must match the two supplied standings rows.
const leaderPoints = DRIVER_STANDINGS.find((d) => d.code === CHAMPIONSHIP.leaderCode)?.points ?? null;
const runnerUpPoints = DRIVER_STANDINGS.find((d) => d.code === CHAMPIONSHIP.runnerUpCode)?.points ?? null;
check(
  leaderPoints !== null && runnerUpPoints !== null && leaderPoints - runnerUpPoints === CHAMPIONSHIP.gap,
  `championship gap ${CHAMPIONSHIP.gap} does not match ${leaderPoints} - ${runnerUpPoints}`
);

// Every driver in the classification must be in the supplied standings table.
for (const r of CLASSIFICATION) {
  check(
    DRIVER_STANDINGS.some((d) => d.code === r.code && d.team === r.team),
    `${r.code}: classified for ${r.team} but missing from the driver standings table`
  );
}

// ----------------------------------------------------------------------- reporting

console.log('=== 2026 SINGAPORE GRAND PRIX ===\n');
console.log(`official round ${OFFICIAL_ROUND} | project round key ${PROJECT_ROUND}`);
console.log(`classification rows: ${CLASSIFICATION.length}`);
console.log(`driver standings:    ${DRIVER_STANDINGS.length}`);
console.log(`team standings:      ${TEAM_STANDINGS.length}`);

console.log('\n=== CLASSIFICATION ===');
console.log('Pos | Code | Driver              | Team             | Time or gap    | St   | Pts');
CLASSIFICATION.forEach((r) => {
  console.log(
    [
      String(r.pos ?? '—').padStart(3),
      r.code.padEnd(4),
      String(nameOf(r.code)).padEnd(19),
      r.team.padEnd(16),
      r.time_or_gap.padEnd(15),
      r.status === 'DNF' ? 'DNF' : 'Cls',
      String(r.points).padStart(3),
    ].join(' | ')
  );
});

console.log('\n=== TEAM CROSS-CHECK ===');
console.log('Team             | Standings | From drivers | Race pts | Supplied race pts');
for (const team of TEAM_STANDINGS) {
  const fromDrivers = DRIVER_STANDINGS.filter((d) => d.team === team.team).reduce((s, d) => s + d.points, 0);
  const fromRace = CLASSIFICATION.filter((r) => r.team === team.team).reduce((s, r) => s + r.points, 0);
  console.log(
    [
      team.team.padEnd(16),
      String(team.points).padStart(9),
      String(fromDrivers).padStart(12),
      String(fromRace).padStart(9),
      String(RACE_TEAM_POINTS[team.team]).padStart(18),
    ].join(' | ')
  );
}

console.log('\n=== NULLS LEFT EMPTY (not guessed) ===');
console.log('  driver wins / podiums / sprint points   : null (not supplied)');
console.log('  fastest-lap points                      : null (no point available)');
console.log('  race + qualifying sector times           : null (not supplied)');
console.log('  practice 1 fastest-sector times          : null (owner supplied, times not)');
console.log('  unclassified drivers (STR/COL/BOR) laps  : null');

if (problems.length) {
  console.log('\n=== CHECKS FAILED ===');
  problems.forEach((p) => console.log(`  - ${p}`));
} else {
  console.log('\nall cross-checks passed');
}

// ------------------------------------------------------------------------- write

if (DRY_RUN || problems.length) {
  if (DRY_RUN) console.log('\n--dry-run: nothing written');
  if (problems.length) process.exit(1);
  process.exit(0);
}

// results.json
results.races[String(PROJECT_ROUND)] = {
  round: PROJECT_ROUND,
  officialRound: OFFICIAL_ROUND,
  name: RACE.name,
  date: RACE.date,
  circuit: RACE.circuit,
  distanceKm: RACE.distanceKm,
  raceLaps: RACE.raceLaps,
  winnerTime: RACE.winnerTime,
  poleTime: RACE.pole.time,
  resultsNote:
    'Verstappen led all 62 laps from pole. No point was available for the fastest lap. Gap column carries the interval exactly as published; unclassified drivers carry a null position.',
  results: CLASSIFICATION.map((r) => ({
    pos: r.pos,
    driver: nameOf(r.code),
    code: r.code,
    team: r.team,
    status: r.status,
    points: r.points,
    gap: r.time_or_gap,
    laps: r.laps,
  })),
};
results.asOfRound = PROJECT_ROUND;
results.officialAsOfRound = OFFICIAL_ROUND;
results.asOfDate = RACE.date;
writeJson(path.join(DATA, 'results.json'), results);

// calendar.json
const calendarRace = calendar.races.find((r) => r.round === PROJECT_ROUND);
if (calendarRace) {
  calendarRace.status = 'completed';
  calendarRace.officialRound = OFFICIAL_ROUND;
  calendarRace.winner = `${nameOf(RACE.pole.code)} (Red Bull Racing)`;
  calendarRace.podium = CLASSIFICATION.filter((r) => r.pos !== null && r.pos <= 3).map(
    (r) => `${nameOf(r.code)} (${r.team})`
  );
  calendarRace.notes =
    `${RACE.raceLaps} laps of the ${RACE.distanceKm} km Marina Bay Street Circuit. ` +
    `Max Verstappen won from pole (${RACE.pole.time}) with a total race time of ${RACE.winnerTime} after leading all ${RACE.raceLaps} laps. ` +
    `Charles Leclerc took the fastest lap of the race (${FASTEST_LAPS.race.lap_time}, lap ${FASTEST_LAPS.race.lap_number}); no point was available for it. ` +
    `Alexander Albon retired after 59 laps and Lance Stroll, Franco Colapinto and Gabriel Bortoleto did not finish.`;
  calendarRace.resultsNote =
    'Full classification available. Gaps published as intervals; the three unclassified drivers carry a null position.';
  // Hand the "next" flag on to the following round, leaving exactly one race flagged.
  for (const r of calendar.races) {
    if (r.status === 'next' && r.round !== PROJECT_ROUND + 1) r.status = 'upcoming';
  }
  const next = calendar.races.find((r) => r.round === PROJECT_ROUND + 1);
  if (next && next.status !== 'completed' && next.status !== 'cancelled') next.status = 'next';
}
calendar.asOfDate = RACE.date;
writeJson(path.join(DATA, 'calendar.json'), calendar);

// standings.json - driver table replaced wholesale by the supplied one. Identity fields
// (number, name, nationality) are carried over from the previous file; only the totals the
// request actually supplied are written, the rest stay null.
const leaderDriverPoints = DRIVER_STANDINGS[0].points;
standings.drivers = DRIVER_STANDINGS.map((d) => {
  const identity = identityByCode.get(d.code) || {};
  return {
    position: d.position,
    driverNumber: identity.driverNumber ?? null,
    code: d.code,
    name: identity.name ?? nameOf(d.code),
    nationality: identity.nationality ?? null,
    team: d.team,
    points: d.points,
    wins: null,
    podiums: null,
    gap: leaderDriverPoints - d.points,
    sprintPoints: null,
  };
});

const leaderTeamPoints = TEAM_STANDINGS[0].points;
standings.constructors = TEAM_STANDINGS.map((t) => {
  const meta = teamMetaByName.get(t.team) || {};
  return {
    position: t.position,
    name: meta.name ?? t.team,
    shortName: t.team,
    carName: meta.carName ?? null,
    engine: meta.engine ?? null,
    powerUnit: meta.powerUnit ?? null,
    drivers: meta.drivers ?? [],
    points: t.points,
    wins: null,
    podiums: null,
    gap: leaderTeamPoints - t.points,
    updates: meta.updates ?? [],
  };
});

standings.asOfRound = PROJECT_ROUND;
standings.officialAsOfRound = OFFICIAL_ROUND;
standings.asOfRace = RACE.name;
standings.asOfLocation = `${RACE.locality}, ${RACE.country}`;
standings.asOfStatus = 'Completed';
standings.nextRound = PROJECT_ROUND + 1;
standings.officialNextRound = OFFICIAL_ROUND + 1;
standings.nextGrandPrix = calendar.races.find((r) => r.round === PROJECT_ROUND + 1)?.name ?? null;
standings.lastUpdated = RACE.date;
standings.remainingRaces = calendar.races.filter((r) => r.status === 'upcoming' || r.status === 'next').length;
writeJson(path.join(DATA, 'standings.json'), standings);

// fastest_laps_2026.json - keyed by the official round, so 17 rather than 19.
const raceLap = FASTEST_LAPS.race;
fastestLaps.races = fastestLaps.races.filter((r) => r.round !== OFFICIAL_ROUND);
fastestLaps.races.push({
  round: OFFICIAL_ROUND,
  projectRound: PROJECT_ROUND,
  grand_prix: RACE.name,
  circuit: 'marina_bay',
  date: RACE.date,
  driver_name: surnameUpper(nameOf(raceLap.code)),
  driver_code: raceLap.code,
  team: raceLap.team,
  lap_number: raceLap.lap_number,
  lap_time: lapsOf(raceLap.lap_time),
  s1: null,
  s2: null,
  s3: null,
  source: 'Supplied 2026 Singapore Grand Prix classification (single source, not cross-checked)',
  verified: false,
});
fastestLaps.races.sort((a, b) => a.round - b.round);
fastestLaps.asOfDate = RACE.date;
fastestLaps.generatedAt = new Date().toISOString();
fastestLaps.needs_review = fastestLaps.needs_review.filter((r) => r.round !== OFFICIAL_ROUND);
fastestLaps.needs_review.push({
  round: OFFICIAL_ROUND,
  grand_prix: RACE.name,
  reason:
    'Lap time and lap number come from the supplied classification only. Sector times for the fastest lap were not supplied, so s1/s2/s3 are null rather than split from the lap time.',
  driver_code: raceLap.code,
  lap_time: lapsOf(raceLap.lap_time),
  official_lap_time: raceLap.lap_time,
  lap_number: raceLap.lap_number,
});
writeJson(path.join(DATA, 'fastest_laps_2026.json'), fastestLaps);

// singapore_2026.json - the full weekend dataset behind the Singapore GP page.
const sectorRows = CLASSIFICATION.map((r) => ({
  code: r.code,
  driver: nameOf(r.code),
  team: r.team,
  sprint_qualifying: SUPPLIED_SECTORS[r.code]?.sprint_qualifying ?? { s1: null, s2: null, s3: null },
  practice_1: { s1: null, s2: null, s3: null },
  race: { s1: null, s2: null, s3: null },
  qualifying: { s1: null, s2: null, s3: null },
}));

const clenchRace = calendar.races.find((r) => r.round === CHAMPIONSHIP.clench.round);

const singapore = {
  season: 2026,
  officialRound: OFFICIAL_ROUND,
  projectRound: PROJECT_ROUND,
  name: RACE.name,
  circuit: RACE.circuit,
  locality: RACE.locality,
  country: RACE.country,
  date: RACE.date,
  weekendDates: RACE.weekendDates,
  isSprint: RACE.isSprint,
  distanceKm: RACE.distanceKm,
  raceLaps: RACE.raceLaps,
  winnerTime: RACE.winnerTime,
  pointsSystem: RACE.pointsSystem,
  source: RACE.source,
  fastestLapPoints: RACE.fastestLapPoints,
  pole: {
    code: RACE.pole.code,
    driver: nameOf(RACE.pole.code),
    team: 'Red Bull Racing',
    time: RACE.pole.time,
  },
  ledEveryLap: RACE.ledEveryLap,
  personalBestLap: { code: 'VER', driver: nameOf('VER'), lap_time: '1:36.201', lap_number: null },
  classification: CLASSIFICATION.map((r) => ({
    pos: r.pos,
    driver: nameOf(r.code),
    code: r.code,
    team: r.team,
    time_or_gap: r.time_or_gap,
    status: r.status,
    points: r.points,
    laps: r.laps,
  })),
  driverStandings: DRIVER_STANDINGS.map((d) => ({
    position: d.position,
    code: d.code,
    driver: nameOf(d.code),
    team: d.team,
    points: d.points,
    gap: leaderDriverPoints - d.points,
  })),
  teamStandings: TEAM_STANDINGS.map((t) => ({
    position: t.position,
    team: t.team,
    fullName: teamMetaByName.get(t.team)?.name ?? t.team,
    points: t.points,
    gap: leaderTeamPoints - t.points,
  })),
  raceTeamPoints: TEAM_STANDINGS.map((t) => ({ team: t.team, points: RACE_TEAM_POINTS[t.team] })),
  fastestLaps: Object.entries(FASTEST_LAPS).map(([session, v]) => ({
    session,
    code: v.code,
    driver: nameOf(v.code),
    team: v.team,
    lap_time: v.lap_time,
    lap_number: v.lap_number,
    points: v.points,
  })),
  sectors: {
    unit: 'seconds',
    note: 'Sector times for the race and for qualifying were not available in the sources.',
    race: sectorRows.map((r) => ({ code: r.code, s1: null, s2: null, s3: null })),
    qualifying: sectorRows.map((r) => ({ code: r.code, s1: null, s2: null, s3: null })),
    sprint_qualifying: sectorRows.map((r) => r.sprint_qualifying),
    practice_1_sector_leaders: PRACTICE_1_SECTOR_LEADERS.map((s) => ({
      ...s,
      driver: nameOf(s.code),
    })),
  },
  championship: {
    leader: {
      code: CHAMPIONSHIP.leaderCode,
      driver: nameOf(CHAMPIONSHIP.leaderCode),
      points: leaderPoints,
    },
    runnerUp: {
      code: CHAMPIONSHIP.runnerUpCode,
      driver: nameOf(CHAMPIONSHIP.runnerUpCode),
      points: runnerUpPoints,
    },
    gap: CHAMPIONSHIP.gap,
    clench: {
      round: CHAMPIONSHIP.clench.round,
      name: clenchRace?.name ?? null,
      circuit: clenchRace?.circuit ?? null,
      locality: clenchRace?.locality ?? null,
      date: clenchRace?.date ?? null,
      weekendDates: clenchRace?.weekendDates ?? null,
    },
  },
};
writeJson(path.join(DATA, 'singapore_2026.json'), singapore);

console.log('\n=== WRITTEN ===');
[
  'results.json',
  'calendar.json',
  'standings.json',
  'fastest_laps_2026.json',
  'singapore_2026.json',
].forEach((f) => console.log(`   public/data/${f}`));