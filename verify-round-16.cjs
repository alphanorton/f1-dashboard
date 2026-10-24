// Verifies the round 16 - Bahrain Grand Prix in Malaysia 2026 data that was folded into the
// dashboard. Reads the JSON files in public/data and checks them against each other, in the
// same spirit as verify-rounds.cjs and verify-results.cjs.
//
// Usage:
//   node verify-round-16.cjs
//
// Exits non-zero if any check fails.

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'public', 'data');
const load = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));

const results = load('results.json');
const calendar = load('calendar.json');
const standings = load('standings.json');
const r16 = load('results_2026_r16.json');
const stints = load('tyre_stints_2026_r16.json');
const fastestLaps = load('fastest_laps_2026.json');
const verLap = load('verstappen_fastest_lap.json');

const OFFICIAL_ROUND = 16;
const PROJECT_ROUND = 18;
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${label}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log('=== ROUND 16 DATA VERIFICATION ===\n');

console.log('--- classification ---');
check('results_2026_r16.json holds a full 22-car classification', r16.results.length === 22, `got ${r16.results.length}`);
check(
  'every classified position matches the points table',
  r16.results.every((r) => r.points === (r.pos !== null && r.pos <= 10 ? POINTS[r.pos - 1] : 0))
);
check(
  'positions 1-19 are filled and the three retirements carry null',
  r16.results.filter((r) => r.pos === null).length === 3 &&
    r16.results.filter((r) => r.pos !== null).every((r) => r.pos >= 1 && r.pos <= 19)
);
check('winner is Verstappen on 25 points', r16.results[0].code === 'VER' && r16.results[0].points === 25);
check('Russell retired with no points', (() => {
  const r = r16.results.find((x) => x.code === 'RUS');
  return r && r.pos === null && r.points === 0;
})());
check('the race is flagged provisional, as formula1.com does', r16.provisional === true);
check('race distance was reduced from 56 to 55 laps', r16.scheduledLaps === 56 && r16.raceLaps === 55);

console.log('\n--- fastest lap and sectors ---');
check('fastest lap of the race is Verstappen on lap 55', (() => {
  const f = r16.fastestLapOfRace;
  return f && f.code === 'VER' && f.lap_number === 55 && f.lap_time === '1:38.220';
})());
const seconds = (t) => {
  const [m, s] = String(t).split(':');
  return parseInt(m, 10) * 60 + parseFloat(s);
};
const sectorRows = r16.results.filter((r) => r.S1 && r.S2 && r.S3 && r.fastest_lap);
check(`sectors present for all ${sectorRows.length} drivers`, sectorRows.length === r16.results.length);
const badSectors = sectorRows.filter(
  (r) => Math.abs(seconds(r.S1) + seconds(r.S2) + seconds(r.S3) - seconds(r.fastest_lap)) > 0.002
);
check('sector times sum to the official lap time within 0.002s', badSectors.length === 0, badSectors.map((r) => r.code).join(','));
check(
  'every driver has a fastest lap and lap number from the official page',
  r16.results.every((r) => r.fastest_lap !== '' && r.lap_number !== '')
);
console.log(`      lap-number offsets vs OpenF1 recorded in needsReview: ${r16.needsReview.length}`);

console.log('\n--- fastest lap ---');
const flEntry = fastestLaps.races.find((r) => r.round === OFFICIAL_ROUND);
check('fastest_laps_2026.json now holds round 16', Boolean(flEntry));
check('it records Verstappen on lap 55', flEntry && flEntry.driver_code === 'VER' && flEntry.lap_number === 55);
check('lap_time is 98.220 s, which is 1:38.220', flEntry && flEntry.lap_time === 98.22);
check('the circuit slug is sepang', flEntry && flEntry.circuit === 'sepang');
check('its sectors sum to the lap time', flEntry &&
  Math.abs(flEntry.s1 + flEntry.s2 + flEntry.s3 - flEntry.lap_time) < 0.0005,
  flEntry ? `sum ${(flEntry.s1 + flEntry.s2 + flEntry.s3).toFixed(3)}` : '');
