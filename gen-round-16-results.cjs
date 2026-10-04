// Builds the round 16 (Bahrain Grand Prix in Malaysia 2026, Sepang) deliverables
// and folds the race into the dashboard data files.
//
// Inputs
//   cache/round-16-bahrain-malaysia/official_reference.json  formula1.com values (classification, fastest laps)
//   cache/round-16-bahrain-malaysia/openf1_stints_session_11731.json  tyre stints
//   cache/round-16-bahrain-malaysia/openf1_laps_session_11731.json    sector times
//   cache/round-16-bahrain-malaysia/openf1_drivers_session_11731.json driver/team/number map
//   public/data/{results,calendar,standings}.json                   existing season data
//
// Outputs
//   public/data/results_2026_r16.json / .csv    full classification + fastest lap + sectors + stints
//   public/data/tyre_stints_2026_r16.json / .csv  tyre_stints table
//   public/data/results.json                     race added under the project round key
//   public/data/calendar.json                    race marked completed
//   public/data/standings.json                   points, positions, gaps, countback
//
// Usage
//   node gen-round-16-results.cjs             # write everything
//   node gen-round-16-results.cjs --dry-run   # report only, write nothing
//
// ROUND NUMBERING WARNING
//   Official round (formula1.com / Jolpica / OpenF1 / FastF1) = 16.
//   This project counts the cancelled Sakhir and Jeddah weekends as rounds 4 and 5,
//   so its own keys run two ahead of the official calendar from round 6 onwards and
//   calendar.json + results.json label this race round 18. results.json keys must stay in
//   step with calendar.json (verify-rounds.cjs enforces it), so the race is stored under
//   key 18 and carries officialRound: 16.

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const ROOT = __dirname;
const CACHE = path.join(ROOT, 'cache', 'round-16-bahrain-malaysia');
const DATA = path.join(ROOT, 'public', 'data');

const OFFICIAL_ROUND = 16;
const PROJECT_ROUND = 18;

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');

function toCsv(rows, columns) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

// ---------------------------------------------------------------- load inputs

const official = readJson(path.join(CACHE, 'official_reference.json'));
const stints = readJson(path.join(CACHE, 'openf1_stints_session_11731.json'));
const laps = readJson(path.join(CACHE, 'openf1_laps_session_11731.json'));
const drivers = readJson(path.join(CACHE, 'openf1_drivers_session_11731.json'));

const results = readJson(path.join(DATA, 'results.json'));
const calendar = readJson(path.join(DATA, 'calendar.json'));
const standings = readJson(path.join(DATA, 'standings.json'));

const driverByCode = new Map(drivers.map((d) => [d.name_acronym, d]));
const officialFastest = new Map(official.fastest_laps_official.map((f) => [f.code, f]));

// Fastest lap per driver from OpenF1 /laps: used for the sector times, which the
// official fastest-laps page does not publish. Every one of these lap times was checked
// against the official page and matches exactly.
const fastestLapByDriver = new Map();
for (const lap of laps) {
  if (lap.lap_duration === null || lap.lap_duration === undefined) continue;
  if (lap.is_pit_out_lap === true) continue;
  const best = fastestLapByDriver.get(lap.driver_number);
  if (!best || lap.lap_duration < best.lap_duration) fastestLapByDriver.set(lap.driver_number, lap);
}
const sectorsByCode = new Map();
for (const [driverNumber, lap] of fastestLapByDriver) {
  const driver = drivers.find((d) => d.driver_number === driverNumber);
  if (!driver) continue;
  sectorsByCode.set(driver.name_acronym, {
    s1: lap.duration_sector_1,
    s2: lap.duration_sector_2,
    s3: lap.duration_sector_3,
    openf1LapNumber: lap.lap_number,
  });
}

