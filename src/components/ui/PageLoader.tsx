import React from 'react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[60vh]', className)} role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium">{message}</p>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