check('the race result row agrees on lap number and lap time', (() => {
  const ver = r16.results.find((r) => r.code === 'VER');
  return ver && flEntry && Number(ver.lap_number) === flEntry.lap_number && ver.fastest_lap === '1:38.220';
})());
check('fastest_laps_2026.json rounds stay contiguous from 1', (() => {
  const rounds = fastestLaps.races.map((r) => r.round);
  return rounds.every((v, i) => v === i + 1);
})());
check('the source difference for the sectors is recorded in needs_review', (() => {
  const note = (fastestLaps.needs_review || []).find((n) => n.round === OFFICIAL_ROUND);
  return Boolean(note) && /OpenF1/.test(note.reason || '') && /1:38\.511/.test(note.reason || '');
})());
check('verstappen_fastest_lap.json carries 1:38.220 on lap 55 at 203.164 km/h', (() => {
  const f = verLap.fastest_lap;
  return f.time === '1:38.220' && f.lap_number === 55 && f.average_speed_kph === 203.164 && f.fastest_of_race === true;
})());
check('its S1/S2/S3 are left empty and flagged as not found', (() => {
  const f = verLap.fastest_lap;
  return f.S1 === '' && f.S2 === '' && f.S3 === '' && f.sectors_note.includes('یافت نشد');
})());
check('its tyre compound is left empty', verLap.fastest_lap.tyre_compound === '');
check('the rejected 1:38.511 is recorded as a conflict', (() => {
  const c = verLap.conflicts || [];
  return c.some((x) => JSON.stringify(x).includes('1:38.511') && /1:38\.220/.test(x.resolution || ''));
})());
check('best_sector_of_race is kept separate and marked unconfirmed', (() => {
  const b = verLap.best_sector_of_race;
  return b && b.S1 === 24.992 && b.S1_driver === 'Lewis Hamilton' &&
    b.S2 === 32.883 && b.S2_driver === 'Max Verstappen' &&
    b.S3 === 39.821 && b.S3_driver === 'Max Verstappen' &&
    b.source === 'f1-fansite' && b.confidence === 'unconfirmed';
})());

console.log('\n--- tyre stints ---');
check('stint rows cover all 22 drivers', new Set(stints.stints.map((s) => s.driver_code)).size === 22);
check('stint numbers start at 1 for every driver', stints.stints.every((s) => s.stint_number >= 1));
check(
  'every stint carries a source',
  stints.stints.every((s) => typeof s.source === 'string' && s.source.length > 0)
);
check(
  'confidence is only confirmed/partial/unknown',
  stints.stints.every((s) => ['confirmed', 'partial', 'unknown'].includes(s.confidence))
);
check(
  'unknown rows leave the compound empty rather than guessing',
  stints.stints.filter((s) => s.confidence === 'unknown').every((s) => s.compound === '')
);
check(
  'compound is filled on every confirmed or partial row',
  stints.stints.filter((s) => s.confidence !== 'unknown').every((s) => s.compound !== '')
);
check(
  'no stint runs past the 55-lap race distance',
  stints.stints.every((s) => s.start_lap <= 55 && (s.end_lap === null || s.end_lap <= 55))
);
check(
  'every stint ends before the next one starts, from lap 1',
  (() => {
    const by = {};
    for (const s of stints.stints) (by[s.driver_code] = by[s.driver_code] || []).push(s);
    return Object.values(by).every((rows) =>
      rows.every((s, i) => (i === 0 ? s.start_lap === 1 : s.start_lap === rows[i - 1].end_lap + 1))
    );
  })()
);
check(
  'stint lengths sum to the laps each driver actually raced',
  (() => {
    const by = {};
    for (const s of stints.stints) by[s.driver_code] = (by[s.driver_code] || 0) + s.laps;
    return r16.results.every((r) => by[r.code] === r.laps);
  })()
);
check(
  'the five drivers with no confirmed starting compound have every compound empty',
  (() => {
    const noConfirmed = ['LAW', 'LIN', 'OCO', 'SAI', 'ALB'];
    return noConfirmed.every((code) =>
      stints.stints.filter((s) => s.driver_code === code).every((s) => s.compound === '')
    );
  })()
);
check(
  'the 17 drivers with a confirmed starting compound have exactly one confirmed row',
  (() => {
    const confirmedStarters = [
      'VER', 'ANT', 'RUS', 'HAD', 'PER', 'PIA', 'BOR', 'STR', 'HUL',
      'HAM', 'LEC', 'GAS', 'BEA', 'BOT', 'COL', 'NOR', 'ALO',
    ];
    const perDriver = {};
    for (const s of stints.stints) {
      if (s.confidence !== 'confirmed' || s.stint_number !== 1) continue;
      perDriver[s.driver_code] = (perDriver[s.driver_code] || 0) + 1;
    }
    return confirmedStarters.every((code) => perDriver[code] === 1);
  })()
);
check(
  "Russell's unsourced lap-32 soft is held at confidence=partial",
  (() => {
    const row = stints.stints.find((s) => s.driver_code === 'RUS' && s.stint_number === 3);
    return row && row.compound === 'SOFT' && row.confidence === 'partial' && row.start_lap === 33;
  })()
);
check(
  'the stint table records what could not be found',
  Array.isArray(stints.notFound) && stints.notFound.length >= 2 &&
    stints.notFound.every((n) => typeof n.result === 'string' && n.result.includes('یافت نشد'))
);
check(
  'the stint table records the supplied-vs-official DNF conflicts',
  ['RUS', 'ALB', 'BOT'].every((code) =>
    stints.conflicts.some((x) => x.driver_code === code && x.supplied && x.official)
  )
);
check(
  'the corrected pit laps are in place for the drivers named in the fix list',
  (() => {
    const impliedPits = (code) => {
      const rows = stints.stints.filter((s) => s.driver_code === code);
      return rows.slice(1).map((s) => s.start_lap - 1);
    };
    return JSON.stringify(impliedPits('VER')) === JSON.stringify([9, 33, 43]) &&
      JSON.stringify(impliedPits('ANT')) === JSON.stringify([9, 33, 44]) &&
      JSON.stringify(impliedPits('HAM')) === JSON.stringify([31, 43]) &&
      JSON.stringify(impliedPits('LEC')) === JSON.stringify([3, 9, 28, 43]) &&
      JSON.stringify(impliedPits('RUS')) === JSON.stringify([9, 32, 44]);
  })()
);
check(
  'the results tyre_stints column agrees with the rebuilt stint table',
  (() => {
    const summary = (code) => {
      const rows = stints.stints.filter((s) => s.driver_code === code).sort((a, b) => a.stint_number - b.stint_number);
      const abbr = { INTERMEDIATE: 'INT', SOFT: 'SOF', MEDIUM: 'MED', HARD: 'HAR', '': 'UNK' };
      return rows
        .map((s, i) => `${abbr[s.compound]} ${i === 0 ? 'start' : `L${s.start_lap}`}-L${s.end_lap}`)
        .join(' + ');
    };
    return r16.results.every((r) => r.tyre_stints === summary(r.code));
  })()
);
const counts = stints.stints.reduce((acc, s) => {
  acc[s.confidence] = (acc[s.confidence] || 0) + 1;
  return acc;
}, {});
console.log(`      confidence split: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')}`);

