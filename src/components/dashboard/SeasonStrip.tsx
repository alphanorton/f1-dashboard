import React from 'react';

interface StripRace {
  round: number;
  name: string;
  status: string;
  isSprint: boolean;
}

/** One segment per Grand Prix: red = run, outlined + pulsing = up next, amber dot = sprint weekend. */
export function SeasonStrip({ races, nextRound }: { races: StripRace[]; nextRound?: number }) {
  const done = races.filter((r) => r.status === 'completed').length;
  return (
    <div>
      <div
        role="img"
        aria-label={`${done} of ${races.length} rounds completed`}
        className="flex items-end gap-[3px] pt-2 sm:gap-1"
      >
        {races.map((race, i) => {
          const state = race.status === 'completed' ? 'done' : race.round === nextRound ? 'next' : 'todo';
          return (
            <span
              key={race.round}
              className="dx-seg flex-1"
              data-state={state}
              data-sprint={race.isSprint ? 'true' : undefined}
              title={`R${race.round} · ${race.name}`}
              style={{ '--i': i } as React.CSSProperties}
            />
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs tabular-nums text-gray-400">
        <span>R{races[0]?.round}</span>
        <span>R{races[races.length - 1]?.round}</span>
      </div>
    </div>
  );
}
