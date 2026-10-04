// 2026 F1 points system and the helpers the results data depends on.
//
// No fastest-lap point is awarded in 2026, so a classified top-ten finish is the only
// way to score. The same table is used by gen-round-16-results.cjs and checked by
// points.test.ts.

export const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const;

export const POINTS_SYSTEM_LABEL = '25-18-15-12-10-8-6-4-2-1';

/**
 * Points for a classified position. `null` covers DNF, DNS and NC entries, which score
 * nothing even when the car is listed in the classification.
 */
export function pointsForPosition(position: number | null | undefined): number {
  if (position === null || position === undefined) return 0;
  if (!Number.isInteger(position) || position < 1) return 0;
  return position <= 10 ? POINTS_SYSTEM[position - 1] : 0;
}

/** True when a classified position is inside the points. */
export function isPointsPosition(position: number | null | undefined): boolean {
  return pointsForPosition(position) > 0;
}

/**
 * Total for a constructor from its drivers' results. Used to keep constructor totals
 * equal to the sum of the points actually scored by the cars running that season.
 */
export function constructorPoints(
  results: Array<{ team: string; pos: number | null; points?: number }>
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const result of results) {
    const gained = result.points ?? pointsForPosition(result.pos);
    totals.set(result.team, (totals.get(result.team) ?? 0) + gained);
  }
  return totals;
}
