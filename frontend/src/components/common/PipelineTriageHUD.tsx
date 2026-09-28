import React from 'react';
import { motion } from 'framer-motion';
import { Filter, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { LogStatus } from '../../types/log';

interface PipelineTriageHUDProps {
  counts: {
    unprocessed: number;
    ai_resolved: number;
    needs_review: number;
    approved: number;
    total: number;
  };
  filterStatus: LogStatus | 'all';
  onSelectFilter: (status: LogStatus | 'all') => void;
}

export const PipelineTriageHUD: React.FC<PipelineTriageHUDProps> = ({
  counts,
  filterStatus,
  onSelectFilter,
}) => {
  const total = counts.total || 1;

  const stages = [
    {
      id: 'unprocessed' as LogStatus,
      step: '01',
      title: 'Ingestion Queue',
      count: counts.unprocessed,
      pct: Math.round((counts.unprocessed / total) * 100),
      description: 'Awaiting AI analysis',
      statusLabel: 'In Queue',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      theme: {
        border: 'border-zinc-800 hover:border-cyan-500/60',
        activeRing: 'ring-1 ring-cyan-400 border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/50',
        bar: 'bg-cyan-400',
        badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
      },
    },
    {
      id: 'ai_resolved' as LogStatus,
      step: '02',
      title: 'AI Auto-Mapped',
      count: counts.ai_resolved,
      pct: Math.round((counts.ai_resolved / total) * 100),
      description: 'Ready for rubber-stamp',
      statusLabel: 'Ready',
      icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
      theme: {
        border: 'border-zinc-800 hover:border-amber-500/60',
        activeRing: 'ring-1 ring-amber-400 border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-950/50',
        bar: 'bg-amber-400',
        badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      },
    },
    {
      id: 'needs_review' as LogStatus,
      step: '03',
      title: 'Quarantine Review',
      count: counts.needs_review,
      pct: Math.round((counts.needs_review / total) * 100),
      description: 'Failed schema retries',
      statusLabel: 'Attention',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      theme: {
        border: 'border-zinc-800 hover:border-rose-500/60',
        activeRing: 'ring-1 ring-rose-400 border-rose-400 bg-rose-950/20 shadow-lg shadow-rose-950/50',
        bar: 'bg-rose-400',
        badge: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
      },
    },
    {
      id: 'approved' as LogStatus,
      step: '04',
      title: 'OCSF Ledger',
      count: counts.approved,
      pct: Math.round((counts.approved / total) * 100),
      description: 'Normalized & committed',
      statusLabel: 'Committed',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      theme: {
        border: 'border-zinc-800 hover:border-emerald-500/60',
        activeRing: 'ring-1 ring-emerald-400 border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-950/50',
        bar: 'bg-emerald-400',
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
      },
    },
  ];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-sans font-medium text-white tracking-wide">
            Log Ingestion & Triage Pipeline
          </h2>
          <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
            {counts.total} total events
          </span>
        </div>

        {filterStatus !== 'all' && (
          <button
            onClick={() => onSelectFilter('all')}
            className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded transition-all cursor-pointer font-sans"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Show All Events</span>
          </button>
        )}
      </div>

      {/* Interactive Pipeline Stage Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {stages.map((stage) => {
          const isActive = filterStatus === stage.id;
          return (
            <motion.div
              key={stage.id}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectFilter(isActive ? 'all' : stage.id)}
              className={`relative p-4 rounded-lg border transition-all cursor-pointer bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 flex flex-col justify-between space-y-3 ${
                isActive ? stage.theme.activeRing : `${stage.theme.border} hover:bg-zinc-900/90`
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-zinc-500 font-bold">{stage.step}</span>
                  <span className="text-xs font-sans text-white tracking-wide">{stage.title}</span>
                </div>
                {stage.icon}
              </div>

              {/* Event Count & Percentage */}
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-mono text-white tracking-tight">{stage.count}</span>
                  <span className="text-xs font-sans text-zinc-400">events</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">{stage.pct}%</span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${stage.theme.bar}`}
                />
              </div>

              {/* Subtitle & Status Badge */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-sans">
                <span className="text-zinc-400 truncate max-w-[130px]">{stage.description}</span>
                <span className={`px-2 py-0.5 rounded border text-[10px] ${stage.theme.badge}`}>
                  {stage.statusLabel}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
