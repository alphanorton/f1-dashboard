// Constructors' title maths. A team can score at most 25 + 18 in a Grand Prix (1-2 finish)
// and 8 + 7 in a sprint, so the title is decided once the gap exceeds what is still on offer.

export interface ConstructorRow { name: string; shortName: string; points: number }
export interface CalendarRaceRow { status?: string; isSprint?: boolean }

const GP_MAX = 25 + 18;
const SPRINT_MAX = 8 + 7;

export function computeConstructorTitle(constructors: ConstructorRow[], races: CalendarRaceRow[]) {
  if (constructors.length < 2) return null;
  const sorted = [...constructors].sort((a, b) => b.points - a.points);
  const [leader, second] = sorted;
  const remaining = races.filter((r) => r.status === 'upcoming' || r.status === 'next');
  const maxLeft = remaining.reduce((sum, r) => sum + GP_MAX + (r.isSprint ? SPRINT_MAX : 0), 0);
  const gap = leader.points - second.points;
  const clinched = sorted.slice(1).every((c) => c.points + maxLeft < leader.points) || remaining.length === 0;
  return { leader, second, gap, maxLeft, remainingCount: remaining.length, clinched };
}
