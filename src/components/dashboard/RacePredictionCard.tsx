import React from 'react';
import { Activity, Flag, Gauge, Info, Trophy } from 'lucide-react';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import { getTeamColor2026 } from '@/lib/teamColors';
import type { DriverForm, RacePrediction } from '@/lib/racePrediction';
import { cn } from '@/lib/utils';

interface RacePredictionCardProps {
  prediction: RacePrediction;
  className?: string;
}

const RANK_MEDAL: Record<number, string> = {
  1: 'var(--dx-gold)',
  2: 'var(--dx-silver)',
  3: 'var(--dx-bronze)',
};

const CONFIDENCE_LABEL: Record<RacePrediction['confidence'], string> = {
  'clear-favourite': 'Clear favourite',
  'narrow-favourite': 'Narrow favourite',
  'too-close': 'Too close to call',
};

const fmt = (n: number | null, digits = 1) => (n === null || !Number.isFinite(n) ? '—' : n.toFixed(digits));

/** One-line, unambiguous note that this is a projection, never a result. */
function ProjectionPill() {
  return (
    <span className="lgp-pill" title="Derived from this project's own results and standings data">
      <Info className="h-3 w-3" aria-hidden="true" />
      Model output · not a result
    </span>
  );
}

function PodiumRow({ driver, index, best }: { driver: DriverForm; index: number; best: number }) {
  const color = getTeamColor2026(driver.team);
  const pct = best > 0 ? Math.max(3, Math.round((driver.score / best) * 100)) : 0;
  return (
    <li className="lgp-row" style={{ '--i': index } as React.CSSProperties}>
      <span className="lgp-rank" style={{ color: RANK_MEDAL[index + 1] ?? '#cbd0db' }} aria-hidden="true">
        {index + 1}
      </span>
      <DriverAvatar code={driver.code} name={driver.name} team={driver.team} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{driver.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
          <span className="truncate">{driver.team}</span>
        </span>
      </span>
      <span className="lgp-bar" aria-hidden="true">
        <span className="lgp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="lgp-score" aria-label={`Model score ${driver.score.toFixed(1)}`}>
        {driver.score.toFixed(1)}
      </span>
    </li>
  );
}

export function RacePredictionCard({ prediction, className }: RacePredictionCardProps) {
  const { winner, topThree, nextRace, championship, confidence, confidenceNote, roundsUsed } = prediction;
  const winnerColor = getTeamColor2026(winner.team);
  const best = topThree[0]?.score ?? 0;

  return (
    <section
      aria-labelledby="race-prediction-heading"
      className={cn('lgp-wrap', className)}
    >
      {/* Colour bloom *behind* the panel — this is what the glass actually refracts. */}
      <span className="lgp-bloom" aria-hidden="true" />

      <div className="lgp-panel">
        <span className="lgp-accent" aria-hidden="true" />

        <div className="lgp-body">
          {/* Header */}
          <div className="lgp-item flex flex-wrap items-start justify-between gap-3" style={{ '--i': 0 } as React.CSSProperties}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="lgp-icon" aria-hidden="true">
                <Activity className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 id="race-prediction-heading" className="font-f1 text-xs font-black uppercase tracking-[0.28em] text-[#FF5A5A]">
                  Race Prediction
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                  {nextRace ? (
                    <>
                      <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="font-semibold text-gray-300">
                        Round {nextRace.round} · {nextRace.name}
                      </span>
                      <span className="hidden sm:inline">— {nextRace.circuit}</span>
                    </>
                  ) : (
                    <span>No race left on the calendar</span>
                  )}
                </p>
              </div>
            </div>
            <ProjectionPill />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-5">
            {/* Predicted winner */}
            <div className="lgp-item lgp-winner" style={{ '--i': 1 } as React.CSSProperties}>
              <p className="lgp-eyebrow">Predicted winner</p>

              <div className="mt-2.5 flex items-center gap-3">
                <DriverAvatar code={winner.code} name={winner.name} team={winner.team} size={62} />
                <div className="min-w-0">
                  <p className="truncate font-f1 text-xl font-black leading-tight text-white sm:text-2xl">{winner.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: winnerColor }} aria-hidden="true" />
                    <span className="truncate">{winner.team}</span>
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300">
                    <Gauge className="h-3 w-3" aria-hidden="true" />
                    {CONFIDENCE_LABEL[confidence]}
                  </p>
                </div>
              </div>

              <dl className="mt-3.5 grid grid-cols-3 gap-2">
                {[
                  { label: `Last ${roundsUsed.length} form`, value: `${fmt(winner.formScore)}`, sub: 'pts / race' },
                  { label: 'Season avg', value: `${fmt(winner.seasonRate)}`, sub: 'pts / race' },
                  { label: 'Avg finish', value: fmt(winner.avgFinish), sub: 'in window' },
                ].map((m) => (
                  <div key={m.label} className="lgp-metric">
                    <dt className="lgp-metric-label">{m.label}</dt>
                    <dd className="lgp-metric-value">{m.value}</dd>
                    <dd className="lgp-metric-sub">{m.sub}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-[11px] leading-relaxed text-gray-400">{confidenceNote}</p>
            </div>

            {/* Projected podium */}
            <div className="lgp-item" style={{ '--i': 2 } as React.CSSProperties}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="lgp-eyebrow flex items-center gap-1.5">
                  <Trophy className="h-3 w-3 text-amber-300" aria-hidden="true" />
                  Projected podium
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Model score</p>
              </div>

              {topThree.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">Not enough verified results to project a podium.</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {topThree.map((d, i) => (
                    <PodiumRow key={d.code} driver={d} index={i} best={best} />
                  ))}
                </ol>
              )}

              {topThree.length > 0 && (
                <p className="mt-2.5 text-[10px] leading-relaxed text-gray-500">
                  Bar length is the model score relative to the leader — a ranking aid, not a probability.
                </p>
              )}
            </div>
          </div>

          {/* Championship context */}
          <div className="lgp-item lgp-context" style={{ '--i': 3 } as React.CSSProperties}>
            <p className="lgp-eyebrow">Championship context</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-300">
              {championship.leaderName ? (
                <>
                  <span className="font-bold text-white">{championship.leaderName}</span> leads on{' '}
                  <span className="font-mono font-bold text-white">{championship.leaderPoints}</span> pts
                  {championship.titleDecided ? (
                    <> — the drivers&apos; title is already decided.</>
                  ) : (
                    <>
                      {' '}with {championship.remainingRaces} race{championship.remainingRaces === 1 ? '' : 's'} left
                      ({championship.maxPointsAvailable} pts still available).
                    </>
                  )}
                </>
              ) : (
                <>Championship standings are unavailable for this projection.</>
              )}
            </p>
            {championship.leaderName && !championship.predictedDriverAlive && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-300/90">
                {winner.name} is mathematically out of the title: the gap to the leader is larger than the{' '}
                {championship.maxPointsAvailable} points still on offer, so this projection covers the race win only.
              </p>
            )}
          </div>

          {/* Model provenance */}
          <p className="lgp-item lgp-note" style={{ '--i': 4 } as React.CSSProperties}>
            Ranked by 70% recency-weighted points over the last {roundsUsed.length} round
            {roundsUsed.length === 1 ? '' : 's'} (R{roundsUsed[0]}–R{roundsUsed[roundsUsed.length - 1]}) + 30% season points
            per race, from this project&apos;s own results and standings. No probability is published because no
            calibrated outcome model exists for this dataset. Predictions are not results.
          </p>
        </div>
      </div>
    </section>
  );
}
