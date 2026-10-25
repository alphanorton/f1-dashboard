import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  kicker?: string;
  action?: { to: string; label: string };
}

/** Section title with a red accent notch, a muted kicker and a hairline that fades out. */
export function SectionHeading({ title, kicker, action }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#FF5A5A] to-f1-red shadow-[0_0_12px_rgba(225,6,0,.55)]" />
      <div className="min-w-0">
        <h2 className="font-f1 text-base font-black uppercase tracking-wide text-white sm:text-lg">{title}</h2>
        {kicker && <p className="text-xs text-gray-400">{kicker}</p>}
      </div>
      <span aria-hidden="true" className="dx-hairline hidden h-px flex-1 sm:block" />
      {action && (
        <Link
          to={action.to}
          className="group ml-auto inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#FF5A5A] focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red sm:ml-0"
        >
          {action.label}
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
