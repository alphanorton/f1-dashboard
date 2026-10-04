// Fetches the official tyre stints, fastest laps and pit information for
// round 16 - Bahrain Grand Prix in Malaysia 2026 (Sepang, 2026-10-04).
//
// Primary source : OpenF1   https://api.openf1.org/v1   (session_key 11731, meeting_key 1308)
// Cross-check    : Jolpica/Ergast https://api.jolpi.ca/ergast/f1  (results + FastestLap block)
// Cross-check    : official formula1.com race result / pit stop summary / fastest laps pages
//
// Usage:
//   node fetch-round-16-stints.cjs            # use cache when present
//   node fetch-round-16-stints.cjs --refresh  # ignore cache, refetch everything
//   node fetch-round-16-stints.cjs --dry-run  # build + report, do not write the data files
//
// Raw API responses are cached under cache/round-16-bahrain-malaysia/ so reruns are reproducible.
// NOTE: the meeting has already been provisional-flagged by formula1.com ("* Provisional results").

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CACHE_DIR = path.join(__dirname, 'cache', 'round-16-bahrain-malaysia');
const SEASON = 2026;
const OFFICIAL_ROUND = 16;
const SESSION_KEY = 11731;
const MEETING_KEY = 1308;

const REFRESH = process.argv.includes('--refresh');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------- http + cache

function sleep(ms) {
  const sync = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(sync, 0, 0, ms);
}

function readCache(file) {
  const full = path.join(CACHE_DIR, file);
  if (!REFRESH && fs.existsSync(full)) {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  }
  return null;
}

function writeCache(file, text) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, file), text);
}

