/** A team's season, read from the race results: points per weekend, wins, podiums and 1-2 finishes. */
export interface TeamResultRow { pos: number | null; code: string; driver?: string; team: string; status: string; points: number | null }
export interface TeamBlock {
  round: number;
  name: string;
  results: TeamResultRow[];
  sprint?: Array<{ code: string; driver?: string; team: string; points: number }>;
}

export interface TeamWeekend { round: number; race: string; gp: number; sprint: number; points: number }
export interface TeamSeason {
  weekends: TeamWeekend[];
  total: number;
  wins: number;
  podiums: number;
  /** weekends where the team took both of the first two places */
  oneTwos: number;
  /** points per driver for this team's car (Grand Prix + sprint) */
  drivers: Array<{ code: string; name: string; points: number }>;
}

export function teamSeason(blocks: TeamBlock[], team: string): TeamSeason {
  const sorted = [...blocks].sort((a, b) => a.round - b.round);
  const perDriver = new Map<string, { name: string; points: number }>();
  const add = (code: string, name: string | undefined, pts: number) => {
    const d = perDriver.get(code) ?? { name: name ?? code, points: 0 };
    d.points += pts;
    perDriver.set(code, d);
  };
  let wins = 0, podiums = 0, oneTwos = 0;
  const weekends: TeamWeekend[] = sorted.map((b) => {
    const mine = b.results.filter((r) => r.team === team);
    const gp = mine.reduce((s, r) => s + (r.points ?? 0), 0);
    for (const r of mine) add(r.code, r.driver, r.points ?? 0);
    const sp = (b.sprint ?? []).filter((r) => r.team === team);
    const sprint = sp.reduce((s, r) => s + r.points, 0);
    for (const r of sp) add(r.code, r.driver, r.points);
    const fin = mine.filter((r) => r.status === 'Finished' && r.pos != null);
    wins += fin.filter((r) => r.pos === 1).length;
    podiums += fin.filter((r) => (r.pos as number) <= 3).length;
    if (fin.some((r) => r.pos === 1) && fin.some((r) => r.pos === 2)) oneTwos++;
    return { round: b.round, race: b.name, gp, sprint, points: gp + sprint };
  });
  return {
    weekends,
    total: weekends.reduce((s, w) => s + w.points, 0),
    wins, podiums, oneTwos,
    drivers: [...perDriver.entries()].map(([code, d]) => ({ code, name: d.name, points: d.points })).filter((d) => d.points > 0).sort((a, b) => b.points - a.points),
  };
}
