import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      className={cn('animate-pulse rounded-md bg-muted/60', className)}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}
