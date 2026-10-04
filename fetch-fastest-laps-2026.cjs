// Fetches 2026 F1 race fastest laps + the three sector times of that same lap.
//
// Primary source : OpenF1   https://api.openf1.org/v1
// Cross-check    : Jolpica/Ergast https://api.jolpi.ca/ergast/f1
// Cross-check    : official formula1.com fastest-lap list (REFERENCE below, read-only)
//
// Usage:
//   node fetch-fastest-laps-2026.cjs            # use cache when present
//   node fetch-fastest-laps-2026.cjs --refresh  # ignore cache, refetch everything
//   node fetch-fastest-laps-2026.cjs --dry-run  # build + report, do not write the data file
//
// Raw API responses are cached under cache/fastest-laps-2026/ so reruns are reproducible.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CACHE_DIR = path.join(__dirname, 'cache', 'fastest-laps-2026');
const OUT_FILE = path.join(__dirname, 'public', 'data', 'fastest_laps_2026.json');
const SEASON = 2026;
const SEASON_END = Date.now();

const REFRESH = process.argv.includes('--refresh');
const DRY_RUN = process.argv.includes('--dry-run');

const TIME_TOLERANCE = 0.001;   // lap time / driver cross-check tolerance
const SUM_TOLERANCE = 0.002;     // s1+s2+s3 vs lap_duration tolerance

// Official formula1.com fastest-lap list, used ONLY to cross-check fetched data.
// Rounds are the official 2026 round numbers (cancelled Sakhir/Jeddah weekends are
// not numbered by F1, matching the Jolpica/Ergast schedule).
const REFERENCE = [
  { round: 1,  grand_prix: 'Australian Grand Prix',            driver_code: 'VER', lap_number: 43, lap_time: 82.091 },
  { round: 2,  grand_prix: 'Chinese Grand Prix',              driver_code: 'ANT', lap_number: 52, lap_time: 95.275 },
  { round: 3,  grand_prix: 'Japanese Grand Prix',             driver_code: 'ANT', lap_number: 49, lap_time: 92.432 },
  { round: 4,  grand_prix: 'Miami Grand Prix',                driver_code: 'NOR', lap_number: 35, lap_time: 91.869 },
  { round: 5,  grand_prix: 'Canadian Grand Prix',             driver_code: 'ANT', lap_number: 68, lap_time: 74.210 },
  { round: 6,  grand_prix: 'Monaco Grand Prix',               driver_code: 'ANT', lap_number: 76, lap_time: 73.481 },
  { round: 7,  grand_prix: 'Barcelona-Catalunya Grand Prix',  driver_code: 'HAM', lap_number: 44, lap_time: 80.122 },
  { round: 8,  grand_prix: 'Austrian Grand Prix',             driver_code: 'ANT', lap_number: 59, lap_time: 70.374 },
  { round: 9,  grand_prix: 'British Grand Prix',              driver_code: 'ANT', lap_number: 37, lap_time: 91.777 },
  { round: 10, grand_prix: 'Belgian Grand Prix',              driver_code: 'NOR', lap_number: 44, lap_time: 108.890 },
  { round: 11, grand_prix: 'Hungarian Grand Prix',            driver_code: 'LEC', lap_number: 58, lap_time: 82.000 },
  { round: 12, grand_prix: 'Dutch Grand Prix',                driver_code: 'LEC', lap_number: 60, lap_time: 74.230 },
  { round: 13, grand_prix: 'Italian Grand Prix',              driver_code: 'ANT', lap_number: null, lap_time: 83.504 },
  { round: 14, grand_prix: 'Spanish Grand Prix',              driver_code: 'RUS', lap_number: null, lap_time: 95.587 },
  { round: 15, grand_prix: 'Azerbaijan Grand Prix',           driver_code: 'RUS', lap_number: null, lap_time: 104.916 },
];

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
  // curl fallback (the OpenF1 laps endpoint occasionally stalls on the Node HTTP stack)
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

// -------------------------------------------------------------------- helpers

function round3(value) {
  return value === null || value === undefined ? null : Math.round(value * 1000) / 1000;
}

// Ergast times arrive as "m:ss.mmm" (and occasionally as an explicit millis field)
function parseApiTime(time, millis) {
  if (millis !== undefined && millis !== null) return parseInt(millis, 10) / 1000;
  if (!time) return null;
  const parts = String(time).split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
}

