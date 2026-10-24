import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Could not load data',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-10 text-center',
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-400">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-f1 text-sm font-bold uppercase tracking-wide text-white">{title}</p>
      {message && <p className="max-w-md text-sm text-gray-400">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-f1-red/50 px-4 py-2 text-sm font-semibold text-f1-red transition-colors hover:bg-f1-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
