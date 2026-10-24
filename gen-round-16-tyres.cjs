// Rebuilds the round 16 tyre-stint table from the supplied RaceFans pit-stop laps, and
// writes Verstappen's fastest-lap record.
//
// Usage:
//   node gen-round-16-tyres.cjs            apply
//   node gen-round-16-tyres.cjs --dry-run  validate only, write nothing
//
// Rules encoded here (from the task):
//   - a stint ENDS on its pit lap; the final stint runs to lap 55 or to the DNF lap
//   - compound is filled ONLY where a confirmed source exists; everything else stays empty
//   - unsourced compound claims are kept with confidence = partial
//   - two completion sources were checked and both failed, so compounds stay empty (see notFound)

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'public', 'data');
const CACHE = path.join(__dirname, 'cache', 'round-16-bahrain-malaysia');
const DRY = process.argv.includes('--dry-run');
const RACE_LAPS = 55;

// --- supplied RaceFans pit-stop table: the lap number on which each driver pitted ---------
const PITS = {
  VER: [9, 33, 43],
  ANT: [9, 33, 44],
  RUS: [9, 32, 44],
  HAM: [31, 43],
  LEC: [3, 9, 28, 43],
  HAD: [9, 31, 44],
  PIA: [9, 33, 45],
  NOR: [9, 34, 45],
  LAW: [9, 30, 45],
  LIN: [9, 28, 43],
  ALO: [9, 31, 45],
  STR: [9, 28, 43],
  HUL: [8, 32, 45],
  BOR: [9, 15, 34, 44],
  PER: [1, 9, 18, 21, 39, 44],
  GAS: [9, 25, 37, 45],
  COL: [9, 31, 42],
  BEA: [10, 24, 38],
  OCO: [9, 29, 41],
  SAI: [9, 26, 42],
  ALB: [9, 16, 29],
  BOT: [],
};

// --- confirmed starting compounds (supplied confirmed list) -------------------------------
const START_INT = ['VER', 'ANT', 'RUS', 'HAD', 'PER', 'PIA', 'BOR', 'STR', 'HUL'];
const START_SOFT = ['HAM', 'LEC', 'GAS', 'BEA', 'BOT', 'COL'];
const START_MED = ['NOR', 'ALO'];
// drivers who were switched onto intermediates before the start
const PRESTART_INT_CHANGE = ['PER', 'PIA', 'BOR', 'STR', 'HUL'];
// compound supplied without a confirmed source -> keep, but at confidence = partial
const UNSOURCED_COMPOUND = { 'RUS:3': 'SOFT' };
// the lap on which the intermediate -> slick switch happened (Hulkenberg pitted a lap earlier)
const INT_TO_SLICK_LAP = { HUL: 8, DEFAULT: 9 };
// supplied DNF narrative, which differs from the official classification - recorded, not applied
const DNF_NARRATIVE = { RUS: 50, ALB: 43, BOT: 9 };

const ABBR = { INTERMEDIATE: 'INT', SOFT: 'SOF', MEDIUM: 'MED', HARD: 'HAR', '': 'UNK' };

const results = JSON.parse(fs.readFileSync(path.join(DATA, 'results_2026_r16.json'), 'utf8'));
const previous = JSON.parse(fs.readFileSync(path.join(DATA, 'tyre_stints_2026_r16.json'), 'utf8'));
const calendar = JSON.parse(fs.readFileSync(path.join(DATA, 'calendar.json'), 'utf8'));
const official = JSON.parse(fs.readFileSync(path.join(CACHE, 'official_reference.json'), 'utf8'));

// keep the display name / car number / team each driver already carries in the existing file
const identity = {};
for (const row of previous.stints) {
  identity[row.driver_code] = { driver: row.driver, driver_number: row.driver_number, team: row.team };
}

const classification = results.results; // already in finishing order
const lapsOf = {};
for (const row of classification) lapsOf[row.code] = row.laps;

const failures = [];
const checks = [];
function check(label, ok, detail) {
  checks.push({ label, ok, detail });
  if (!ok) failures.push(detail ? `${label} - ${detail}` : label);
}