async function getText(url) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(180000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt === 5) break;
      sleep(2000 * attempt);
    }
  }
  try {
    return execFileSync('curl.exe', ['-sS', '--fail', '--max-time', '240', '-H', 'Accept: application/json', url], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (curlErr) {
    throw new Error(`fetch failed for ${url}: ${lastError && lastError.message} / curl: ${curlErr.message}`);
  }
}

async function getJson(url, cacheFile) {
  const cached = readCache(cacheFile);
  if (cached) return cached;
  const text = await getText(url);
  const json = JSON.parse(text);
  writeCache(cacheFile, text);
  return json;
}

// Optional endpoint: a 404 or an unsupported endpoint must not kill the run.
async function tryJson(url, cacheFile) {
  try {
    return await getJson(url, cacheFile);
  } catch (err) {
    console.log(`  ! unavailable: ${url} (${err.message})`);
    return null;
  }
}

// -------------------------------------------------------------------- helpers

function round3(value) {
  return value === null || value === undefined ? null : Math.round(value * 1000) / 1000;
}

function formatLapTime(seconds) {
  if (seconds === null) return '-';
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

function parseApiTime(time, millis) {
  if (millis !== undefined && millis !== null) return parseInt(millis, 10) / 1000;
  if (!time) return null;
  const parts = String(time).split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
}

// -------------------------------------------------------------------- pipeline

async function main() {
  console.log(`=== ROUND ${OFFICIAL_ROUND} - BAHRAIN GP IN MALAYSIA 2026 : STINTS / LAPS / PIT ===\n`);

  const [stints, laps, drivers, pitStops] = await Promise.all([
    getJson(`https://api.openf1.org/v1/stints?session_key=${SESSION_KEY}`, 'openf1_stints_session_11731.json'),
    getJson(`https://api.openf1.org/v1/laps?session_key=${SESSION_KEY}`, 'openf1_laps_session_11731.json'),
    getJson(`https://api.openf1.org/v1/drivers?session_key=${SESSION_KEY}`, 'openf1_drivers_session_11731.json'),
    tryJson(`https://api.openf1.org/v1/pit_stops?session_key=${SESSION_KEY}`, 'openf1_pit_stops_session_11731.json'),
  ]);

  // Jolpica round 16 (may legitimately be empty while the meeting is provisional).
  let jolpica = null;
  try {
    const raw = await getJson(
      `https://api.jolpi.ca/ergast/f1/${SEASON}/${OFFICIAL_ROUND}/results.json`,
      `jolpica_results_round_${OFFICIAL_ROUND}.json`
    );
    const races = raw.MRData.RaceTable.Races || [];
    jolpica = { available: races.length > 0, race: races[0] || null };
  } catch (err) {
    jolpica = { available: false, error: err.message };
  }

  console.log(`OpenF1 stints rows   : ${stints.length}`);
  console.log(`OpenF1 laps rows     : ${laps.length}`);
  console.log(`OpenF1 drivers rows  : ${drivers.length}`);
  console.log(`OpenF1 pit_stops rows: ${pitStops ? pitStops.length : 'endpoint unavailable'}`);
  console.log(`Jolpica round ${OFFICIAL_ROUND} results: ${jolpica.available ? 'available' : 'empty (meeting still provisional)'}`);

  // Per-driver fastest lap of the meeting (excludes pit-out laps and null durations).
  const fastestByDriver = new Map();
  for (const lap of laps) {
    if (lap.lap_duration === null || lap.lap_duration === undefined) continue;
    if (lap.is_pit_out_lap === true) continue;
    const current = fastestByDriver.get(lap.driver_number);
    if (!current || lap.lap_duration < current.lap_duration) {
      fastestByDriver.set(lap.driver_number, lap);
    }
  }

  const fastestLaps = drivers
    .map((d) => {
      const lap = fastestByDriver.get(d.driver_number);
      if (!lap) return null;
      return {
        driver_number: d.driver_number,
        driver_code: d.name_acronym,
        driver_name: d.full_name,
        team: d.team_name,
        lap_number: lap.lap_number,
        lap_time: round3(lap.lap_duration),
        s1: round3(lap.duration_sector_1),
        s2: round3(lap.duration_sector_2),
        s3: round3(lap.duration_sector_3),
        compound: lap.compound || null,
        source: 'OpenF1 /laps',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.lap_time - b.lap_time);

  const fastestLapOfRace = fastestLaps[0] || null;

  // Stints grouped per driver, ordered by stint number.
  const stintsByDriver = new Map();
  for (const s of stints) {
    if (!stintsByDriver.has(s.driver_number)) stintsByDriver.set(s.driver_number, []);
    stintsByDriver.get(s.driver_number).push(s);
  }

  console.log('\n=== TYRE STINTS (OpenF1) ===');
  console.log('No  | Driver                | Stint | Compound      | Laps      | Age@start');
  const stintRows = [];
  for (const d of drivers) {
    const rows = (stintsByDriver.get(d.driver_number) || []).sort(
      (a, b) => (a.stint_number ?? 0) - (b.stint_number ?? 0)
    );
    rows.forEach((s, idx) => {
      const range = s.lap_end ? `${s.lap_start}-${s.lap_end}` : `from ${s.lap_start}`;
      console.log(
        `${String(d.driver_number).padStart(2)} | ${(d.full_name || '').padEnd(21)} | ${String(
          s.stint_number
        ).padStart(5)} | ${(s.compound || '?').padEnd(13)} | ${range.padEnd(9)} | ${s.tyre_age_at_start}`
      );
      stintRows.push({
        driver_number: d.driver_number,
        driver_code: d.name_acronym,
        driver_name: d.full_name,
        team: d.team_name,
        stint_number: s.stint_number,
        compound: s.compound,
        start_lap: s.lap_start,
        end_lap: s.lap_end,
        tyre_age_at_start: s.tyre_age_at_start,
        source: 'OpenF1 /stints',
      });
      void idx;
    });
  }

  console.log('\n=== FASTEST LAP PER DRIVER (OpenF1 /laps) ===');
  console.log('Code | Driver                | Lap | Lap time | S1      | S2      | S3      | Tyre');
  fastestLaps.forEach((f) => {
    console.log(
      [
        (f.driver_code || '-').padEnd(5),
        (f.driver_name || '').padEnd(21),
        String(f.lap_number).padStart(3),
        formatLapTime(f.lap_time).padStart(8),
        formatLapTime(f.s1).padStart(7),
        formatLapTime(f.s2).padStart(7),
        formatLapTime(f.s3).padStart(7),
        f.compound || '-',
      ].join(' | ')
    );
  });

  if (pitStops && pitStops.length) {
    console.log('\n=== PIT STOPS (OpenF1 /pit_stops) ===');
    pitStops
      .slice()
      .sort((a, b) => (a.lap_number ?? 0) - (b.lap_number ?? 0))
      .forEach((p) => {
        const d = drivers.find((x) => x.driver_number === p.driver_number);
        console.log(`${String(p.lap_number).padStart(3)} | ${(d ? d.full_name : '?').padEnd(21)} | ${p.duration ?? '-'}`);
      });
  }

  const out = {
    season: SEASON,
    officialRound: OFFICIAL_ROUND,
    projectRound: 18,
    grand_prix: 'Bahrain Grand Prix in Malaysia',
    circuit: 'Sepang International Circuit',
    location: 'Kuala Lumpur, Malaysia',
    date: '2026-10-04',
    meeting_key: MEETING_KEY,
    session_key: SESSION_KEY,
    source: 'OpenF1 (api.openf1.org) stints + laps, cross-checked against the official formula1.com race result page',
    provisional: true,
    asOfDate: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    cacheDir: path.relative(__dirname, CACHE_DIR).replace(/\\/g, '/'),
    jolpica_round16_results_available: jolpica.available,
    fastest_lap_of_race: fastestLapOfRace,
    fastest_laps: fastestLaps,
    stints: stintRows,
  };

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written');
    return;
  }

  const outFile = path.join(__dirname, 'public', 'data', 'tyre_stints_2026_r16_raw.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nWrote ${path.relative(__dirname, outFile)}`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