console.log('\n--- standings ---');
check('standings snapshot is current through project round 19 (Singapore)', standings.asOfRound === 19);
check('standings snapshot records official round 17 alongside project round 19', standings.officialAsOfRound === 17);
check('driver positions are 1..22 with no gaps or repeats', (() => {
  const p = standings.drivers.map((d) => d.position);
  return p.length === 22 && p.every((v, i) => v === i + 1);
})());
check('points are in non-increasing order', (() => {
  const p = standings.drivers.map((d) => d.points);
  return p.every((v, i) => i === 0 || p[i - 1] >= v);
})());
check('leader carries a zero gap', standings.drivers[0].gap === 0);
check(
  'every gap equals points minus the leader',
  standings.drivers.every((d) => d.gap === standings.drivers[0].points - d.points)
);
check('Norris is P6 on 201 points and Verstappen P4 on 221 points', (() => {
  const nor = standings.drivers.find((d) => d.code === 'NOR');
  const ver = standings.drivers.find((d) => d.code === 'VER');
  return nor.points === 201 && ver.points === 221 && nor.position === 6 && ver.position === 4;
})());
check('Alonso gained 4 points to reach 7', (() => {
  const a = standings.drivers.find((d) => d.code === 'ALO');
  return a.points === 7;
})());
check('constructor positions are 1..11', (() => {
  const p = standings.constructors.map((c) => c.position);
  return p.every((v, i) => v === i + 1);
})());
check(
  'constructor gaps equal points minus the leader',
  standings.constructors.every((c) => c.gap === standings.constructors[0].points - c.points)
);

console.log('\n--- cross-file consistency ---');
check('results.json holds the race under the project round key', Boolean(results.races[String(PROJECT_ROUND)]));
check('that entry records the official round too', results.races[String(PROJECT_ROUND)].officialRound === OFFICIAL_ROUND);
check(
  'results.json entry keeps the dashboard field order',
  results.races[String(PROJECT_ROUND)].results.every(
    (r) => Object.keys(r).join(',') === 'pos,driver,code,team,status,points'
  )
);
check(
  'calendar marks the race completed with the winner',
  (() => {
    const r = calendar.races.find((x) => x.round === PROJECT_ROUND);
    return r && r.status === 'completed' && /Verstappen/.test(r.winner || '');
  })()
);
check(
  'calendar and results agree on the race name',
  (() => {
    const r = calendar.races.find((x) => x.round === PROJECT_ROUND);
    return r && r.name === results.races[String(PROJECT_ROUND)].name;
  })()
);
check('standings.asOfRace matches the latest race name', standings.asOfRace === results.races[String(standings.asOfRound)].name);
check(
  'the next round is flagged on exactly one calendar race',
  calendar.races.filter((r) => r.status === 'next').length === 1
);
check(
  'the driver totals in the race sum to the driver points awarded',
  (() => {
    const raceTotal = r16.results.reduce((sum, r) => sum + r.points, 0);
    // 25+18+15+12+10+8+6+4+2+1
    return raceTotal === 101;
  })()
);

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
