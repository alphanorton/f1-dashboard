import React from 'react';
import { Activity, Flag, Info, Ruler, Repeat, CornerUpRight, Timer } from 'lucide-react';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import { getTeamColor2026 } from '@/lib/teamColors';
import type { FormChip, FormGuide, FormRow } from '@/lib/formGuide';
import { cn } from '@/lib/utils';

export interface FormCircuitFacts { name: string; length: number; laps: number; turns: number; lapRecord: string }

const chipClass: Record<FormChip['kind'], string> = {
  p1: 'champ-chip champ-chip-p1',
  p2: 'champ-chip champ-chip-p2',
  p3: 'champ-chip champ-chip-p3',
  pts: 'champ-chip champ-chip-pts',
  dnf: 'champ-chip champ-chip-dnf',
  other: 'champ-chip',
};

const fmtAvg = (n: number | null) => (n === null ? '—' : n.toFixed(1));

function Row({ row, index }: { row: FormRow; index: number }) {
  const color = getTeamColor2026(row.team);
  return (
    <li className="lgp-item fg-row" style={{ '--i': index } as React.CSSProperties}>
      <span className="fg-pos tabular-nums" aria-label={`Championship position ${row.position}`}>{row.position}</span>
      <DriverAvatar code={row.code} name={row.name} team={row.team} size={34} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-white">{row.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
          <span className="truncate">{row.team}</span>
        </span>
      </span>
      <ol className="fg-chips" aria-label={`${row.name}: last ${row.chips.length} Grand Prix finishes, oldest first`}>
        {row.chips.map((c) => (
          <li key={c.round} className={chipClass[c.kind]} title={`R${c.round} ${c.race}: ${c.label}`}>
            <span className="champ-chip-r">R{c.round}</span>
            <span className="champ-chip-p">{c.label}</span>
          </li>
        ))}
      </ol>
      <span className="fg-stat">
        <span className="fg-stat-v tabular-nums">{fmtAvg(row.avgFinish)}</span>
        <span className="fg-stat-l">avg finish</span>
      </span>
      <span className="fg-stat">
        <span className="fg-stat-v tabular-nums">{row.formPoints}</span>
        <span className="fg-stat-l">GP pts</span>
      </span>
    </li>
  );
}

/** Real results only: the last Grands Prix for the top of the championship, plus the next circuit's facts. */
export function FormGuideCard({ guide, circuit, className }: { guide: FormGuide; circuit?: FormCircuitFacts | null; className?: string }) {
  const { nextRace, rows, rounds } = guide;
  if (rows.length === 0 || rounds.length === 0) return null;
  const facts = circuit
    ? [
        { icon: Ruler, label: 'Length', value: `${circuit.length.toFixed(3)} km` },
        { icon: Repeat, label: 'Laps', value: String(circuit.laps) },
        { icon: CornerUpRight, label: 'Turns', value: String(circuit.turns) },
        { icon: Timer, label: 'Lap record', value: circuit.lapRecord.split(' (')[0], sub: circuit.lapRecord.includes('(') ? circuit.lapRecord.slice(circuit.lapRecord.indexOf('(') + 1, -1) : undefined },
      ]
    : [];

  return (
    <section aria-labelledby="form-guide-heading" className={cn('lgp-wrap', className)}>
      <span className="lgp-bloom" aria-hidden="true" />
      <div className="lgp-panel">
        <span className="lgp-accent" aria-hidden="true" />
        <div className="lgp-body">
          <div className="lgp-item flex flex-wrap items-start justify-between gap-3" style={{ '--i': 0 } as React.CSSProperties}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="lgp-icon" aria-hidden="true"><Activity className="h-4 w-4" /></span>
              <div className="min-w-0">
                <h2 id="form-guide-heading" className="font-f1 text-xs font-black uppercase tracking-[0.28em] text-[#FF5A5A]">Form guide</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Last {rounds.length} Grands Prix</span>
                  {nextRace && (
                    <>
                      <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Next: Round {nextRace.round} · {nextRace.name}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <span className="lgp-pill" title="Taken from the Grand Prix results in this project's data">
              <Info className="h-3 w-3" aria-hidden="true" />
              Race results · no prediction
            </span>
          </div>

          <ol className="mt-4 grid gap-1.5" aria-label="Form of the top six in the championship">
            {rows.map((row, i) => <Row key={row.code} row={row} index={i + 1} />)}
          </ol>

          {facts.length > 0 && (
            <div className="lgp-item mt-4" style={{ '--i': rows.length + 1 } as React.CSSProperties}>
              <p className="lgp-eyebrow">The next circuit{circuit ? ` · ${circuit.name.replace(/ \(.*\)$/, '')}` : ''}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {facts.map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="fg-fact">
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400"><Icon className="h-3.5 w-3.5 text-[#FF8F89]" aria-hidden="true" />{label}</dt>
                    <dd className="mt-0.5 font-f1 text-base font-black tabular-nums text-white">{value}</dd>
                    {sub && <dd className="truncate text-[11px] text-gray-400">{sub}</dd>}
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
            Colours: gold, silver and bronze are podium places; white is a points finish. Grand Prix points only; sprint points are not in the results data.
          </p>
        </div>
      </div>
    </section>
  );
}
