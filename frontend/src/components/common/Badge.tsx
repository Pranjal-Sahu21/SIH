import React from 'react';
import type { LogStatus } from '../../types/log';

interface StatusBadgeProps {
  status: LogStatus | 'quarantined' | 'parsed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'unprocessed':
      return (
        <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400">
          UNPROCESSED
        </span>
      );
    case 'ai_resolved':
    case 'parsed':
      return (
        <span className="px-2 py-0.5 rounded border border-amber-800/80 bg-amber-950/40 text-[11px] uppercase tracking-wider text-amber-400">
          AI-RESOLVED
        </span>
      );
    case 'needs_review':
    case 'quarantined':
      return (
        <span className="px-2 py-0.5 rounded border border-rose-800/80 bg-rose-950/40 text-[11px] uppercase tracking-wider text-rose-400">
          NEEDS REVIEW
        </span>
      );
    case 'approved':
      return (
        <span className="px-2 py-0.5 rounded border border-emerald-800/80 bg-emerald-950/40 text-[11px] uppercase tracking-wider text-emerald-400">
          APPROVED
        </span>
      );
    default:
      return null;
  }
};

interface SeverityBadgeProps {
  severityId: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severityId }) => {
  const getSeverityInfo = (id: number) => {
    switch (id) {
      case 0:
        return { label: '0 - UNKNOWN', style: 'text-zinc-400 border-zinc-800 bg-zinc-950/80' };
      case 1:
        return { label: '1 - INFO', style: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40' };
      case 2:
        return { label: '2 - LOW', style: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40' };
      case 3:
        return { label: '3 - MEDIUM', style: 'text-amber-400 border-amber-800/80 bg-amber-950/40' };
      case 4:
        return { label: '4 - HIGH', style: 'text-amber-400 border-amber-800/80 bg-amber-950/40' };
      case 5:
        return { label: '5 - CRITICAL', style: 'text-rose-400 border-rose-800/80 bg-rose-950/40' };
      case 6:
        return { label: '6 - FATAL', style: 'text-purple-400 border-purple-800/80 bg-purple-950/40' };
      default:
        return { label: `${id} - CUSTOM`, style: 'text-zinc-400 border-zinc-800 bg-zinc-950/80' };
    }
  };

  const info = getSeverityInfo(severityId);

  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] uppercase tracking-wider ${info.style}`}>
      {info.label}
    </span>
  );
};
