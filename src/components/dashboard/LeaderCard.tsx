import React from 'react';
import { Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { teamTint } from '@/lib/teamColors';

export interface LeaderRow {
  key: string;
  position: number;
  name: string;
  sub?: string;
  points: number;
  gap: number | null;
  color: string;
  textColor: string;
  ghost: string;
}

/**
 * Championship card: P1 gets a large "hero" block tinted with the team colour, P2/P3 are compact rows
 * with a bar that shows how close they are to the leader (bar width = points / leader points).
 */
export function LeaderCard({ title, icon: Icon, rows, index }: { title: string; icon: LucideIcon; rows: LeaderRow[]; index: number }) {
  const [leader, ...rest] = rows;
  if (!leader) return null;
  const margin = rest[0] ? leader.points - rest[0].points : null;

  return (
    <div
      className="glass spotlight lift overflow-hidden rounded-2xl border"
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 sm:px-5">
        <Icon className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
        <h3 className="font-f1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">{title}</h3>
      </div>

      <div
        className="relative overflow-hidden px-4 pb-5 pt-4 sm:px-5"
        style={{ backgroundImage: `radial-gradient(460px 220px at 0% 0%, ${teamTint(leader.color, 0.3)}, transparent 70%)` }}
      >
        <span aria-hidden="true" className="dx-ghost pointer-events-none absolute -bottom-4 right-1 text-[92px] sm:text-[116px]">
          {leader.ghost}
        </span>
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: leader.color }} />
        <div className="relative">
          <span className="dx-pos dx-pos-pill" data-p="1">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Leader
          </span>
          <p className="mt-3 text-balance font-f1 text-xl font-black uppercase leading-tight text-white sm:text-2xl">{leader.name}</p>
          {leader.sub && (
            <p className="mt-0.5 text-sm font-semibold" style={{ color: leader.textColor }}>
              {leader.sub}
            </p>
          )}
          <div className="mt-4 flex items-end gap-2">
            <span className="font-f1 text-4xl font-black text-white sm:text-5xl">
              <AnimatedNumber value={leader.points} />
            </span>
            <span className="pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">pts</span>
            {margin !== null && margin > 0 && (
              <span className="mb-1 ml-auto rounded-full border border-neon-green/30 bg-neon-green/10 px-2.5 py-1 text-xs font-bold tabular-nums text-neon-green">
                +{margin} on P2
              </span>
            )}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-white/5">
        {rest.map((row) => {
          const pct = Math.max(2, Math.min(100, (row.points / Math.max(leader.points, 1)) * 100));
          const gap = row.gap ?? leader.points - row.points;
          return (
            <li
              key={row.key}
              className="standings-preview-row px-4 py-3 sm:px-5"
              style={{ '--team-color': row.color } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="dx-pos dx-pos-round" data-p={row.position}>
                  {row.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{row.name}</p>
                  {row.sub && (
                    <p className="truncate text-xs" style={{ color: row.textColor }}>
                      {row.sub}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    <AnimatedNumber value={row.points} />
                  </p>
                  <p className="text-xs tabular-nums text-gray-400">{gap > 0 ? `−${gap}` : 'Level'}</p>
                </div>
              </div>
              <div className="dx-gapbar mt-2.5" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
