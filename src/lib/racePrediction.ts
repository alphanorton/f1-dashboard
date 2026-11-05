/**
 * Race prediction for the next Grand Prix.
 *
 * Data honesty
 * ------------
 * This model uses only data that already exists in the project's own static
 * datasets: the completed-race results (`results.json`), the drivers'
 * championship standings (`standings.json`) and the remaining calendar
 * (`calendar.json`).
 *
 * It deliberately publishes NO probability. The project has no calibrated
 * outcome model, and a number invented from a hand-tuned softmax would read as
 * a betting line without being one. What this module returns instead is a
 * documented, reproducible ranking with the exact inputs that produced it:
 *
 *   formScore  = recency-weighted average points per race over the last N races
 *                (the most recent race gets weight N, the oldest weight 1)
 *   seasonRate = championship points / completed races
 *   score      = 0.70 * formScore + 0.30 * seasonRate
 *
 * Ties fall back to championship position, then driver code, so the output is
 * stable for a given dataset. `spread` is the score gap between the top two
 * drivers and is surfaced as plain language ("clear favourite"), never as a
 * percentage.
 */

export const PREDICTION_WINDOW = 5;

/** Weight of the recent-form term in the composite score. */
export const FORM_WEIGHT = 0.7;
/** Weight of the season-long term in the composite score. */
export const SEASON_WEIGHT = 0.3;

export interface PredictionStandingDriver {
  position: number;
  code: string;
  name: string;
  team: string;
  points: number;
  gap: number | null;
}

export interface PredictionRaceResult {
  pos: number | null;
  driver: string;
  code: string;
  team: string;
  status: string;
  points: number;
}

export interface PredictionResultsRace {
  round: number;
  name: string;
  date: string;
  circuit: string;
  results: PredictionRaceResult[];
}

export interface PredictionResultsData {
  season: number;
  asOfRound: number;
  races: Record<string, PredictionResultsRace>;
}

export interface PredictionCalendarRace {
  round: number;
  name: string;
  circuit: string;
  date: string;
  status: string;
  isSprint?: boolean;
}

export interface DriverForm {
  code: string;
  name: string;
  team: string;
  /** Races used from the recency window (0 when the driver has no results). */
  roundsInWindow: number;
  /** Recency-weighted average points per race in the window. */
  formScore: number;
  /** Championship points divided by completed races. */
  seasonRate: number;
  /** Composite model score. */
  score: number;
  /** Mean finishing position over classified races in the window (null if none). */
  avgFinish: number | null;
  wins: number;
  podiums: number;
  dnfs: number;
  championshipPosition: number;
  championshipPoints: number;
  gapToLeader: number | null;
}

export type PredictionConfidence = 'clear-favourite' | 'narrow-favourite' | 'too-close';

export interface ChampionshipContext {
  leaderName: string | null;
  leaderTeam: string | null;
  leaderPoints: number | null;
  remainingRaces: number;
  /** Maximum points any driver can still score across the remaining races. */
  maxPointsAvailable: number;
  /** True when no rival can mathematically reach the leader any more. */
  titleDecided: boolean;
  /** True when the predicted winner is still mathematically in the title fight. */
  predictedDriverAlive: boolean;
  completedRaces: number;
  season: number | null;
}

export interface RacePrediction {
  /** Drivers ranked best-first; the first three form the projected podium. */
  ranked: DriverForm[];
  topThree: DriverForm[];
  winner: DriverForm;
  /** Score gap between P1 and P2 in the projection. */
  spread: number;
  confidence: PredictionConfidence;
  /** Human sentence describing the model separation (never a probability). */
  confidenceNote: string;
  windowSize: number;
  roundsUsed: number[];
  nextRace: PredictionCalendarRace | null;
  championship: ChampionshipContext;
}

const GP_POINTS_MAX = 25;
const SPRINT_POINTS_MAX = 8;

const round1 = (n: number) => Math.round(n * 1000) / 1000;

/** Completed races in chronological round order. */
function completedRaces(results: PredictionResultsData): PredictionResultsRace[] {
  return Object.values(results.races)
    .filter((r): r is PredictionResultsRace => !!r && Array.isArray(r.results))
    .sort((a, b) => a.round - b.round);
}

/**
 * Recency weights for a window of `n` races: the newest race gets `n`, the
 * oldest gets `1`. Keeping the weights integers makes the arithmetic easy to
 * audit by hand.
 */
export function recencyWeights(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => i + 1);
}

function confidenceFromSpread(spread: number, winner: DriverForm): { tier: PredictionConfidence; note: string } {
  if (spread >= 4) {
    return {
      tier: 'clear-favourite',
      note: `${winner.name} leads the projection by ${round1(spread)} model points — the clearest gap on the grid.`,
    };
  }
  if (spread >= 1.5) {
    return {
      tier: 'narrow-favourite',
      note: `${winner.name} edges the projection by ${round1(spread)} model points — a favourite, not a lock.`,
    };
  }
  return {
    tier: 'too-close',
    note: `The top two are ${round1(spread)} model points apart — the model cannot separate them.`,
  };
}

