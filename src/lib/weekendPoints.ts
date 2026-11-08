/**
 * Race-weekend points: Grand Prix points plus sprint points (sprint weekends only).
 * One place for the rule so the progression chart, the form guide and the data audit agree.
 */
export interface ScoringRow { code: string; points: number | null }
export interface WeekendBlock { results: ScoringRow[]; sprint?: ScoringRow[] }

export const gpPoints = (block: WeekendBlock, code: string): number =>
  block.results.find((r) => r.code === code)?.points ?? 0;

export const sprintPoints = (block: WeekendBlock, code: string): number =>
  block.sprint?.find((r) => r.code === code)?.points ?? 0;

export const weekendPoints = (block: WeekendBlock, code: string): number =>
  gpPoints(block, code) + sprintPoints(block, code);

/** True when the driver scored in, or took part in, this weekend's Grand Prix. */
export const tookPart = (block: WeekendBlock, code: string): boolean =>
  block.results.some((r) => r.code === code);

export function seasonTotals(blocks: WeekendBlock[]): Map<string, { gp: number; sprint: number; total: number }> {
  const out = new Map<string, { gp: number; sprint: number; total: number }>();
  const add = (code: string, gp: number, sprint: number) => {
    const t = out.get(code) ?? { gp: 0, sprint: 0, total: 0 };
    t.gp += gp; t.sprint += sprint; t.total += gp + sprint;
    out.set(code, t);
  };
  for (const b of blocks) {
    for (const r of b.results) add(r.code, r.points ?? 0, 0);
    for (const r of b.sprint ?? []) add(r.code, 0, r.points ?? 0);
  }
  return out;
}