// ---------------------------------------------------------------- build stints
function buildDriver(code) {
  const pits = PITS[code] || [];
  const totalLaps = lapsOf[code];
  const boundaries = [];
  let start = 1;
  for (const pit of pits) {
    boundaries.push([start, pit]);
    start = pit + 1;
  }
  boundaries.push([start, totalLaps]);

  const switchLap = INT_TO_SLICK_LAP[code] ?? INT_TO_SLICK_LAP.DEFAULT;
  const isIntStarter = START_INT.includes(code);

  return boundaries.map(([s, e], i) => {
    const n = i + 1;
    let compound = '';
    let confidence = 'unknown';
    let note = '';
    let source = 'RaceFans pit-stop table';

    if (n === 1) {
      if (isIntStarter) {
        compound = 'INTERMEDIATE';
        confidence = 'confirmed';
        note = PRESTART_INT_CHANGE.includes(code)
          ? 'Starting intermediate: switched onto inters before the start (supplied confirmed notes).'
          : 'Starting intermediate (supplied confirmed list).';
      } else if (START_SOFT.includes(code)) {
        compound = 'SOFT';
        confidence = 'confirmed';
        note = 'Starting soft (supplied confirmed list).';
      } else if (START_MED.includes(code)) {
        compound = 'MEDIUM';
        confidence = 'confirmed';
        note = 'Starting medium (supplied confirmed list).';
      } else {
        note = 'Compound not found in any available source - left empty.';
      }
    } else if (isIntStarter && s === switchLap + 1) {
      note = `Slick after the lap ${switchLap} intermediate stop; exact compound not found - left empty.`;
    } else if (UNSOURCED_COMPOUND[`${code}:${n}`]) {
      compound = UNSOURCED_COMPOUND[`${code}:${n}`];
      confidence = 'partial';
      source = 'RaceFans pit-stop table; compound supplied but unconfirmed';
      note = `Compound supplied for this stint with no confirmed source - held at confidence=partial.`;
    } else {
      note = 'Compound not found in any available source - left empty.';
    }

    if (code === 'PER' && n === 2) {
      note = 'Between the lap 1 and lap 9 stops; compound not confirmed - left empty.';
    }

    const last = i === boundaries.length - 1;
    if (last && totalLaps !== RACE_LAPS) {
      const narrative = DNF_NARRATIVE[code];
      note += ` Final stint; retired after ${totalLaps} laps per the official classification` +
        (narrative ? ` (supplied notes say about lap ${narrative} - recorded as a conflict).` : '.');
    }

    return {
      driver: identity[code].driver,
      driver_code: code,
      driver_number: identity[code].driver_number,
      team: identity[code].team,
      stint_number: n,
      compound,
      start_lap: s,
      end_lap: e,
      laps: e - s + 1,
      source,
      confidence,
      note,
    };
  });
}

const stints = [];
for (const row of classification) stints.push(...buildDriver(row.code));

// ---------------------------------------------------------------- validation
for (const row of classification) {
  const code = row.code;
  const mine = stints.filter((s) => s.driver_code === code);
  const pits = PITS[code] || [];

  check(`${code}: stint count = stops + 1`, mine.length === pits.length + 1,
    `${code} has ${pits.length} stops but ${mine.length} stints`);
  check(`${code}: stint lengths sum to laps raced (${row.laps})`,
    mine.reduce((sum, s) => sum + s.laps, 0) === row.laps,
    `${code} sums to ${mine.reduce((sum, s) => sum + s.laps, 0)}, expected ${row.laps}`);
  check(`${code}: stints are contiguous from lap 1 with no gaps or overlap`,
    mine.every((s, i) => (i === 0 ? s.start_lap === 1 : s.start_lap === mine[i - 1].end_lap + 1)),
    `${code} has a gap/overlap`);
  check(`${code}: no stint runs past lap ${RACE_LAPS}`, mine.every((s) => s.end_lap <= RACE_LAPS));
}
check('all 22 drivers covered', new Set(stints.map((s) => s.driver_code)).size === 22);
check('every stint has a source', stints.every((s) => s.source));
check('confidence only confirmed/partial/unknown',
  stints.every((s) => ['confirmed', 'partial', 'unknown'].includes(s.confidence)));
check('compound left empty whenever it is not confirmed',
  stints.every((s) => (s.confidence === 'unknown' ? s.compound === '' : s.compound !== '')));
check('compound vocabulary is the existing one',
  stints.every((s) => s.compound === '' || ['INTERMEDIATE', 'SOFT', 'MEDIUM', 'HARD'].includes(s.compound)));
check('Russell lap-32 soft held at confidence=partial',
  stints.some((s) => s.driver_code === 'RUS' && s.stint_number === 3 && s.compound === 'SOFT' && s.confidence === 'partial'));

