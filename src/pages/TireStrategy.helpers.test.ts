interface TinyAssert {
  equal(actual: unknown, expected: unknown, message?: string): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
}

const assert: TinyAssert = {
  equal(actual, expected, message) {
    const ok = actual === expected;
    if (!ok) throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
  },
  deepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(message ?? `expected ${b}, got ${a}`);
  },
  ok(value, message) {
    if (!value) throw new Error(message ?? 'expected truthy value');
  },
};

declare const process: { exit(code: number): void };

const tests: Array<[string, () => void]> = [];
function test(name: string, fn: () => void) {
  tests.push([name, fn]);
}

import {
  TYRE_COMPOUND_ORDER,
  tyreCompoundKey,
  tyreStintLapCount,
  tyreNormalizeStint,
  tyreDefaultRaceSessionKey,
  tyreDefaultMeetingKey,
  tyreIsRaceLikeSession,
} from './TireStrategy.helpers.ts';

test('default meeting key returns null for empty meeting list', () => {
  assert.equal(tyreDefaultMeetingKey([], Date.now()), null);
});

test('default race session key returns null for empty session list', () => {
  assert.equal(tyreDefaultRaceSessionKey([], Date.now()), null);
});

test('compound order covers five compounds plus unknown', () => {
  assert.deepEqual([...TYRE_COMPOUND_ORDER], ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET', 'UNKNOWN']);
});

test('compound key maps known compounds case-insensitively', () => {
  assert.equal(tyreCompoundKey('SOFT'), 'SOFT');
  assert.equal(tyreCompoundKey('soft'), 'SOFT');
  assert.equal(tyreCompoundKey('MEDIUM'), 'MEDIUM');
  assert.equal(tyreCompoundKey('HARD'), 'HARD');
  assert.equal(tyreCompoundKey('INTERMEDIATE'), 'INTERMEDIATE');
  assert.equal(tyreCompoundKey('WET'), 'WET');
});

test('compound key maps null empty and unknown compounds to UNKNOWN', () => {
  assert.equal(tyreCompoundKey(null), 'UNKNOWN');
  assert.equal(tyreCompoundKey(undefined), 'UNKNOWN');
  assert.equal(tyreCompoundKey(''), 'UNKNOWN');
  assert.equal(tyreCompoundKey('SUPERGLUE'), 'UNKNOWN');
});

test('stint lap count handles null lap_end and inverted ranges', () => {
  assert.equal(tyreStintLapCount(5, null), 0);
  assert.equal(tyreStintLapCount(5, 5), 1);
  assert.equal(tyreStintLapCount(5, 12), 8);
  assert.equal(tyreStintLapCount(10, 4), 0);
});

test('normalize preserves missing lap_start instead of fabricating 1', () => {
  const row = tyreNormalizeStint({
    driver_number: 1,
    stint_number: 2,
    lap_start: null,
    lap_end: 12,
    compound: 'SOFT',
    tyre_age_at_start: null,
  });
  assert.equal(row.lapStart, null);
  assert.equal(row.lapEnd, 12);
  assert.equal(row.lapCount, null);
});

test('normalize keeps raw unknown compound and null age', () => {
  const row = tyreNormalizeStint({
    driver_number: 1,
    stint_number: 2,
    lap_start: 10,
    lap_end: null,
    compound: 'SUPERGLUE',
    tyre_age_at_start: null,
  });
  assert.equal(row.compoundKey, 'UNKNOWN');
  assert.equal(row.compoundRaw, 'SUPERGLUE');
  assert.equal(row.ageAtStart, null);
  assert.equal(row.lapCount, null);
});

test('normalize keeps numeric age and computes lap count', () => {
  const row = tyreNormalizeStint({
    driver_number: 44,
    stint_number: 1,
    lap_start: 1,
    lap_end: 20,
    compound: 'MEDIUM',
    tyre_age_at_start: 0,
  });
  assert.equal(row.compoundKey, 'MEDIUM');
  assert.equal(row.ageAtStart, 0);
  assert.equal(row.lapCount, 20);
});

const BASE = { session_type: null as string | null, session_name: null as string | null, date_start: null as string | null, session_key: 0 };

test('race session key prefers latest started race over sprint', () => {
  const picked = tyreDefaultRaceSessionKey(
    [
      { ...BASE, session_type: 'Race', session_name: 'Race', date_start: '2024-07-07T15:00:00Z', session_key: 9201 },
      { ...BASE, session_type: 'Race', session_name: 'Sprint', date_start: '2024-07-06T14:00:00Z', session_key: 9200 },
    ],
    Date.parse('2024-07-07T16:00:00Z')
  );
  assert.equal(picked, 9201);
});

test('race session key falls back to earliest upcoming race when none started', () => {
  const picked = tyreDefaultRaceSessionKey(
    [
      { ...BASE, session_type: 'Race', session_name: 'Race', date_start: '2024-07-07T15:00:00Z', session_key: 9201 },
      { ...BASE, session_type: 'Race', session_name: 'Sprint', date_start: '2024-07-06T14:00:00Z', session_key: 9200 },
    ],
    Date.parse('2024-07-01T00:00:00Z')
  );
  assert.equal(picked, 9200);
});

test('race session key returns null when only practice sessions exist', () => {
  const picked = tyreDefaultRaceSessionKey(
    [{ ...BASE, session_type: 'Practice', session_name: 'Practice 1', date_start: '2024-07-05T10:00:00Z', session_key: 9199 }],
    Date.parse('2024-07-07T16:00:00Z')
  );
  assert.equal(picked, null);
});

test('race-like detection covers type race and name race or sprint', () => {
  assert.equal(tyreIsRaceLikeSession({ session_type: 'Race', session_name: 'Race' }), true);
  assert.equal(tyreIsRaceLikeSession({ session_type: 'Qualifying', session_name: 'Sprint' }), true);
  assert.equal(tyreIsRaceLikeSession({ session_type: 'Qualifying', session_name: 'Qualifying' }), false);
});

let passed = 0;
const failures: string[] = [];
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

console.log(failures.length === 0 ? `ok ${passed} passed` : `FAIL ${failures.length} failed\n${failures.join('\n')}`);
if (failures.length > 0) {
  process.exit(1);
}
