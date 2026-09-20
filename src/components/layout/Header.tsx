import React from 'react';
import { Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="sticky top-0 z-10 h-16 bg-[#0B0B14]/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-f1-red shadow-lg shadow-f1-red/20">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-f1 text-base font-black uppercase tracking-tight text-white truncate sm:text-xl">
            F1 Dashboard 2026
          </h1>
          <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-gray-500">
            Race Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/tyres"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-f1-red/40 bg-f1-red/10 px-3 py-1.5 text-xs font-semibold text-f1-red transition-colors hover:bg-f1-red/20"
        >
          <Zap className="h-3.5 w-3.5" />
          Tyres
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-gray-300">Season 2026</span>
        </div>
      </div>
    </header>
  );
}
