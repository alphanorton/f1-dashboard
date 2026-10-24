import { readFileSync } from 'node:fs';
import {
  parsePreset, presetDrivers, presetMeeting, presetSession, presetStints, mergeMeetings,
} from './tyrePresets.ts';

declare const process: { exit(code: number): void };
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);
const ok = (v: unknown, m: string) => { if (!v) throw new Error(m); };

const raw = JSON.parse(readFileSync('public/data/tyres/2026_r16.json', 'utf8'));
const index = JSON.parse(readFileSync('public/data/tyres/index.json', 'utf8'));

test('every file in the tyre index parses as a valid preset', () => {
  for (const e of index.presets) {
    const p = parsePreset(JSON.parse(readFileSync(`public/data/tyres/${e.file}`, 'utf8')));
    ok(p, `${e.file} is not a valid preset`);
  }
});
test('R16 preset is converted to OpenF1-shaped rows', () => {
  const p = parsePreset(raw)!;
  ok(presetMeeting(p).meeting_key === p.meeting_key, 'meeting key');
  ok(presetSession(p).session_key === p.session_key, 'session key');
  ok(presetSession(p).session_type === 'Race', 'session is race-like');
  ok(presetStints(p).length === p.stints.length, 'stint count preserved');
  ok(presetDrivers(p).length === 22, 'one driver row per car');
});
test('unknown compounds stay null instead of being guessed', () => {
  const p = parsePreset(raw)!;
  const unknown = p.stints.filter((s) => !s.compound).length;
  ok(presetStints(p).filter((s) => s.compound === null).length === unknown, 'null compounds preserved');
});
test('malformed presets are rejected, bad stints dropped', () => {
  ok(parsePreset(null) === null, 'null');
  ok(parsePreset({ ...raw, stints: [] }) === null, 'no stints');
  ok(parsePreset({ ...raw, date: 'nope' }) === null, 'bad date');
  const p = parsePreset({ ...raw, stints: [...raw.stints, { driver_number: 1, driver_code: 'X', stint_number: 1, start_lap: 5, end_lap: 2 }] })!;
  ok(p.stints.length === raw.stints.length, 'invalid lap range dropped');
});
test('local meetings replace remote ones with the same key', () => {
  const m = mergeMeetings([{ meeting_key: 1, n: 'remote' }, { meeting_key: 2, n: 'r2' }], [{ meeting_key: 1, n: 'local' }]);
  ok(m.length === 2 && m.find((x) => x.meeting_key === 1)!.n === 'local', 'merge');
});

let failed = 0;
for (const [n, f] of tests) { try { f(); } catch (e) { failed++; console.log(`FAIL ${n}: ${(e as Error).message}`); } }
console.log(failed === 0 ? `ok ${tests.length} passed` : `FAIL ${failed} failed`);
if (failed) process.exit(1);
