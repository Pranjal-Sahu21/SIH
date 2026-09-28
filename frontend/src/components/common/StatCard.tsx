import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  count: number;
  total?: number;
  description?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  active?: boolean;
  colorTheme?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'zinc';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  total,
  description,
  badgeColor = 'bg-zinc-900 border-zinc-800',
  icon,
  active = false,
  colorTheme = 'cyan',
  onClick,
}) => {
  const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;

  const themeStyles = {
    cyan: {
      accentText: 'text-cyan-400',
      bar: 'bg-cyan-400',
      badge: 'text-cyan-400 bg-cyan-950/80 border-cyan-800/60',
    },
    amber: {
      accentText: 'text-amber-400',
      bar: 'bg-amber-400',
      badge: 'text-amber-400 bg-amber-950/80 border-amber-800/60',
    },
    rose: {
      accentText: 'text-rose-400',
      bar: 'bg-rose-400',
      badge: 'text-rose-400 bg-rose-950/80 border-rose-800/60',
    },
    emerald: {
      accentText: 'text-emerald-400',
      bar: 'bg-emerald-400',
      badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60',
    },
    zinc: {
      accentText: 'text-zinc-400',
      bar: 'bg-zinc-400',
      badge: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    },
  }[colorTheme];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-5 sm:p-6 min-h-[148px] flex flex-col justify-between cursor-pointer transition-all hover:border-zinc-700 hover:shadow-2xl select-none group',
        badgeColor,
        active && 'ring-2 ring-zinc-400 border-zinc-600 bg-zinc-900/90 shadow-2xl'
      )}
    >
      {/* Top Header: Title & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-sans group-hover:text-zinc-200 transition-colors">
          {title}
        </span>
        {icon && <div className="text-zinc-400 group-hover:scale-110 transition-transform">{icon}</div>}
      </div>

      {/* Middle: Count & Percentage Badge */}
      <div className="my-2 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl sm:text-4xl text-white tracking-tight">{count}</span>
          <span className="text-xs text-zinc-500">events</span>
        </div>
        {total !== undefined && (
          <span className={cn('text-xs uppercase tracking-wider px-2 py-0.5 rounded border text-[11px]', themeStyles.badge)}>
            {percentage}% OF TOTAL
          </span>
        )}
      </div>

      {/* Bottom: Subtitle & Progress Bar */}
      <div className="space-y-2 pt-1">
        {description && (
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="truncate max-w-[170px]">{description}</span>
            {total !== undefined && (
              <span className="text-[11px] text-zinc-500">{count}/{total}</span>
            )}
          </div>
        )}
        {total !== undefined && (
          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn('h-full', themeStyles.bar)}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
