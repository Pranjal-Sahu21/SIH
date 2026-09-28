import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center text-[11px] uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-colors px-2.5 py-0.5 rounded border',
  {
    variants: {
      variant: {
        default:
          'text-zinc-400 border-zinc-800 bg-zinc-950/80',
        secondary:
          'text-zinc-300 border-zinc-800 bg-zinc-950/80',
        destructive:
          'text-rose-400 border-rose-800/80 bg-rose-950/40',
        success:
          'text-emerald-400 border-emerald-800/80 bg-emerald-950/40',
        warning:
          'text-amber-400 border-amber-800/80 bg-amber-950/40',
        info:
          'text-cyan-400 border-cyan-800/80 bg-cyan-950/40',
        purple:
          'text-purple-400 border-purple-800/80 bg-purple-950/40',
        outline:
          'text-zinc-300 border-zinc-700/80 bg-zinc-950/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
