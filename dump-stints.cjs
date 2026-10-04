const t = require('./public/data/tyre_stints_2026_r16.json');
const r = require('./public/data/results_2026_r16.json');

console.log('=== CURRENT (OpenF1) stints ===');
const by = {};
for (const s of t.stints) (by[s.driver_code] = by[s.driver_code] || []).push(s);
for (const c of ['VER', 'ANT', 'RUS', 'HAM', 'LEC', 'BOT', 'ALB']) {
  console.log(c.padEnd(4), (by[c] || []).map((s) => `${s.compound || '?'} ${s.start_lap}-${s.end_lap}`).join(' | '));
}

console.log('\n=== official laps ===');
console.log(r.results.map((x) => `${x.code}:${x.laps}`).join(' '));

console.log('\n=== compound vocabulary ===', JSON.stringify([...new Set(t.stints.map((s) => s.compound))]));

console.log('\n=== old vs new pit laps (mentions in the task) ===');
const oldPits = {};
for (const c of Object.keys(by)) {
  oldPits[c] = by[c].slice(1).map((s) => s.start_lap - 1);
}
for (const c of ['VER', 'ANT', 'RUS', 'HAM', 'LEC']) {
  console.log(c.padEnd(4), 'old implied pits:', (oldPits[c] || []).join(', '));
}
