// Teammate head-to-head, computed from results.json (race finishing order only; qualifying is not stored).

export interface ResultRow {
  pos: number | null;
  code: string;
  driver: string;
  team: string;
  status: string;
}
export interface ResultsFile {
  races: Record<string, { round: number; name: string; results: ResultRow[] }>;
}

export interface TeammatePair {
  team: string;
  a: { code: string; name: string };
  b: { code: string; name: string };
  /** races where one finished ahead of the other (both-DNF races are skipped) */
  aAhead: number;
  bAhead: number;
  /** races both started and one of them was compared */
  compared: number;
  /** average finishing position over races where both were classified */
  aAvg: number | null;
  bAvg: number | null;
  /** races where both were classified, used for the averages */
  bothFinished: number;
  /** last round the pair raced together (used to put current line-ups first) */
  lastRound: number;
}

const UNCLASSIFIED = 1000;

/** Orders by finishing position; unclassified retirements rank behind every classified driver. */
function rank(r: ResultRow): number {
  return r.pos == null ? UNCLASSIFIED : r.pos;
}

export function computeTeammatePairs(data: ResultsFile): TeammatePair[] {
  const pairs = new Map<string, TeammatePair & { aSum: number; bSum: number }>();
  const rounds = Object.values(data.races).sort((x, y) => x.round - y.round);

  for (const race of rounds) {
    const byTeam = new Map<string, ResultRow[]>();
    for (const row of race.results) {
      if (row.status === 'DNS') continue; // did not start: no head-to-head
      byTeam.set(row.team, [...(byTeam.get(row.team) ?? []), row]);
    }
    for (const [team, rows] of byTeam) {
      if (rows.length !== 2) continue;
      const [first, second] = [...rows].sort((p, q) => p.code.localeCompare(q.code));
      const key = `${team}|${first.code}|${second.code}`;
      let p = pairs.get(key);
      if (!p) {
        p = {
          team,
          a: { code: first.code, name: first.driver },
          b: { code: second.code, name: second.driver },
          aAhead: 0, bAhead: 0, compared: 0, aAvg: null, bAvg: null, bothFinished: 0, lastRound: race.round,
          aSum: 0, bSum: 0,
        };
        pairs.set(key, p);
      }
      p.lastRound = race.round;
      const ra = rank(first), rb = rank(second);
      if (ra === UNCLASSIFIED && rb === UNCLASSIFIED) continue; // both retired: nothing to compare
      p.compared += 1;
      if (ra < rb) p.aAhead += 1; else p.bAhead += 1;
      if (ra !== UNCLASSIFIED && rb !== UNCLASSIFIED) {
        p.bothFinished += 1; p.aSum += ra; p.bSum += rb;
      }
    }
  }

  return [...pairs.values()].map(({ aSum, bSum, ...p }) => ({
    ...p,
    aAvg: p.bothFinished ? aSum / p.bothFinished : null,
    bAvg: p.bothFinished ? bSum / p.bothFinished : null,
  }));
}
