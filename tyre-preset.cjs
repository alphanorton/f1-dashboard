#!/usr/bin/env node
// Build a Tyre Strategy preset from a CSV and register it in public/data/tyres/index.json.
//
//   node tyre-preset.cjs stints.csv --season 2026 --gp "Singapore Grand Prix" \
//     --date 2026-10-18 --circuit "Marina Bay" --meeting-key 1310 --session-key 11800 [--provisional]
//
// Required CSV columns: driver, driver_code, driver_number, team, stint_number, compound, start_lap, end_lap
// Optional columns:     confidence (confirmed|partial|unknown), source, note
// Leave `compound` empty when unknown - it is shown as "Unknown", never guessed.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(args.length === 0 ? 1 : 0);
}
const csvPath = args[0];
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const fail = (m) => { console.error(`error: ${m}`); process.exit(1); };

for (const k of ['season', 'gp', 'date', 'meeting-key', 'session-key']) if (!opt(k)) fail(`--${k} is required`);
const date = opt('date');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date must be YYYY-MM-DD');

function splitCsv(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
const lines = fs.readFileSync(csvPath, 'utf8').replace(/\r/g, '').split('\n').filter((l) => l.trim());
const head = splitCsv(lines[0]).map((h) => h.trim());
for (const c of ['driver', 'driver_code', 'driver_number', 'team', 'stint_number', 'start_lap', 'end_lap']) {
  if (!head.includes(c)) fail(`CSV is missing column "${c}"`);
}
const stints = lines.slice(1).map((l, n) => {
  const cells = splitCsv(l); const r = {};
  head.forEach((h, i) => { r[h] = (cells[i] ?? '').trim(); });
  const row = {
    driver: r.driver, driver_code: r.driver_code, driver_number: Number(r.driver_number), team: r.team,
    stint_number: Number(r.stint_number), compound: r.compound ? r.compound.toUpperCase() : null,
    start_lap: Number(r.start_lap), end_lap: Number(r.end_lap),
  };
  if (![row.driver_number, row.stint_number, row.start_lap, row.end_lap].every(Number.isInteger) || row.start_lap < 1 || row.end_lap < row.start_lap) {
    fail(`CSV line ${n + 2}: invalid number or lap range`);
  }
  if (row.compound && !['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].includes(row.compound)) fail(`CSV line ${n + 2}: unknown compound "${r.compound}"`);
  row.laps = row.end_lap - row.start_lap + 1;
  row.confidence = r.confidence || (row.compound ? 'confirmed' : 'unknown');
  if (r.source) row.source = r.source;
  if (r.note) row.note = r.note;
  return row;
});
if (stints.length === 0) fail('CSV has no stint rows');

const preset = {
  season: Number(opt('season')), grand_prix: opt('gp'), date, circuit: opt('circuit'),
  session_key: Number(opt('session-key')), meeting_key: Number(opt('meeting-key')),
  provisional: args.includes('--provisional'), asOfDate: date, generatedAt: new Date().toISOString(), stints,
};
const dir = path.join(__dirname, 'public', 'data', 'tyres');
fs.mkdirSync(dir, { recursive: true });
const file = `${preset.season}_${(opt('slug') || preset.grand_prix.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))}.json`;
fs.writeFileSync(path.join(dir, file), JSON.stringify(preset, null, 2) + '\n');

const indexPath = path.join(dir, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : { presets: [] };
if (!index.presets.some((p) => p.file === file)) index.presets.push({ file });
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(`wrote public/data/tyres/${file} (${stints.length} stints) and registered it in index.json`);