function formatLapTime(seconds) {
  if (seconds === null) return '-';
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

// ------------------------------------------------------------------ pipeline

async function main() {
  console.log('=== 2026 RACE FASTEST LAPS + SECTORS ===\n');

  // 1. Official schedule + official round numbers (Jolpica/Ergast)
  const schedule = await getJson(
    `https://api.jolpi.ca/ergast/f1/${SEASON}.json?limit=40`,
    `jolpica_schedule_${SEASON}.json`
  );
  const officialRaces = schedule.MRData.RaceTable.Races.map((r) => ({
    round: parseInt(r.round, 10),
    grand_prix: r.raceName,
    circuit_id: r.Circuit.circuitId,
    date: r.date,
  }));
  const officialByDate = new Map(officialRaces.map((r) => [r.date, r]));

  // 2. Race sessions (OpenF1)
  const sessions = await getJson(
    'https://api.openf1.org/v1/sessions?session_name=Race&year=' + SEASON,
    `openf1_sessions_race_${SEASON}.json`
  );

  const held = sessions
    .filter((s) => !s.is_cancelled && Date.parse(s.date_end) <= SEASON_END)
    .map((s) => ({ session: s, official: officialByDate.get(s.date_start.slice(0, 10)) }))
    .filter((x) => x.official)
    .sort((a, b) => a.official.round - b.official.round);

  const skipped = sessions.filter((s) => s.is_cancelled || Date.parse(s.date_end) > SEASON_END);
  console.log(`Completed race sessions held: ${held.length}`);
  console.log('Not held / not yet run (excluded, no placeholders):');
  skipped.forEach((s) => {
    const why = s.is_cancelled ? 'cancelled' : 'not yet run';
    console.log(`  - ${s.date_start.slice(0, 10)} ${s.country_name} / ${s.circuit_short_name} (${why})`);
  });
  console.log('');

  const races = [];
  const needsReview = [];

  for (const { session, official } of held) {
    const key = session.session_key;
    process.stdout.write(`R${official.round} ${official.grand_prix} (session ${key}) ... `);

    const [laps, drivers] = await Promise.all([
      getJson(`https://api.openf1.org/v1/laps?session_key=${key}`, `openf1_laps_session_${key}.json`),
      getJson(`https://api.openf1.org/v1/drivers?session_key=${key}`, `openf1_drivers_session_${key}.json`),
    ]);

    // Jolpica cross-check source (race results carry the official FastestLap block)
    let jolpicaFastest = null;
    try {
      const jolpica = await getJson(
        `https://api.jolpi.ca/ergast/f1/${SEASON}/${official.round}/results.json`,
        `jolpica_results_round_${official.round}.json`
      );
      const row = (jolpica.MRData.RaceTable.Races[0] || {}).Results || [];
      const fl = row.find((r) => r.FastestLap && parseInt(r.FastestLap.rank, 10) === 1);
      if (fl) {
        jolpicaFastest = {
          driver_code: fl.Driver.code,
          lap_number: fl.FastestLap.lap ? parseInt(fl.FastestLap.lap, 10) : null,
          lap_time: fl.FastestLap.Time
            ? round3(parseApiTime(fl.FastestLap.Time.time, fl.FastestLap.Time.millis))
            : null,
        };
      }
    } catch (err) {
      console.log(`\n  ! jolpica cross-check unavailable: ${err.message}`);
    }

    // Fastest lap = minimum lap_duration, excluding null and pit-out laps
    const candidates = laps.filter(
      (l) => l.lap_duration !== null && l.lap_duration !== undefined && l.is_pit_out_lap !== true
    );
    if (candidates.length === 0) {
      console.log('no valid laps');
      needsReview.push({
        round: official.round,
        grand_prix: official.grand_prix,
        session_key: key,
        reason: 'No valid laps returned by OpenF1 (all lap_duration null or pit-out)',
        openf1_lap_time: null,
        reference_lap_time: null,
      });
      continue;
    }

    const fastest = candidates.reduce((best, l) => (l.lap_duration < best.lap_duration ? l : best));
    const driver = drivers.find((d) => d.driver_number === fastest.driver_number) || {};

    const lapTime = round3(fastest.lap_duration);
    const s1 = round3(fastest.duration_sector_1);
    const s2 = round3(fastest.duration_sector_2);
    const s3 = round3(fastest.duration_sector_3);
    const sum = s1 !== null && s2 !== null && s3 !== null ? round3(s1 + s2 + s3) : null;
    const sumDelta = sum !== null ? round3(Math.abs(sum - lapTime)) : null;
    const sumOk = sumDelta !== null && sumDelta <= SUM_TOLERANCE;

    const reference = REFERENCE.find((r) => r.round === official.round) || null;
    const refCodeOk = reference ? driver.name_acronym === reference.driver_code : null;
    const refTimeDelta = reference ? round3(Math.abs(lapTime - reference.lap_time)) : null;
    const refOk = reference ? refCodeOk && refTimeDelta !== null && refTimeDelta <= TIME_TOLERANCE : null;

    const jolpicaOk = jolpicaFastest
      ? jolpicaFastest.driver_code === driver.name_acronym &&
        jolpicaFastest.lap_time !== null &&
        round3(Math.abs(jolpicaFastest.lap_time - lapTime)) <= TIME_TOLERANCE
      : null;

    console.log(
      `${driver.name_acronym} ${formatLapTime(lapTime)} lap ${fastest.lap_number} ` +
      `[S1 ${formatLapTime(s1)} S2 ${formatLapTime(s2)} S3 ${formatLapTime(s3)}]`
    );

    const entry = {
      round: official.round,
      grand_prix: official.grand_prix,
      circuit: official.circuit_id,
      date: official.date,
      driver_name: driver.full_name || null,
      driver_code: driver.name_acronym || null,
      team: driver.team_name || null,
      lap_number: fastest.lap_number,
      lap_time: lapTime,
      s1,
      s2,
      s3,
      source: 'OpenF1 /laps',
      verified: false,
    };

    if (refOk === false) {
      needsReview.push({
        round: official.round,
        grand_prix: official.grand_prix,
        reason: 'OpenF1 fastest lap does not match the official formula1.com reference within 0.001s',
        openf1_driver_code: driver.name_acronym || null,
        reference_driver_code: reference.driver_code,
        openf1_lap_time: lapTime,
        reference_lap_time: reference.lap_time,
        time_delta: refTimeDelta,
      });
      races.push({
        round: official.round,
        grand_prix: official.grand_prix,
        circuit: official.circuit_id,
        date: official.date,
        driver_name: null,
        driver_code: null,
        team: null,
        lap_number: null,
        lap_time: null,
        s1: null,
        s2: null,
        s3: null,
        source: 'OpenF1 /laps (mismatch vs reference)',
        verified: false,
      });
      continue;
    }

    entry.verified = true;

    // Lap numbering: prefer the official FIA counter (Jolpica FastestLap.lap) and record
    // any offset against OpenF1's own lap_number rather than silently reconciling it.
    const openf1LapNumber = fastest.lap_number;
    const officialLapNumber = jolpicaFastest ? jolpicaFastest.lap_number : null;
    if (officialLapNumber !== null) {
      entry.lap_number = officialLapNumber;
      if (officialLapNumber !== openf1LapNumber) {
        needsReview.push({
          round: official.round,
          grand_prix: official.grand_prix,
          reason:
            'OpenF1 lap_number is offset from the official FIA lap counter (lap times match exactly)',
          openf1_lap_number: openf1LapNumber,
          official_lap_number: officialLapNumber,
          offset: officialLapNumber - openf1LapNumber,
          lap_time: lapTime,
          driver_code: entry.driver_code,
        });
      }
    }

    if (reference && reference.lap_number !== null && entry.lap_number !== null && reference.lap_number !== entry.lap_number) {
      needsReview.push({
        round: official.round,
        grand_prix: official.grand_prix,
        reason: 'Lap number does not match the official formula1.com reference',
        openf1_lap_number: openf1LapNumber,
        entry_lap_number: entry.lap_number,
        reference_lap_number: reference.lap_number,
      });
    }
    if (reference && reference.lap_number === null && entry.lap_number !== null) {
      console.log(`  -> lap number from data: ${entry.lap_number}`);
    }
    if (sumOk === false) {
      needsReview.push({
        round: official.round,
        grand_prix: official.grand_prix,
        reason: 'Sector sum does not match lap time within 0.002s',
        lap_time: lapTime,
        sector_sum: sum,
        delta: sumDelta,
      });
    }
    if (jolpicaOk === false) {
      needsReview.push({
        round: official.round,
        grand_prix: official.grand_prix,
        reason: 'Jolpica-Ergast FastestLap does not match OpenF1',
        openf1_driver_code: entry.driver_code,
        jolpica_driver_code: jolpicaFastest.driver_code,
        openf1_lap_time: lapTime,
        jolpica_lap_time: jolpicaFastest.lap_time,
      });
    }

    races.push(entry);
  }

  const out = {
    season: SEASON,
    source: 'OpenF1 race session laps (api.openf1.org), cross-checked against Jolpica-Ergast results and the official formula1.com fastest-lap list',
    asOfDate: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    tolerance: { lapTime: TIME_TOLERANCE, sectorSum: SUM_TOLERANCE },
    cacheDir: path.relative(__dirname, CACHE_DIR).replace(/\\/g, '/'),
    races,
    needs_review: needsReview,
  };

  console.log('\n=== FASTEST LAPS ===');
  console.log('Rnd | GP                              | Driver  | Team          | Lap | Lap time | S1      | S2      | S3      | Chk');
  races.forEach((r) => {
    console.log(
      [
        String(r.round).padStart(3),
        (r.grand_prix || '').padEnd(32),
        (r.driver_code || '-').padEnd(7),
        (r.team || '-').padEnd(13),
        String(r.lap_number ?? '-').padStart(3),
        formatLapTime(r.lap_time).padStart(8),
        formatLapTime(r.s1).padStart(7),
        formatLapTime(r.s2).padStart(7),
        formatLapTime(r.s3).padStart(7),
        r.verified ? 'ok' : 'REVIEW',
      ].join(' | ')
    );
  });

  console.log(`\nverified: ${races.filter((r) => r.verified).length}/${races.length}`);
  console.log(`needs_review: ${needsReview.length}`);
  needsReview.forEach((n) => console.log(`  - R${n.round} ${n.grand_prix}: ${n.reason}`));

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written');
    return;
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nWrote ${path.relative(__dirname, OUT_FILE)}`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
