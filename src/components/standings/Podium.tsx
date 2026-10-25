import React from 'react';
import { Crown, Trophy } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { teamTint } from '@/lib/teamColors';

export interface PodiumEntry {
  key: string;
  position: number;
  name: string;
  sub?: string;
  points: number;
  color: string;
  textColor: string;
  ghost: string;
}

const CONFETTI = Array.from({ length: 24 }, (_, i) => i);

/**
 * Top-3 podium. Columns rise P3 -> P2 -> P1, a spotlight beam sways over the leader, a light
 * sweep runs across P1 and confetti falls behind it. Block height follows the points
 * (leader = tallest). Purely visual: screen readers get an ordered list instead.
 */
export function Podium({ entries, title, className = '' }: { entries: PodiumEntry[]; title: string; className?: string }) {
  const top = entries.slice(0, 3);
  if (top.length < 3) return null;

  const lead = top[0].points > 0 ? top[0].points : 1;
  const order = [top[1], top[0], top[2]];
  const delayFor = (position: number) => (position === 3 ? 0 : position === 2 ? 320 : 640);
  const leader = top[0];

  return (
    <section className={`fx-podium glass spotlight overflow-hidden rounded-2xl border ${className}`} aria-label={title}>
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 sm:px-5">
        <Trophy className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
        <h3 className="font-f1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">{title}</h3>
      </div>

      <ol className="sr-only">
        {top.map((e) => (
          <li key={e.key}>
            {e.position}. {e.name}
            {e.sub ? `, ${e.sub}` : ''}, {e.points} points
          </li>
        ))}
      </ol>

      <div className="fx-pod-stage" aria-hidden="true">
        <span className="fx-beam" style={{ '--beam': teamTint(leader.color, 0.55) } as React.CSSProperties} />

        {order.map((e) => {
          const ratio = Math.max(0, Math.min(1, e.points / lead));
          const k = ((38 + 62 * ratio) / 100) * 0.52;
          return (
            <div
              key={e.key}
              className="fx-pod-col"
              data-p={e.position}
              style={
                {
                  '--c': e.color,
                  '--c-a': teamTint(e.color, 0.5),
                  '--c-b': teamTint(e.color, 0.07),
                  '--k': k,
                  '--d': `${delayFor(e.position)}ms`,
                } as React.CSSProperties
              }
            >
              {e.position === 1 && (
                <div className="fx-confetti">
                  {CONFETTI.map((i) => (
                    <span
                      key={i}
                      style={
                        {
                          left: `${6 + ((i * 37) % 88)}%`,
                          '--t': `${3.4 + (i % 5) * 0.45}s`,
                          '--dl': `${((i * 0.41) % 3.2).toFixed(2)}s`,
                          '--rot': `${(i * 53) % 360}deg`,
                          '--dx': `${((i * 29) % 70) - 35}px`,
                          background: i % 3 === 0 ? e.color : i % 3 === 1 ? '#F5C542' : '#FFFFFF',
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}

              <div className="fx-pod-card">
                {e.position === 1 ? (
                  <span className="dx-pos dx-pos-pill" data-p="1">
                    <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Leader
                  </span>
                ) : (
                  <span className="dx-pos dx-pos-round mx-auto" data-p={String(e.position)}>
                    {e.position}
                  </span>
                )}
                <p className="mt-2 text-balance font-f1 text-[10px] font-black uppercase leading-tight text-white sm:text-sm">
                  {e.name}
                </p>
                {e.sub && (
                  <p className="mt-0.5 truncate text-[10px] font-semibold sm:text-xs" style={{ color: e.textColor }}>
                    {e.sub}
                  </p>
                )}
                <p className="mt-1.5 font-f1 text-lg font-black text-white sm:text-3xl">
                  <AnimatedNumber value={e.points} durationMs={1800} />
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 sm:text-[10px]">pts</p>
              </div>

              <div className="fx-pod-block">
                <span className="fx-pod-shine" />
                <span className="fx-pod-num font-f1">{e.ghost}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
