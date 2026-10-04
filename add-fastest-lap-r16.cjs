// Appends round 16 (Bahrain Grand Prix in Malaysia 2026, Sepang) to fastest_laps_2026.json.
//
// Verstappen's fastest lap 1:38.220 on lap 55. The lap time is taken from the official
// formula1.com fastest-laps page (1:38.220, avg 203.164 km/h); OpenF1 /laps reports the same
// lap as 98.220 s, and its three sector durations sum exactly to 98.220. Sectors are therefore
// filled from OpenF1 (the file's native source), while the lap time follows the official value.
// This is recorded in needs_review so the differing source for the sectors is explicit.
//
// Usage:
//   node add-fastest-lap-r16.cjs            apply
//   node add-fastest-lap-r16.cjs --dry-run  validate only, write nothing

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'public', 'data');
const CACHE = path.join(__dirname, 'cache', 'round-16-bahrain-malaysia');
const DRY = process.argv.includes('--dry-run');

const file = path.join(DATA, 'fastest_laps_2026.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// official values, from the formula1.com fastest-laps page for meeting 1308
const OFFICIAL_LAP_TIME = '1:38.220';
const OFFICIAL_LAP_SECONDS = 98.22;
const OFFICIAL_LAP_NUMBER = 55;
const AVG_SPEED = 203.164;

// OpenF1 /laps sector durations for the same lap (driver_number 3 = Verstappen)
const laps = JSON.parse(fs.readFileSync(path.join(CACHE, 'openf1_laps_session_11731.json'), 'utf8'));
const drivers = JSON.parse(fs.readFileSync(path.join(CACHE, 'openf1_drivers_session_11731.json'), 'utf8'));
const verNum = drivers.find((d) => d.name_acronym === 'VER').driver_number;
const lap55 = laps.find((l) => l.driver_number === verNum && l.lap_number === OFFICIAL_LAP_NUMBER);
if (!lap55) throw new Error('OpenF1 has no lap 55 for Verstappen');

const s1 = lap55.duration_sector_1;
const s2 = lap55.duration_sector_2;
const s3 = lap55.duration_sector_3;
const sum = Number((s1 + s2 + s3).toFixed(3));

const failures = [];
function check(label, ok, detail) {
  if (!ok) failures.push(detail ? `${label} - ${detail}` : label);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail && !ok ? ` - ${detail}` : ''}`);
}

console.log('=== FASTEST LAP - ROUND 16 ===');
check('OpenF1 lap 55 duration equals the official lap time', lap55.lap_duration === OFFICIAL_LAP_SECONDS,
  `OpenF1 ${lap55.lap_duration}s vs official ${OFFICIAL_LAP_SECONDS}s`);
check('the three sector durations sum exactly to the lap time', sum === OFFICIAL_LAP_SECONDS, `sum ${sum}s`);
check('no lap-number offset for this lap', lap55.lap_number === OFFICIAL_LAP_NUMBER);
check('round 16 is not already present', !data.races.some((r) => r.round === 16));
check('the file holds rounds 1-15 contiguously', data.races.every((r, i) => r.round === i + 1));
check('every existing entry is verified', data.races.every((r) => r.verified === true));

if (failures.length) {
  console.log('\nblocked: not writing');
  process.exit(1);
}

const entry = {
  round: 16,
  grand_prix: 'Bahrain Grand Prix in Malaysia',
  circuit: 'sepang',
  date: '2026-10-04',
  driver_name: 'Max VERSTAPPEN',
  driver_code: 'VER',
  team: 'Red Bull Racing',
  lap_number: OFFICIAL_LAP_NUMBER,
  lap_time: OFFICIAL_LAP_SECONDS,
  s1,
  s2,
  s3,
  source: 'formula1.com fastest-laps page (lap time, lap number); OpenF1 /laps (sector durations)',
  verified: true,
};

data.races.push(entry);

data.needs_review.push({
  round: 16,
  grand_prix: 'Bahrain Grand Prix in Malaysia',
  reason:
    'Lap time and lap number are the official formula1.com values (1:38.220, lap 55, 203.164 km/h). ' +
    'The sector durations come from OpenF1 /laps, which reports the same lap as 98.220 s and whose ' +
    'three sectors sum exactly to 98.220. A conflicting 1:38.511 on f1-fansite was rejected (three ' +
    'sources carry 1:38.220). The fastest-lap tyre for this lap was not published by any source.',
  official_lap_time: OFFICIAL_LAP_TIME,
  official_average_speed_kph: AVG_SPEED,
  openf1_lap_duration: lap55.lap_duration,
  rejected_alternative: '1:38.511 (f1-fansite)',
  driver_code: 'VER',
});

data.asOfDate = '2026-10-04';
data.generatedAt = new Date().toISOString();

if (DRY) {
  console.log('\n--dry-run: nothing written');
  process.exit(0);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

console.log(`\n=== WRITTEN ===\n  public/data/fastest_laps_2026.json (rounds 1-${data.races.length})`);
console.log('\nnew entry:');
console.log(JSON.stringify(entry, null, 2));