import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6', className)}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="p-2.5 rounded-xl bg-f1-red/10 border border-f1-red/30 text-f1-red">
              <Icon className="h-7 w-7" />
            </span>
          )}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-f1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