const counts = stints.reduce((acc, s) => { acc[s.confidence] = (acc[s.confidence] || 0) + 1; return acc; }, {});
console.log('=== ROUND 16 - TYRE STINTS REBUILD ===');
console.log(`rows: ${stints.length} | drivers: ${new Set(stints.map((s) => s.driver_code)).size}`);
console.log(`confidence: confirmed=${counts.confirmed || 0} partial=${counts.partial || 0} unknown=${counts.unknown || 0}`);
console.log(`drivers with no confirmed starting compound: ${classification.map((r) => r.code).filter((c) => !START_INT.includes(c) && !START_SOFT.includes(c) && !START_MED.includes(c)).join(', ')}`);
console.log(`pit-count + stint-sum checks: ${checks.filter((c) => c.label.includes('stops + 1') || c.label.includes('sum')).length} run, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL', f);
if (failures.length) {
  console.log('\n-- dry-run/--blocked: refusing to write');
  if (!DRY) process.exit(1);
}

// ---------------------------------------------------------------- serialize
const CSV_HEADER = 'driver,driver_code,stint_number,compound,start_lap,end_lap,source,confidence,note';
const csvField = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) =>
  [CSV_HEADER, ...rows.map((r) =>
    [r.driver, r.driver_code, r.stint_number, r.compound, r.start_lap, r.end_lap, r.source, r.confidence, r.note]
      .map(csvField).join(','))].join('\n') + '\n';

const conflicts = [
  {
    driver_code: 'RUS',
    item: 'Russell DNF lap',
    supplied: 'about lap 50',
    official: '49 laps (formula1.com classification)',
    resolution: 'official laps applied to the final stint; supplied value recorded only',
  },
  {
    driver_code: 'ALB',
    item: 'Albon DNF lap',
    supplied: 'about lap 43, gearbox',
    official: '41 laps (formula1.com classification)',
    resolution: 'official laps applied to the final stint; supplied value recorded only',
  },
  {
    driver_code: 'BOT',
    item: 'Bottas DNF lap',
    supplied: 'stopped in the gravel on lap 9',
    official: '7 laps (formula1.com classification, "spun and retired")',
    resolution: 'official laps applied to the final stint; supplied value recorded only',
  },
  {
    item: 'Verstappen stints',
    supplied: 'pits on laps 9, 33 and 43 (RaceFans)',
    official: 'the previous build (OpenF1) showed soft from lap 2 and no stop after lap 9',
    resolution: 'RaceFans pit-stop table applied; the OpenF1 stint feed is superseded for this round',
  },
  {
    item: 'Hamilton stints',
    supplied: 'two stops only, laps 31 and 43 (RaceFans)',
    official: 'the previous build showed a lap 1 split and a medium for laps 2-43',
    resolution: 'RaceFans pit-stop table applied',
  },
  {
    item: 'Bortoleto start compound',
    supplied: 'switched onto inters before the start',
    official: 'not present in the confirmed starting-compound list',
    resolution: 'intermediate applied - he is on the supplied pre-start-change list',
  },
  {
    item: 'Perez lap 1 pit stop',
    supplied: 'pits on laps 1, 9, 18, 21, 39 and 44',
    official: 'a stop on lap 1 is unusual and is not corroborated anywhere',
    resolution: 'taken at face value (7 stints, 55 laps); flagged here rather than dropped',
  },
];

const notFound = [
  {
    item: 'tyre compound for every stint not on the supplied confirmed list',
    source_checked: 'RaceFans interactive tyre-strategy chart (the URL supplied in the task)',
    result: 'یافت نشد',
    detail: 'Tier 1 WebFetch 403; Tier 2 curl with Chrome headers 403; the body is a Cloudflare "Just a moment" managed challenge. Tier 3 (Interceptor) is not installed on this Windows host and Tier 4 (Bright Data MCP / API key) is not configured. No Wayback snapshot of that URL exists.',
  },
  {
    item: 'tyre compound for every stint not on the supplied confirmed list',
    source_checked: 'FastF1 3.8.3, event "Bahrain Grand Prix" round 16 2026-10-04, race session',
    result: 'یافت نشد',
    detail: 'The event resolves, but session info, driver list, timing, lap count, track status, car and position data all fail to load, so no laps and no stints are available.',
  },
  {
    item: 'sector times S1/S2/S3 of Verstappen fastest lap 1:38.220 (lap 55)',
    source_checked: 'formula1.com fastest-laps page, RaceFans, SpeedWeek',
    result: 'یافت نشد',
    detail: 'The official page publishes lap number, time of day, lap time and average speed only. The three fields are left empty rather than reconstructed by subtraction.',
  },
];

const output = {
  season: results.season,
  officialRound: results.officialRound,
  projectRound: results.projectRound,
  grand_prix: results.name,
  date: results.date,
  circuit: results.circuit,
  session_key: previous.session_key,
  meeting_key: previous.meeting_key,
  provisional: results.provisional,
  source: 'RaceFans pit-stop table (supplied); starting compounds from the supplied confirmed list; stint count and stint-length validation against results_2026_r16.json',
  asOfDate: results.date,
  generatedAt: new Date().toISOString(),
  confidenceLegend: {
    confirmed: 'stint boundaries from the RaceFans pit-stop table; compound on the supplied confirmed list',
    partial: 'stint boundaries from the RaceFans pit-stop table; compound supplied but with no confirmed source',
    unknown: 'stint boundaries from the RaceFans pit-stop table; compound not found in any available source - left empty',
  },
  conflicts,
  notFound,
  stints,
};

// ---- Verstappen fastest lap ----
const verResult = classification.find((r) => r.code === 'VER');
const officialRow = (official.fastest_laps_official || []).find((r) => r.code === 'VER');
const fastestLap = {
  season: results.season,
  officialRound: results.officialRound,
  projectRound: results.projectRound,
  grand_prix: results.name,
  date: results.date,
  circuit: results.circuit,
  driver: verResult.driver,
  driver_code: 'VER',
  team: verResult.team,
  fastest_lap: {
    time: '1:38.220',
    lap_number: 55,
    lap: 'final lap of the race',
    average_speed_kph: officialRow ? officialRow.avg_speed : null,
    average_speed_source: 'formula1.com fastest-laps page for meeting 1308',
    fastest_of_race: true,
    tyre_compound: '',
    tyre_compound_note: 'یافت نشد - the tyre on this lap is not stated by any of the checked sources.',
    S1: '',
    S2: '',
    S3: '',
    sectors_note: 'یافت نشد - sector times for this lap are not published on the official fastest-laps page, on RaceFans or on SpeedWeek, and FastF1 could not load the session. The three fields are left empty; no value was reconstructed by subtraction.',
  },
  best_sector_of_race: {
    note: 'Fastest sector times across the whole race, NOT the sectors of Verstappen fastest lap. Unconfirmed single source, recorded as separate information only.',
    S1: 24.992,
    S1_driver: 'Lewis Hamilton',
    S2: 32.883,
    S2_driver: 'Max Verstappen',
    S3: 39.821,
    S3_driver: 'Max Verstappen',
    source: 'f1-fansite',
    confidence: 'unconfirmed',
  },
  sources: [
    'formula1.com/en/results/2026/races/1308/bahrain/fastest-laps - 1:38.220, lap 55, 203.164 km/h',
    'RaceFans - 1:38.220 on lap 55, fastest lap of the race',
    'SpeedWeek - 1:38.220 on lap 55, fastest lap of the race',
  ],
  conflicts: [
    {
      item: 'fastest lap time',
      values: ['1:38.220 (formula1.com, RaceFans, SpeedWeek)', '1:38.511 (f1-fansite)'],
      resolution: '1:38.220 used - it is carried by three sources including the official results page; the f1-fansite figure is recorded but not used.',
    },
  ],
  notFound: notFound.filter((n) => n.item.startsWith('sector times')),
  generatedAt: new Date().toISOString(),
};

// ---- the tyre_stints column inside results_2026_r16 ----
const shortSummary = (code) =>
  stints.filter((s) => s.driver_code === code)
    .map((s, i) => `${ABBR[s.compound]} ${i === 0 ? 'start' : 'L' + s.start_lap}-L${s.end_lap}`)
    .join(' + ');

console.log('\n--- tyre_stints column (rebuilt) ---');
for (const code of ['VER', 'ANT', 'HAM', 'LEC', 'RUS']) {
  console.log(`${code.padEnd(4)} ${shortSummary(code)}`);
}

if (DRY) {
  console.log('\n--dry-run: nothing written');
  process.exit(failures.length ? 1 : 0);
}

fs.writeFileSync(path.join(DATA, 'tyre_stints_2026_r16.json'), JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync(path.join(DATA, 'tyre_stints_2026_r16.csv'), toCsv(stints));
fs.writeFileSync(path.join(DATA, 'tyre_stints.csv'), toCsv(stints));
fs.writeFileSync(path.join(DATA, 'verstappen_fastest_lap.json'), JSON.stringify(fastestLap, null, 2) + '\n');

for (const row of classification) row.tyre_stints = shortSummary(row.code);
fs.writeFileSync(path.join(DATA, 'results_2026_r16.json'), JSON.stringify(results, null, 2) + '\n');

const csvLines = fs.readFileSync(path.join(DATA, 'results_2026_r16.csv'), 'utf8').split('\n');
const outLines = csvLines.map((line, i) => {
  if (i === 0 || line.trim() === '') return line;
  const cells = line.split(',');
  if (cells.length !== 14) throw new Error(`results csv row ${i} has ${cells.length} cells, expected 14`);
  cells[13] = shortSummary(cells[2]);
  return cells.join(',');
});
fs.writeFileSync(path.join(DATA, 'results_2026_r16.csv'), outLines.join('\n'));

console.log('\n=== WRITTEN ===');
for (const f of ['tyre_stints_2026_r16.json', 'tyre_stints_2026_r16.csv', 'tyre_stints.csv', 'verstappen_fastest_lap.json', 'results_2026_r16.json', 'results_2026_r16.csv']) {
  console.log('  public/data/' + f);
}
console.log(`\nchecks: ${checks.length - failures.length}/${checks.length} passed`);
console.log(`not-found items recorded: ${notFound.length}`);
