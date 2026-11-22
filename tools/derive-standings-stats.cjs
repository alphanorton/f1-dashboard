#!/usr/bin/env node
/**
 * Fills the derived columns of standings.json (wins, podiums, sprintPoints) from results.json, so the
 * numbers can never drift from the race data. Wins and podiums are Grand Prix only (sprints don't count,
 * as in the official statistics). For constructors, wins/podiums count every car's result.
 *
 *   node tools/derive-standings-stats.cjs          # check only, exit 1 if the file is out of date
 *   node tools/derive-standings-stats.cjs --write  # update standings.json
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'data');
const resultsPath = path.join(dir, 'results.json');
const standingsPath = path.join(dir, 'standings.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const standings = JSON.parse(fs.readFileSync(standingsPath, 'utf8'));

const drv = {}, team = {};
const bump = (o, k, f, n) => { (o[k] ||= { wins: 0, podiums: 0, sprintPoints: 0 })[f] += n; };
for (const race of Object.values(results.races)) {
  for (const r of race.results) {
    if (r.pos === 1 && r.status === 'Finished') { bump(drv, r.code, 'wins', 1); bump(team, r.team, 'wins', 1); }
    if (r.pos != null && r.pos <= 3 && r.status === 'Finished') { bump(drv, r.code, 'podiums', 1); bump(team, r.team, 'podiums', 1); }
  }
  for (const r of race.sprint || []) { bump(drv, r.code, 'sprintPoints', r.points); bump(team, r.team, 'sprintPoints', r.points); }
}

let changed = 0;
const set = (obj, key, val) => { if (obj[key] !== val) { obj[key] = val; changed++; } };
for (const d of standings.drivers) {
  const s = drv[d.code] || { wins: 0, podiums: 0, sprintPoints: 0 };
  set(d, 'wins', s.wins); set(d, 'podiums', s.podiums); set(d, 'sprintPoints', s.sprintPoints);
}
// constructors are matched by short name ("Mercedes", "Red Bull Racing", ...) as used in results.json
const alias = (c) => Object.keys(team).find((t) => t === c.shortName) ?? Object.keys(team).find((t) => c.name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(c.shortName.toLowerCase()));
for (const c of standings.constructors) {
  const key = alias(c);
  const s = (key && team[key]) || { wins: 0, podiums: 0, sprintPoints: 0 };
  set(c, 'wins', s.wins); set(c, 'podiums', s.podiums);
}
if (process.argv.includes('--write')) {
  fs.writeFileSync(standingsPath, JSON.stringify(standings, null, 2) + '\n');
  console.log(`standings.json updated (${changed} value(s) changed)`);
} else if (changed) {
  console.error(`standings.json is out of date (${changed} derived value(s) differ). Run with --write.`);
  process.exit(1);
} else console.log('standings.json derived stats are up to date');