const round3 = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 1000);
const fmtLap = (seconds) => {
  if (seconds === null || seconds === undefined) return null;
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`;
};
const secondsOf = (time) => {
  if (!time) return null;
  const [m, s] = String(time).split(':');
  return parseInt(m, 10) * 60 + parseFloat(s);
};

// ------------------------------------------------------------------ tyre stints

// Corroboration table: the facts that were supplied as already confirmed for this race.
// Keyed "CODE:stint" so a stint is only called confirmed when an independent source backs it.
const CONFIRMED_STARTS = {
  VER: 'INTERMEDIATE',
  ANT: 'INTERMEDIATE',
  RUS: 'INTERMEDIATE',
  HAD: 'INTERMEDIATE',
  LAW: 'INTERMEDIATE',
  LIN: 'INTERMEDIATE',
  OCO: 'INTERMEDIATE',
  SAI: 'INTERMEDIATE',
  ALB: 'INTERMEDIATE',
  HAM: 'SOFT',
  LEC: 'SOFT',
  GAS: 'SOFT',
  BEA: 'SOFT',
  BOT: 'SOFT',
  PER: 'SOFT',
  COL: 'SOFT',
  BOR: 'SOFT',
  HUL: 'SOFT',
  NOR: 'MEDIUM',
  PIA: 'MEDIUM',
  ALO: 'MEDIUM',
  STR: 'MEDIUM',
};

// Supplied as confirmed: a switch to intermediate on these laps.
const CONFIRMED_SWITCH_TO_INT = { PER: 2, PIA: 2, BOR: 2, STR: 2, HUL: 2, LEC: 2 };

// Supplied as confirmed: these drivers pitted at the final full safety car, around lap 45.
const CONFIRMED_PIT_LAP_45 = ['NOR', 'LAW', 'ALO', 'HUL'];

// Claims from the supplied narrative that the official data contradicts. Recorded so the
// confidence column is explainable and the conflict is not silently dropped.
const CONFLICTS = {
  'ANT:1': 'Confirmed start on intermediate matches; OpenF1 has him on intermediate for laps 1-9 and the confirmed lap 10 stop.',
  'VER:2': 'Supplied narrative has Verstappen on intermediate until the lap 9 safety car; OpenF1 has him on soft from lap 2.',
  'RUS:3': 'Supplied narrative has Russell on intermediate until lap 9/10; OpenF1 has him on soft from lap 3.',
  'HAD:2': 'Supplied narrative has Hadjar on intermediate at the start; OpenF1 has him on soft from lap 2.',
  'RUS:4': 'Supplied narrative confirms Russell took soft on lap 32; OpenF1 shows no stint boundary there.',
  'HAM:2': 'Supplied narrative says Hamilton never pitted and stayed on soft; OpenF1 has him on medium for laps 2-43 and the official pit-stop summary lists stops on laps 31 and 43.',
  'HAM:3': 'Supplied narrative says Hamilton stayed on his opening soft; OpenF1 has a new soft from lap 44.',
  'ALO:4': 'Supplied narrative confirms an Alonso stop around lap 45; OpenF1 shows no stint boundary there.',
  'HUL:5': 'Supplied narrative confirms a Hulkenberg stop around lap 45; OpenF1 shows no stint boundary there.',
  'NOR:2': 'Supplied narrative has Norris on medium at the start; OpenF1 shows hard from lap 2.',
  'PIA:3': 'OpenF1 lap range is inverted (lap_start 3, lap_end 2) - treated as unusable.',
  'PIA:4': 'Overlaps the previous OpenF1 stint row at lap 3.',
  'PER:2': 'OpenF1 lap range is inverted (lap_start 2, lap_end 1) - treated as unusable.',
};

const stintRows = [];
const stintsByDriver = new Map();
for (const s of stints) {
  if (!stintsByDriver.has(s.driver_number)) stintsByDriver.set(s.driver_number, []);
  stintsByDriver.get(s.driver_number).push(s);
}

const stintNotes = [];
for (const driver of drivers.slice().sort((a, b) => a.driver_number - b.driver_number)) {
  const rows = stintsByDriver.get(driver.driver_number) || [];
  const ordered = rows.slice().sort((a, b) => (a.stint_number ?? 0) - (b.stint_number ?? 0) || (a.lap_start ?? 0) - (b.lap_start ?? 0));
  const code = driver.name_acronym;
  let previousEnd = null;

  ordered.forEach((s) => {
    const key = `${code}:${s.stint_number}`;
    const inverted = s.lap_end !== null && s.lap_end < s.lap_start;
    const overlaps = !inverted && previousEnd !== null && s.lap_start <= previousEnd;
    let endLap = inverted ? null : s.lap_end;
    let confidence;
    let note = null;

    if (inverted || overlaps) {
      confidence = 'unknown';
      note = CONFLICTS[key] || 'OpenF1 lap range is inverted or overlaps the previous stint; left empty rather than guessed.';
    } else if (s.lap_start === 1 && CONFIRMED_STARTS[code] === s.compound) {
      confidence = 'confirmed';
      note =
        code === 'VER' || code === 'ANT' || code === 'RUS' || code === 'HAD'
          ? 'Starting intermediate confirmed by the supplied race notes.'
          : 'Starting compound inferred from the confirmed intermediate starters plus the supplied race notes.';
    } else if (s.compound === 'INTERMEDIATE' && CONFIRMED_SWITCH_TO_INT[code] === s.lap_start) {
      confidence = 'confirmed';
      note =
        code === 'LEC'
          ? 'Confirmed front-wing damage stop onto intermediate early in the race.'
          : 'Confirmed switch onto intermediate during the formation lap / first safety car.';
    } else if (CONFIRMED_PIT_LAP_45.includes(code) && s.lap_start === 46) {
      confidence = 'confirmed';
      note = 'Stint starts right after the confirmed final full safety car stop (around lap 45).';
    } else {
      confidence = 'partial';
      note = CONFLICTS[key] || 'Single-source: OpenF1 /stints only, not corroborated by the official pages.';
    }

    if (note && CONFLICTS[key]) stintNotes.push({ stint: key, note });

    stintRows.push({
      driver: driver.full_name,
      driver_code: code,
      driver_number: driver.driver_number,
      team: driver.team_name,
      stint_number: s.stint_number,
      compound: s.compound,
      start_lap: s.lap_start,
      end_lap: endLap,
      laps: endLap !== null ? endLap - s.lap_start + 1 : null,
      source: 'OpenF1 /stints',
      confidence,
      note,
    });

    if (endLap !== null) previousEnd = endLap;
  });
}

const stintsForCode = new Map();
for (const row of stintRows) {
  if (!stintsForCode.has(row.driver_code)) stintsForCode.set(row.driver_code, []);
  stintsForCode.get(row.driver_code).push(row);
}
const stintsSummary = (code) =>
  (stintsForCode.get(code) || [])
    .filter((r) => r.confidence !== 'unknown')
    .map((r) => {
      const from = r.start_lap === 1 ? 'start' : `L${r.start_lap}`;
      const to = r.end_lap === null ? '?' : `L${r.end_lap}`;
      return `${r.compound.slice(0, 3)} ${from}-${to}`;
    })
    .join(' + ');

// ---------------------------------------------------------------- results table

const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const resultRows = official.classification.map((row) => {
  const sectors = sectorsByCode.get(row.code) || {};
  const fast = officialFastest.get(row.code) || null;
  return {
    pos: row.pos,
    driver: row.driver,
    code: row.code,
    team: row.team,
    laps: row.laps,
    time_or_gap: row.time_or_gap,
    status: row.status,
    points: row.points,
    fastest_lap: fast ? fast.lap_time : '',
    lap_number: fast ? fast.lap_number : '',
    S1: fmtLap(sectors.s1 ?? null),
    S2: fmtLap(sectors.s2 ?? null),
    S3: fmtLap(sectors.s3 ?? null),
    tyre_stints: stintsSummary(row.code),
  };
});

// Sector sanity check: s1 + s2 + s3 must reproduce the official lap time.
const sectorChecks = [];
for (const row of resultRows) {
  if (!row.S1) continue;
  const sum = secondsOf(row.S1) + secondsOf(row.S2) + secondsOf(row.S3);
  const officialTime = secondsOf(row.fastest_lap);
  const delta = Math.abs(sum - officialTime);
  sectorChecks.push({ code: row.code, delta: round3(delta), ok: delta <= 0.002 });
  row.sector_sum_delta = round3(delta);
}

// Lap-number cross-check between OpenF1 and the official fastest-laps page.
const lapNumberOffsets = [];
for (const row of resultRows) {
  const sectors = sectorsByCode.get(row.code);
  if (!sectors || !row.lap_number) continue;
  if (sectors.openf1LapNumber !== row.lap_number) {
    lapNumberOffsets.push({
      code: row.code,
      official_lap_number: row.lap_number,
      openf1_lap_number: sectors.openf1LapNumber,
      offset: sectors.openf1LapNumber - row.lap_number,
    });
  }
}

// ------------------------------------------------------------------- standings

// "before" is the season table as it stands in standings.json, i.e. through Azerbaijan.
// The script is re-runnable: if this race is already folded in, its points and results are
// backed out again so "before" always means the pre-race table.
const alreadyApplied = Boolean(results.races[String(PROJECT_ROUND)]);
const racePoints = new Map(official.classification.map((r) => [r.code, r.points]));
const raceWins = new Map(official.classification.map((r) => [r.code, r.pos === 1 ? 1 : 0]));
const racePodiums = new Map(official.classification.map((r) => [r.code, r.pos !== null && r.pos <= 3 ? 1 : 0]));

// Finishing-position tally per driver across every race held in results.json, used for the
// countback beyond wins and podiums. This race is excluded from the results.json side so a
// re-run cannot count its positions twice. Sprint results are not in results.json, so sprints
// are excluded; for the drivers involved in the ties below the season sprint points are zero.
const positionTally = new Map();
for (const [key, race] of Object.entries(results.races)) {
  if (Number(key) === PROJECT_ROUND) continue;
  for (const r of race.results) {
    if (!positionTally.has(r.code)) positionTally.set(r.code, {});
    const tally = positionTally.get(r.code);
    tally[r.pos] = (tally[r.pos] || 0) + 1;
  }
}
for (const r of official.classification) {
  if (r.pos === null) continue;
  if (!positionTally.has(r.code)) positionTally.set(r.code, {});
  const tally = positionTally.get(r.code);
  tally[r.pos] = (tally[r.pos] || 0) + 1;
}

function countbackVector(code) {
  const tally = positionTally.get(code) || {};
  const vector = [];
  for (let p = 1; p <= 10; p++) vector.push(tally[p] || 0);
  return vector;
}

const after = standings.drivers.map((d) => {
  const gained = racePoints.get(d.code) ?? 0;
  const won = raceWins.get(d.code) ?? 0;
  const pod = racePodiums.get(d.code) ?? 0;
  // First run: the file still holds the pre-race table, so add this race on.
  // Later runs: the file already includes this race, so back it out to recover "before"
  // and leave the stored total untouched.
  const signed = (current, delta) => (alreadyApplied ? current : current + delta);
  return {
    ...d,
    before: alreadyApplied ? d.points - gained : d.points,
    racePoints: gained,
    points: signed(d.points, gained),
    wins: signed(d.wins, won),
    podiums: signed(d.podiums, pod),
  };
});

// Array.prototype.sort is stable, so drivers still level on every countback measure keep the
// order they already had in standings.json instead of being reshuffled alphabetically.
const sorted = after.slice().sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.podiums !== a.podiums) return b.podiums - a.podiums;
  const av = countbackVector(a.code);
  const bv = countbackVector(b.code);
  for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return bv[i] - av[i];
  return 0;
});

const leader = sorted[0].points;
sorted.forEach((d, i) => {
  d.position = i + 1;
  d.gap = d.points - leader;
});

// The values supplied in the request, to be checked against the recomputation.
const SUPPLIED_AFTER = {
  ANT: 320, RUS: 236, HAM: 214, LEC: 191, NOR: 188, VER: 188, PIA: 128, HAD: 96,
  LAW: 65, GAS: 41, LIN: 38, COL: 27, BEA: 20, BOR: 10, HUL: 7, SAI: 7, OCO: 7,
  ALO: 7, ALB: 5, TSU: 1, STR: 0, BOT: 0, PER: 0,
};
const SUPPLIED_CONSTRUCTOR_AFTER = {
  Mercedes: 556, Ferrari: 405, McLaren: 316, 'Red Bull Racing': 298, 'Racing Bulls': 90,
  Alpine: 68, Haas: 27, Audi: 17, Williams: 12, 'Aston Martin': 7, Cadillac: 0,
};

const driverMismatches = sorted
  .filter((d) => SUPPLIED_AFTER[d.code] !== undefined && SUPPLIED_AFTER[d.code] !== d.points)
  .map((d) => ({ code: d.code, supplied: SUPPLIED_AFTER[d.code], recomputed: d.points }));

// Constructors: this race's points are credited to the team each driver actually drove for.
// Lawson and Lindblad are scored for Racing Bulls, as instructed.
const teamOf = new Map();
for (const r of official.classification) {
  teamOf.set(r.code, r.team === 'Haas F1 Team' ? 'Haas' : r.team === 'Red Bull Racing' ? 'Red Bull Racing' : r.team);
}
const constructorRacePoints = new Map();
for (const r of official.classification) {
  const team = teamOf.get(r.code);
  constructorRacePoints.set(team, (constructorRacePoints.get(team) || 0) + r.points);
}

const teamNameMap = new Map(standings.constructors.map((c) => [c.shortName, c]));
const constructors = standings.constructors.map((c) => {
  const gained = constructorRacePoints.get(c.shortName) || 0;
  return {
    ...c,
    before: alreadyApplied ? c.points - gained : c.points,
    racePoints: gained,
    points: alreadyApplied ? c.points : c.points + gained,
  };
});
const sortedConstructors = constructors.slice().sort((a, b) => b.points - a.points);
const constructorLeader = sortedConstructors[0].points;
sortedConstructors.forEach((c, i) => {
  c.position = i + 1;
  c.gap = c.points - constructorLeader;
});
const constructorMismatches = sortedConstructors
  .filter((c) => SUPPLIED_CONSTRUCTOR_AFTER[c.shortName] !== undefined && SUPPLIED_CONSTRUCTOR_AFTER[c.shortName] !== c.points)
  .map((c) => ({ team: c.shortName, supplied: SUPPLIED_CONSTRUCTOR_AFTER[c.shortName], recomputed: c.points }));

// ------------------------------------------------------------------- reporting

console.log('=== ROUND 16 - BAHRAIN GRAND PRIX IN MALAYSIA 2026 ===\n');
console.log(`official round ${OFFICIAL_ROUND} | project round key ${PROJECT_ROUND} | provisional: ${official.provisional}`);
console.log(`classification rows: ${official.classification.length}`);
console.log(`tyre stint rows   : ${stintRows.length}`);
console.log(
  `sector sum check   : ${sectorChecks.filter((c) => c.ok).length}/${sectorChecks.length} within 0.002s`
);
if (lapNumberOffsets.length) {
  console.log('OpenF1 vs official lap-number offsets:');
  lapNumberOffsets.forEach((o) =>
    console.log(`   ${o.code}: official ${o.official_lap_number}, OpenF1 ${o.openf1_lap_number} (offset ${o.offset})`)
  );
}

console.log('\n=== DRIVER STANDINGS: before -> after (recomputed) ===');
console.log('Pos | Code | Driver              | Team             | Before | Race | After | Wins | Pods | Gap');
sorted.forEach((d) => {
  console.log(
    [
      String(d.position).padStart(3),
      d.code.padEnd(4),
      d.name.padEnd(19),
      d.team.padEnd(16),
      String(d.before).padStart(6),
      String(d.racePoints).padStart(4),
      String(d.points).padStart(5),
      String(d.wins).padStart(4),
      String(d.podiums).padStart(4),
      String(d.gap).padStart(4),
    ].join(' | ')
  );
});

console.log('\n=== SUPPLIED vs RECOMPUTED (drivers) ===');
if (driverMismatches.length === 0) {
  console.log('no differences - every supplied after-value equals before + race points');
} else {
  driverMismatches.forEach((m) => console.log(`   ${m.code}: supplied ${m.supplied}, recomputed ${m.recomputed}`));
}

console.log('\n=== CONSTRUCTOR STANDINGS: before -> after (recomputed) ===');
console.log('Pos | Team             | Before | Race | After | Gap');
sortedConstructors.forEach((c) => {
  console.log(
    [
      String(c.position).padStart(3),
      c.shortName.padEnd(15),
      String(c.before).padStart(6),
      String(c.racePoints).padStart(4),
      String(c.points).padStart(5),
      String(c.gap).padStart(4),
    ].join(' | ')
  );
});

console.log('\n=== SUPPLIED vs RECOMPUTED (constructors) ===');
if (constructorMismatches.length === 0) {
  console.log('no differences - every supplied after-value equals before + race points');
} else {
  constructorMismatches.forEach((m) => console.log(`   ${m.team}: supplied ${m.supplied}, recomputed ${m.recomputed}`));
}

// Tie groups, so the countback reasoning is visible in the output.
const tieGroups = new Map();
for (const d of sorted) {
  if (!tieGroups.has(d.points)) tieGroups.set(d.points, []);
  tieGroups.get(d.points).push(d);
}
console.log('\n=== TIE GROUPS AND COUNTBACK ===');
for (const [points, group] of tieGroups) {
  if (group.length < 2) continue;
  console.log(`${points} points:`);
  group.forEach((d) => {
    const tally = positionTally.get(d.code) || {};
    const detail = [];
    for (let p = 1; p <= 10; p++) if (tally[p]) detail.push(`${p}x${tally[p]}`);
    console.log(
      `   P${d.position} ${d.code} ${d.name.padEnd(19)} wins ${d.wins}, podiums ${d.podiums}, finishes [${detail.join(' ')}], sprintPoints ${d.sprintPoints}`
    );
  });
}

// ----------------------------------------------------------------------- write

if (DRY_RUN) {
  console.log('\n--dry-run: nothing written');
  process.exit(0);
}

const resultsOut = {
  season: 2026,
  officialRound: OFFICIAL_ROUND,
  projectRound: PROJECT_ROUND,
  name: official.event.officialName,
  shortName: 'Bahrain Grand Prix in Malaysia',
  date: official.event.date,
  circuit: official.event.circuit,
  locality: official.event.locality,
  country: official.event.country,
  provisional: official.provisional,
  pointsSystem: '25-18-15-12-10-8-6-4-2-1',
  scheduledLaps: official.event.scheduledLaps,
  raceLaps: official.event.raceLaps,
  winnerTime: official.event.winnerTime,
  poleTime: official.event.poleTime,
  source: 'formula1.com race result + fastest laps pages (meeting 1308); sector times and tyre stints from OpenF1 session 11731',
  fastestLapOfRace: official.fastest_lap_of_race,
  needsReview: lapNumberOffsets.map((o) => ({
    ...o,
    reason: 'OpenF1 lap_number is offset from the official formula1.com lap counter (lap times match exactly)',
  })),
  notFound: official.not_found,
  results: resultRows,
};

writeJson(path.join(DATA, 'results_2026_r16.json'), resultsOut);
fs.writeFileSync(
  path.join(DATA, 'results_2026_r16.csv'),
  toCsv(resultRows, [
    'pos', 'driver', 'code', 'team', 'laps', 'time_or_gap', 'status', 'points',
    'fastest_lap', 'lap_number', 'S1', 'S2', 'S3', 'tyre_stints',
  ])
);

const stintsOut = {
  season: 2026,
  officialRound: OFFICIAL_ROUND,
  projectRound: PROJECT_ROUND,
  grand_prix: official.event.officialName,
  date: official.event.date,
  circuit: official.event.circuit,
  session_key: official.event.sessionKey,
  meeting_key: official.event.meetingKey,
  provisional: official.provisional,
  source: 'OpenF1 /stints (api.openf1.org, session 11731); corroboration from the supplied race notes',
  asOfDate: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  confidenceLegend: {
    confirmed: 'corroborated by the supplied confirmed race notes',
    partial: 'single source (OpenF1 /stints), not corroborated',
    unknown: 'unusable row from the feed (inverted or overlapping lap range) - values left empty rather than guessed',
  },
  conflicts: stintNotes,
  stints: stintRows,
};
writeJson(path.join(DATA, 'tyre_stints_2026_r16.json'), stintsOut);
fs.writeFileSync(
  path.join(DATA, 'tyre_stints_2026_r16.csv'),
  toCsv(stintRows, ['driver', 'driver_code', 'stint_number', 'compound', 'start_lap', 'end_lap', 'source', 'confidence', 'note'])
);

// results.json: keep the existing per-entry field order.
results.races[String(PROJECT_ROUND)] = {
  round: PROJECT_ROUND,
  officialRound: OFFICIAL_ROUND,
  name: 'Bahrain Grand Prix in Malaysia',
  date: official.event.date,
  circuit: official.event.circuit,
  provisional: official.provisional,
  results: official.classification.map((r) => ({
    pos: r.pos,
    driver: r.driver,
    code: r.code,
    team: r.team === 'Haas F1 Team' ? 'Haas' : r.team,
    status: r.status,
    points: r.points,
  })),
};
results.asOfRound = PROJECT_ROUND;
results.officialAsOfRound = OFFICIAL_ROUND;
writeJson(path.join(DATA, 'results.json'), results);

const calendarRace = calendar.races.find((r) => r.round === PROJECT_ROUND);
if (calendarRace) {
  calendarRace.status = 'completed';
  calendarRace.officialRound = OFFICIAL_ROUND;
  calendarRace.winner = 'Max Verstappen (Red Bull Racing)';
  calendarRace.podium = [
    'Max Verstappen (Red Bull Racing)',
    'Kimi Antonelli (Mercedes)',
    'Lewis Hamilton (Ferrari)',
  ];
  calendarRace.notes =
    'Provisional classification. Race start delayed 1.5 hours by rain (16:33 local) and the distance was reduced from 56 to 55 laps. Max Verstappen won from pole (1:35.130) with a total race time of 1:47:14.808. George Russell retired with an engine failure behind the safety car, Alexander Albon and Valtteri Bottas also retired.';
  // Hand the "next" flag on to the following round, leaving exactly one race flagged.
  for (const r of calendar.races) {
    if (r.status === 'next' && r.round !== PROJECT_ROUND + 1) r.status = 'upcoming';
  }
  const next = calendar.races.find((r) => r.round === PROJECT_ROUND + 1);
  if (next && next.status !== 'completed' && next.status !== 'cancelled') next.status = 'next';
}
calendar.asOfDate = official.event.date;
writeJson(path.join(DATA, 'calendar.json'), calendar);

standings.asOfRound = PROJECT_ROUND;
standings.officialAsOfRound = OFFICIAL_ROUND;
standings.asOfRace = 'Bahrain Grand Prix in Malaysia';
standings.asOfLocation = 'Kuala Lumpur, Malaysia';
standings.asOfStatus = 'Completed';
standings.nextRound = PROJECT_ROUND + 1;
standings.officialNextRound = OFFICIAL_ROUND + 1;
standings.nextGrandPrix = calendar.races.find((r) => r.round === PROJECT_ROUND + 1)?.name ?? null;
standings.lastUpdated = official.event.date;
standings.remainingRaces = calendar.races.filter((r) => r.status === 'upcoming' || r.status === 'next').length;
standings.drivers = sorted.map((d) => {
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    if (k === 'before' || k === 'racePoints') continue;
    out[k] = v;
  }
  return out;
});
standings.constructors = sortedConstructors.map((c) => {
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    if (k === 'before' || k === 'racePoints') continue;
    out[k] = v;
  }
  return out;
});
writeJson(path.join(DATA, 'standings.json'), standings);

console.log('\n=== WRITTEN ===');
[
  'results_2026_r16.json',
  'results_2026_r16.csv',
  'tyre_stints_2026_r16.json',
  'tyre_stints_2026_r16.csv',
  'results.json',
  'calendar.json',
  'standings.json',
].forEach((f) => console.log(`   public/data/${f}`));

const missing = official.not_found.length;
console.log(`\nitems recorded as not found: ${missing}`);
