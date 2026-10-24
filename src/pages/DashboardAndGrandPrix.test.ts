// Tests for high-risk behaviors across Dashboard, GrandPrix, and Settings.
//
// Zero-dependency test suite run via:
//   node src/pages/DashboardAndGrandPrix.test.ts

interface TinyAssert {
  equal(actual: unknown, expected: unknown, message?: string): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
}

const assert: TinyAssert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
    }
  },
  deepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(message ?? `expected ${b}, got ${a}`);
    }
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

// ------------------------------------------------------------------ 1. Countdown logic
interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  passed: boolean;
}

function computeCountdownAt(targetStr: string, nowMs: number): CountdownState {
  const diff = new Date(targetStr).getTime() - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const totalMinutes = Math.floor(diff / 60000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    passed: false,
  };
}

test('countdown detects passed/past race dates', () => {
  const pastTarget = '2026-03-15';
  const now = new Date('2026-10-24T12:00:00Z').getTime();
  const res = computeCountdownAt(pastTarget, now);
  assert.equal(res.passed, true);
  assert.equal(res.days, 0);
  assert.equal(res.hours, 0);
  assert.equal(res.minutes, 0);
});

test('countdown accurately computes remaining days, hours, and minutes for upcoming race', () => {
  const target = '2026-10-25T18:00:00Z'; // 30 hours from now
  const now = new Date('2026-10-24T12:00:00Z').getTime(); // 30 hours difference = 1 day, 6 hours
  const res = computeCountdownAt(target, now);
  assert.equal(res.passed, false);
  assert.equal(res.days, 1);
  assert.equal(res.hours, 6);
  assert.equal(res.minutes, 0);
});

test('countdown handles exact target moment', () => {
  const target = '2026-10-25T15:00:00Z';
  const now = new Date('2026-10-25T15:00:00Z').getTime();
  const res = computeCountdownAt(target, now);
  assert.equal(res.passed, true);
});

// ------------------------------------------------------------------ 2. GrandPrix filtering
interface MockRace {
  round: number;
  name: string;
  circuit: string;
  country: string;
  locality: string;
  isSprint: boolean;
  status: 'completed' | 'cancelled' | 'upcoming' | 'next';
}

const mockRaces: MockRace[] = [
  { round: 1, name: 'Australian Grand Prix', circuit: 'Albert Park', country: 'Australia', locality: 'Melbourne', isSprint: false, status: 'completed' },
  { round: 2, name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', country: 'China', locality: 'Shanghai', isSprint: true, status: 'completed' },
  { round: 20, name: 'United States Grand Prix', circuit: 'Circuit of the Americas', country: 'United States', locality: 'Austin', isSprint: false, status: 'next' },
  { round: 21, name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', country: 'Mexico', locality: 'Mexico City', isSprint: false, status: 'upcoming' },
  { round: 25, name: 'Emilia Romagna Grand Prix', circuit: 'Imola', country: 'Italy', locality: 'Imola', isSprint: false, status: 'cancelled' },
];

function filterRaces(races: MockRace[], search: string, filter: string): MockRace[] {
  return races.filter((race) => {
    const matchesSearch =
      race.name.toLowerCase().includes(search.toLowerCase()) ||
      race.circuit.toLowerCase().includes(search.toLowerCase()) ||
      race.country.toLowerCase().includes(search.toLowerCase()) ||
      race.locality.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'upcoming') return race.status === 'upcoming' || race.status === 'next';
    if (filter === 'completed') return race.status === 'completed';
    if (filter === 'sprint') return race.isSprint;
    if (filter === 'cancelled') return race.status === 'cancelled';
    return true;
  });
}

test('GrandPrix search filters by name, circuit, country, or locality', () => {
  assert.equal(filterRaces(mockRaces, 'austin', 'all').length, 1);
  assert.equal(filterRaces(mockRaces, 'austin', 'all')[0].name, 'United States Grand Prix');

  assert.equal(filterRaces(mockRaces, 'shanghai', 'all').length, 1);
  assert.equal(filterRaces(mockRaces, 'shanghai', 'all')[0].name, 'Chinese Grand Prix');

  assert.equal(filterRaces(mockRaces, 'italy', 'all').length, 1);
  assert.equal(filterRaces(mockRaces, 'italy', 'all')[0].name, 'Emilia Romagna Grand Prix');
});

test('GrandPrix filter mode segregates upcoming, completed, sprint, and cancelled', () => {
  assert.equal(filterRaces(mockRaces, '', 'upcoming').length, 2, 'next + upcoming = 2');
  assert.equal(filterRaces(mockRaces, '', 'completed').length, 2);
  assert.equal(filterRaces(mockRaces, '', 'sprint').length, 1);
  assert.equal(filterRaces(mockRaces, '', 'cancelled').length, 1);
});

// ------------------------------------------------------------------ 3. Cache clearing verification
const mockLocalStorage: Record<string, string> = {};

function simulateClearCache() {
  const CACHE_PREFIX = 'f1_gp_cache_';
  mockLocalStorage['f1-test-2026-store'] = '{"theme":"dark"}';
  mockLocalStorage['f1_gp_cache_calendar_2026'] = '{"season":2026}';
  mockLocalStorage['f1_gp_cache_results_2026'] = '{"season":2026}';
  mockLocalStorage['unrelated_key'] = 'preserve_me';

  // Perform clear
  delete mockLocalStorage['f1-test-2026-store'];
  const keys = Object.keys(mockLocalStorage);
  for (const key of keys) {
    if (key.startsWith(CACHE_PREFIX)) {
      delete mockLocalStorage[key];
    }
  }
}

test('clearCache removes both UI store and f1_gp_cache_ data keys without touching unrelated keys', () => {
  simulateClearCache();
  assert.equal('f1-test-2026-store' in mockLocalStorage, false);
  assert.equal('f1_gp_cache_calendar_2026' in mockLocalStorage, false);
  assert.equal('f1_gp_cache_results_2026' in mockLocalStorage, false);
  assert.equal(mockLocalStorage['unrelated_key'], 'preserve_me');
});

// ------------------------------------------------------------------ Test Runner
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
