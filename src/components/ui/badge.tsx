import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

function badgeVariants({ variant = 'default' }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
  
  const variants = {
    default: 'bg-f1-red text-white hover:bg-f1-red/90',
    secondary: 'bg-muted text-white hover:bg-muted/80',
    destructive: 'bg-red-600 text-white hover:bg-red-600/90',
    outline: 'border border-border bg-transparent hover:bg-surface',
    success: 'bg-green-600 text-white hover:bg-green-600/90',
  };
  
  return `${base} ${variants[variant]}`;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';