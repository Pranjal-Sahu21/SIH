import React from 'react';

interface StatCardProps {
  title: string;
  count: number;
  description?: string;
  badgeColor?: string;
  accentBorder?: string;
  trend?: string;
  active?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  description,
  badgeColor = 'border-zinc-800 bg-zinc-900',
  accentBorder = 'border-t-zinc-700',
  trend,
  active = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-6 rounded-lg border border-t-2 transition-all cursor-pointer bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 min-h-[110px] sm:min-h-[130px] flex flex-col justify-between ${badgeColor} ${accentBorder} ${
        active
          ? 'ring-1 ring-zinc-500 border-zinc-600 shadow-xl scale-[1.01]'
          : 'hover:border-zinc-700 hover:from-zinc-900/95 hover:to-zinc-900/90'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm text-zinc-300 font-sans tracking-wide truncate">{title}</span>
        {trend && (
          <span className="text-[10px] sm:text-[11px] font-sans px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-800 flex-shrink-0">
            {trend}
          </span>
        )}
      </div>

      <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
        <div className="flex items-baseline">
          <span className="text-2xl sm:text-3xl font-mono text-white tracking-tight">{count}</span>
          <span className="text-[11px] sm:text-xs text-zinc-500 font-sans ml-1.5">events</span>
        </div>
        {description && (
          <span className="text-[10px] sm:text-xs text-zinc-400 font-sans bg-zinc-950/60 px-2 py-0.5 sm:py-1 rounded border border-zinc-800/80 truncate max-w-[140px] sm:max-w-none">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
