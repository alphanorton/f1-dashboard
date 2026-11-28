import React from 'react';
import { Zap } from 'lucide-react';
import type { SprintResultEntry } from '@/models/grandPrix';

/** The sprint's points-scoring places for one race weekend. Sprint points are separate from the Grand Prix points. */
export function SprintClassification({ raceName, sprint }: { raceName: string; sprint: SprintResultEntry[] | undefined }) {
  if (!sprint || sprint.length === 0) return null;
  return (
    <div className="bg-gray-800/40 border border-amber-500/25 p-4 rounded-xl" data-testid="sprint-classification">
      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
        <Zap className="h-4 w-4" aria-hidden="true" />
        Sprint Classification â€” top {sprint.length}
      </h4>
      <p className="text-xs text-gray-400 mb-3">Sprint points (8 to 1) are separate from the Grand Prix points and count towards the championship.</p>
      <ol className="space-y-1" aria-label={`${raceName} sprint classification`}>
        {sprint.map((r) => (
          <li
            key={r.code}
            className={`flex items-center justify-between px-3 py-1.5 rounded-md border ${
              r.pos === 1 ? 'bg-amber-500/10 border-amber-500/30' : r.pos <= 3 ? 'bg-gray-900/70 border-gray-700' : 'bg-gray-900/40 border-gray-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                r.pos === 1 ? 'bg-amber-500 text-black' : r.pos === 2 ? 'bg-gray-300 text-black' : r.pos === 3 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-300'
              }`}>{r.pos}</span>
              <div className="min-w-0">
                <span className="text-sm font-medium truncate block text-white">{r.driver}</span>
                <span className="text-xs text-gray-400 truncate block">{r.team}</span>
              </div>
            </div>
            <p className="text-xs text-gray-300 font-mono shrink-0">+{r.points} points</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

