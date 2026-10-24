import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-700/50 bg-muted/40 px-6 py-10 text-center',
        className
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700/60 bg-surface text-gray-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="font-f1 text-sm font-bold uppercase tracking-wide text-white">{title}</p>
      {message && <p className="max-w-sm text-sm text-gray-400">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
