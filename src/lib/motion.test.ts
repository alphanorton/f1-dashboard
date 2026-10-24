import { countUpValue, decimalPlaces, easeOutExpo, easeOutCubic, formatCount, formatLapTime, clamp01 } from './motion.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const eq = (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${String(b)}, got ${String(a)}`); };

test('easing is 0 at start, 1 at end, monotonic, clamped', () => {
  eq(easeOutExpo(0) < 0.001, true, 'expo start');
  eq(easeOutExpo(1), 1, 'expo end');
  eq(easeOutCubic(0), 0, 'cubic start');
  eq(easeOutCubic(1), 1, 'cubic end');
  eq(easeOutCubic(2), 1, 'cubic clamp high');
  eq(easeOutCubic(-1), 0, 'cubic clamp low');
  let prev = -1;
  for (let i = 0; i <= 20; i++) { const v = easeOutExpo(i / 20); if (v < prev) throw new Error('not monotonic'); prev = v; }
  eq(clamp01(0.4), 0.4, 'clamp passthrough');
});
test('countUpValue ends exactly on the target and never overshoots', () => {
  eq(countUpValue(0, 340, 1), 340, 'final frame');
  eq(countUpValue(0, 340, 1.5), 340, 'past the end');
  for (let i = 0; i <= 50; i++) { const v = countUpValue(0, 340, i / 50); if (v < 0 || v > 340) throw new Error(`out of range ${v}`); }
});
test('countUpValue works downward and with decimals', () => {
  eq(countUpValue(100, 40, 1), 40, 'down final');
  const mid = countUpValue(100, 40, 0.5);
  eq(mid < 100 && mid > 40, true, 'down mid');
  eq(countUpValue(0, 17.5, 1, 1), 17.5, 'decimal final');
  eq(Number.isInteger(countUpValue(0, 340, 0.3, 0)), true, 'integers while counting');
});
test('decimalPlaces', () => {
  eq(decimalPlaces(340), 0); eq(decimalPlaces(17.5), 1); eq(decimalPlaces(0.25), 2); eq(decimalPlaces(NaN), 0);
});
test('formatCount keeps fixed decimals', () => {
  eq(formatCount(1234), '1,234'); eq(formatCount(17.5, 1), '17.5'); eq(formatCount(17, 1), '17.0');
});
test('formatLapTime formats m:ss.mmm and handles bad input', () => {
  eq(formatLapTime(82.091), '1:22.091');
  eq(formatLapTime(28.823), '0:28.823');
  eq(formatLapTime(null), '—'); eq(formatLapTime(undefined), '—'); eq(formatLapTime(NaN), '—'); eq(formatLapTime(-1), '—');
});
test('formatLapTime rounds to ms before splitting minutes (no 0:60.000)', () => {
  eq(formatLapTime(59.9996), '1:00.000');
  eq(formatLapTime(119.9999), '2:00.000');
  eq(formatLapTime(60), '1:00.000');
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
