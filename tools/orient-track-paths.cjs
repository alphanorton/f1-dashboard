#!/usr/bin/env node
/**
 * Makes every traced layout in public/data/track-paths.json run in the circuit's real lap direction.
 *
 * The tracer walks every outline clockwise, so on anti-clockwise circuits the chevrons and the animated
 * cars ran backwards. This reverses those paths (same shape, same start point) and records
 * `lapDirection` on each entry. Idempotent. Sepang and Suzuka are left as traced: Suzuka is a figure of
 * eight (no single direction), and no source was found for Sepang.
 *
 *   node tools/orient-track-paths.cjs          # report only (exit 1 if a path is oriented wrongly)
 *   node tools/orient-track-paths.cjs --write  # fix and save
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'public', 'data', 'track-paths.json');

// Sources: Wikipedia "List of Formula One circuits" (Baku, Las Vegas, Miami: anti-clockwise; Monaco, Monza,
// Spa, Silverstone: clockwise), FIA event documents and circuit guides (Lusail clockwise, Madring clockwise),
// Interlagos and COTA in the anti-clockwise list. Singapore and Yas Marina: general knowledge.
const LAP_DIRECTION = {
  albert_park: 'clockwise', shanghai: 'clockwise', montreal: 'clockwise', monaco: 'clockwise', barcelona: 'clockwise',
  red_bull_ring: 'clockwise', silverstone: 'clockwise', spa: 'clockwise', hungaroring: 'clockwise', zandvoort: 'clockwise',
  monza: 'clockwise', mexico: 'clockwise', madrid: 'clockwise', losail: 'clockwise',
  baku: 'anticlockwise', miami: 'anticlockwise', las_vegas: 'anticlockwise', interlagos: 'anticlockwise',
  cota: 'anticlockwise', singapore: 'anticlockwise', yas_marina: 'anticlockwise',
};

/** "M x,y C a,b c,d e,f ... Z" -> { start, segs:[[c1,c2,end],...] } */
function parse(d) {
  const nums = (d.match(/-?\d+\.?\d*(?:e-?\d+)?/g) || []).map(Number);
  const start = [nums[0], nums[1]];
  const segs = [];
  for (let i = 2; i + 5 < nums.length + 0; i += 6) segs.push([[nums[i], nums[i + 1]], [nums[i + 2], nums[i + 3]], [nums[i + 4], nums[i + 5]]]);
  return { start, segs };
}
const f = (n) => String(Math.round(n * 10) / 10);
function build({ start, segs }) {
  return `M${f(start[0])},${f(start[1])}` + segs.map(([a, b, c]) => `C${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(c[0])},${f(c[1])}`).join('') + 'Z';
}
function reverse({ start, segs }) {
  // points p0=start, p_i = segs[i-1].end. Reversed path starts at the last end point (== start when closed).
  const pts = [start, ...segs.map((s) => s[2])];
  const out = [];
  for (let i = segs.length - 1; i >= 0; i--) out.push([segs[i][1], segs[i][0], pts[i]]);
  return { start: pts[pts.length - 1], segs: out };
}
/** signed area in screen coordinates (y down): > 0 means the path runs clockwise on screen */
function area({ start, segs }) {
  let cur = start, sum = 0;
  const pts = [start];
  for (const [a, b, c] of segs) {
    for (let t = 1; t <= 8; t++) {
      const u = t / 8, v = 1 - u;
      pts.push([
        v * v * v * cur[0] + 3 * v * v * u * a[0] + 3 * v * u * u * b[0] + u * u * u * c[0],
        v * v * v * cur[1] + 3 * v * v * u * a[1] + 3 * v * u * u * b[1] + u * u * u * c[1],
      ]);
    }
    cur = c;
  }
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; sum += p[0] * q[1] - q[0] * p[1]; }
  return sum / 2;
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let wrong = 0, changed = 0;
for (const [slug, want] of Object.entries(LAP_DIRECTION)) {
  const entry = data[slug];
  if (!entry) { console.error(`missing path for ${slug}`); wrong++; continue; }
  let parsed = parse(entry.d);
  const traced = area(parsed) > 0 ? 'clockwise' : 'anticlockwise';
  if (traced !== want) {
    wrong++;
    if (process.argv.includes('--write')) { parsed = reverse(parsed); entry.d = build(parsed); changed++; }
  }
  if (entry.lapDirection !== want) { entry.lapDirection = want; if (!process.argv.includes('--write')) wrong += 0; }
}
if (process.argv.includes('--write')) {
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(`track-paths.json: ${changed} path(s) reversed, lapDirection recorded for ${Object.keys(LAP_DIRECTION).length} circuits`);
} else if (wrong) {
  console.error(`${wrong} traced path(s) run against the real lap direction. Run with --write.`);
  process.exit(1);
} else console.log('all traced paths run in the real lap direction');