/**
 * Build the race projection.
 *
 * Returns `null` when there is not enough verified data to say anything
 * meaningful (no completed races, or fewer than three classified drivers).
 */
export function computeRacePrediction(input: {
  drivers: PredictionStandingDriver[];
  results: PredictionResultsData;
  calendar: PredictionCalendarRace[];
  window?: number;
}): RacePrediction | null {
  const { drivers, results, calendar } = input;
  const windowSize = Math.max(1, input.window ?? PREDICTION_WINDOW);

  if (!drivers || drivers.length < 3) return null;

  const allCompleted = completedRaces(results);
  if (allCompleted.length === 0) return null;

  const windowRaces = allCompleted.slice(-windowSize);
  const weights = recencyWeights(windowRaces.length);

  const standingByCode = new Map(drivers.map((d) => [d.code, d]));
  const leader = [...drivers].sort((a, b) => b.points - a.points)[0] ?? null;

  const forms: DriverForm[] = drivers.map((driver) => {
    let weightSum = 0;
    let weightedPoints = 0;
    let finishSum = 0;
    let finishCount = 0;
    let wins = 0;
    let podiums = 0;
    let dnfs = 0;
    let roundsInWindow = 0;

    windowRaces.forEach((race, idx) => {
      const weight = weights[idx];
      const row = race.results.find((r) => r.code === driver.code);
      if (!row) return;

      roundsInWindow += 1;
      weightSum += weight;
      weightedPoints += (Number.isFinite(row.points) ? row.points : 0) * weight;

      const finished = row.status === 'Finished';
      if (finished && typeof row.pos === 'number') {
        finishSum += row.pos;
        finishCount += 1;
        if (row.pos === 1) wins += 1;
        if (row.pos <= 3) podiums += 1;
      } else if (row.status === 'DNF' || row.status === 'DNS') {
        dnfs += 1;
      }
    });

    const formScore = weightSum > 0 ? weightedPoints / weightSum : 0;
    const seasonRate = allCompleted.length > 0 ? driver.points / allCompleted.length : 0;
    const score = FORM_WEIGHT * formScore + SEASON_WEIGHT * seasonRate;

    return {
      code: driver.code,
      name: driver.name,
      team: driver.team,
      roundsInWindow,
      formScore: round1(formScore),
      seasonRate: round1(seasonRate),
      score: round1(score),
      avgFinish: finishCount > 0 ? round1(finishSum / finishCount) : null,
      wins,
      podiums,
      dnfs,
      championshipPosition: driver.position,
      championshipPoints: driver.points,
      gapToLeader: leader ? leader.points - driver.points : driver.gap,
    };
  });

  const ranked = [...forms].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.championshipPosition !== b.championshipPosition) {
      return a.championshipPosition - b.championshipPosition;
    }
    return a.code.localeCompare(b.code);
  });

  // A driver with zero races in the window has nothing predicting them; that
  // only happens if the standings and results datasets disagree, so refuse
  // rather than rank a phantom.
  const eligible = ranked.filter((d) => d.roundsInWindow > 0);
  if (eligible.length < 3) return null;

  const winner = eligible[0];
  const spread = round1(winner.score - eligible[1].score);
  const { tier, note } = confidenceFromSpread(spread, winner);

  const remaining = calendar.filter((r) => r.status === 'upcoming' || r.status === 'next');
  const maxPointsAvailable = remaining.reduce(
    (sum, r) => sum + GP_POINTS_MAX + (r.isSprint ? SPRINT_POINTS_MAX : 0),
    0,
  );

  const rivals = leader ? drivers.filter((d) => d.code !== leader.code) : [];
  const titleDecided = leader
    ? remaining.length === 0 || rivals.every((d) => d.points + maxPointsAvailable < leader.points)
    : false;

  const championship: ChampionshipContext = {
    leaderName: leader?.name ?? null,
    leaderTeam: leader?.team ?? null,
    leaderPoints: leader?.points ?? null,
    remainingRaces: remaining.length,
    maxPointsAvailable,
    titleDecided,
    predictedDriverAlive: leader
      ? standingByCode.get(winner.code)!.points + maxPointsAvailable >= leader.points
      : true,
    completedRaces: allCompleted.length,
    season: results.season ?? null,
  };

  return {
    ranked: eligible,
    topThree: eligible.slice(0, 3),
    winner,
    spread,
    confidence: tier,
    confidenceNote: note,
    windowSize,
    roundsUsed: windowRaces.map((r) => r.round),
    nextRace: remaining[0] ?? null,
    championship,
  };
}
