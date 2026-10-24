const fs = require('node:fs');
const path = require('node:path');
const root = path.join(process.cwd(), 'public', 'data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const calendar = read('calendar.json');
const results = read('results.json');
const standings = read('standings.json');
const drivers = read('drivers.json');
const constructors = read('constructors.json');
const fastest = read('fastest_laps_2026.json');
const detailed = read('results_2026_r16.json');
const stints = read('tyre_stints_2026_r16.json');
let errors = 0;
let warnings = 0;
const fail = (m) => { errors++; console.error(`FAIL  ${m}`); };
const warn = (m) => { warnings++; console.warn(`WARN  ${m}`); };
const pass = (m) => console.log(`PASS  ${m}`);
const assert = (condition, message) => condition ? pass(message) : fail(message);

console.log('=== EHI F1 DATA INTEGRITY AUDIT ===');

// Calendar schema and round integrity.
assert(calendar.season === 2026, 'calendar season is 2026');
assert(Array.isArray(calendar.races) && calendar.races.length > 0, 'calendar has races');
assert(calendar.totalRounds === calendar.races.filter(r => r.status !== 'cancelled').length, 'calendar totalRounds excludes cancelled schedule slots');
const rounds = calendar.races.map(r => r.round);
assert(rounds.every((r, i) => Number.isInteger(r) && r === i + 1), 'calendar round numbers are unique and sequential');
assert(new Set(calendar.races.map(r => r.name)).size === calendar.races.length, 'calendar race names are unique');
assert(calendar.races.every(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && !Number.isNaN(Date.parse(r.date))), 'calendar dates use valid ISO dates');
const completed = calendar.races.filter(r => r.status === 'completed');
const cancelled = calendar.races.filter(r => r.status === 'cancelled');
assert(calendar.races.filter(r => r.status === 'next').length <= 1, 'at most one calendar race is marked next');
assert(cancelled.every(r => !results.races[String(r.round)]), 'cancelled events do not have fabricated race classifications');

// Race result integrity, keyed by project calendar round (which includes cancelled slots).
assert(results.season === calendar.season, 'results and calendar seasons match');
assert(results.asOfRound === Number(results.asOfRound) && results.asOfRound >= 1, 'results asOfRound is numeric');
const resultKeys = Object.keys(results.races || {});
assert(resultKeys.length === completed.length, 'results exist for every completed race and no cancelled/upcoming race');
for (const key of resultKeys) {
  const race = results.races[key];
  const round = Number(key);
  const event = calendar.races.find(r => r.round === round);
  if (!event) { fail(`results round ${key} has no matching calendar row`); continue; }
  assert(event.status === 'completed', `R${key} is marked completed in the calendar`);
  assert(race.round === round, `R${key} stored round matches its key`);
  assert(race.name === event.name, `R${key} race name matches the calendar`);
  assert(race.date === event.date, `R${key} date matches the calendar`);
  const winner = race.results?.find(r => r.pos === 1)?.driver;
  assert(Boolean(winner), `R${key} has a classified winner`);
  assert((event.winner || '').startsWith(winner || '\u0000'), `R${key} winner matches the calendar`);
  assert(Array.isArray(race.results) && race.results.length === 22, `R${key} has 22 driver result rows`);
  const codes = race.results.map(r => r.code);
  assert(new Set(codes).size === codes.length, `R${key} has no duplicate driver codes`);
  const positions = race.results.filter(r => Number.isInteger(r.pos)).map(r => r.pos);
  assert(new Set(positions).size === positions.length, `R${key} has no duplicate classified positions`);
  assert(race.results.every(r => ['Finished', 'DNF', 'DNS', 'DSQ', 'NC'].includes(r.status)), `R${key} uses recognized result statuses`);
  assert(race.results.every(r => Number.isFinite(r.points) && r.points >= 0), `R${key} points are non-negative numbers`);
}

// Championship snapshot integrity.
assert(standings.season === calendar.season, 'standings season is 2026');
assert(Array.isArray(standings.drivers) && standings.drivers.length === 22, 'driver standings contain 22 drivers');
assert(Array.isArray(standings.constructors) && standings.constructors.length === 11, 'constructor standings contain 11 teams');
assert(standings.asOfRace === results.races[String(standings.asOfRound)]?.name, 'standings snapshot race matches the results snapshot');
assert(standings.officialAsOfRound === results.officialAsOfRound, 'official-round metadata agrees across snapshots');
assert(standings.drivers.every((d, i) => d.position === i + 1), 'driver standings positions are contiguous');
assert(standings.constructors.every((c, i) => c.position === i + 1), 'constructor standings positions are contiguous');
assert(standings.drivers.every((d, i, a) => i === 0 || a[i - 1].points >= d.points), 'driver standings are sorted by points');
assert(standings.constructors.every((c, i, a) => i === 0 || a[i - 1].points >= c.points), 'constructor standings are sorted by points');
assert(standings.drivers.every(d => d.gap === standings.drivers[0].points - d.points), 'driver points gaps are correct');
assert(standings.constructors.every(c => c.gap === standings.constructors[0].points - c.points), 'constructor points gaps are correct');
const latestRaceRound = Math.max(...resultKeys.map(Number));
assert(standings.asOfRound === latestRaceRound, 'standings snapshot is aligned with the latest race results');

// The detailed Sepang dataset intentionally maps official round 16 to project calendar round 18.
assert(detailed.officialRound === 16 && detailed.projectRound === 18, 'Sepang detailed dataset records official/project round mapping');
assert(results.races[String(detailed.projectRound)]?.officialRound === detailed.officialRound, 'Sepang round mapping agrees with results.json');
assert(Array.isArray(detailed.results) && detailed.results.length === 22, 'detailed Sepang classification contains 22 drivers');
assert(Array.isArray(stints.stints) && stints.stints.length > 0, 'detailed tyre stint dataset is present');
assert(stints.stints.every(s => ['confirmed', 'partial', 'unknown'].includes(s.confidence)), 'tyre stint confidence values are valid');
assert(stints.stints.every(s => s.confidence === 'unknown' || Boolean(s.compound)), 'known/partial tyre stints have a compound');
assert(stints.stints.every(s => Number.isInteger(s.start_lap) && Number.isInteger(s.end_lap) && s.start_lap >= 1 && s.end_lap >= s.start_lap && s.end_lap <= detailed.raceLaps), 'tyre stints have valid lap ranges');

// Driver and constructor reference data sanity.
{
  const refNum = new Map(drivers.MRData.DriverTable.Drivers.map(x => [x.code, Number(x.permanentNumber)]));
  const tyreNum = new Map(stints.stints.map(x => [x.driver_code, x.driver_number]));
  assert(standings.drivers.every(x => refNum.get(x.code) === x.driverNumber), 'driver numbers agree between standings.json and drivers.json');
  assert([...tyreNum].every(([c, n]) => refNum.get(c) === n), 'driver numbers agree between tyre stints and drivers.json');
  assert(new Set(standings.drivers.map(x => x.driverNumber)).size === standings.drivers.length, 'driver numbers are unique on the 2026 grid');
}
assert(Array.isArray(drivers.MRData?.DriverTable?.Drivers) && drivers.MRData.DriverTable.Drivers.length >= 22, 'driver reference data is populated');
assert(Array.isArray(constructors.MRData?.ConstructorTable?.Constructors) && constructors.MRData.ConstructorTable.Constructors.length >= 11, 'constructor reference data is populated');
assert(Array.isArray(fastest.races) && fastest.races.length > 0, 'fastest-lap dataset is populated');
const fastestRounds = fastest.races.map(r => r.round);
assert(new Set(fastestRounds).size === fastestRounds.length, 'fastest-lap dataset has no duplicate rounds');

console.log(`\nCompleted events: ${completed.length}; cancelled schedule slots: ${cancelled.length}; race-result snapshots: ${resultKeys.length}`);
console.log(`Audit result: ${errors} error(s), ${warnings} warning(s).`);
if (errors) process.exit(1);
