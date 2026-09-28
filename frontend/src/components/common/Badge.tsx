import React from 'react';
import type { LogStatus } from '../../types/log';

interface StatusBadgeProps {
  status: LogStatus | 'quarantined' | 'parsed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'unprocessed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide bg-zinc-900 text-zinc-400 border border-zinc-700/80">
          Unprocessed
        </span>
      );
    case 'ai_resolved':
    case 'parsed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide bg-amber-950/60 text-amber-300 border border-amber-800/70">
          AI-Resolved
        </span>
      );
    case 'needs_review':
    case 'quarantined':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide bg-rose-950/70 text-rose-300 border border-rose-800/80">
          Needs Review
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
          Approved
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
        return { label: '0 - Unknown', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      case 1:
        return { label: '1 - Info', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 2:
        return { label: '2 - Low', color: 'bg-teal-950 text-teal-300 border-teal-800' };
      case 3:
        return { label: '3 - Medium', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 4:
        return { label: '4 - High', color: 'bg-orange-950 text-orange-300 border-orange-800' };
      case 5:
        return { label: '5 - Critical', color: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 6:
        return { label: '6 - Fatal', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      default:
        return { label: `${id} - Custom`, color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const info = getSeverityInfo(severityId);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${info.color}`}>
      {info.label}
    </span>
  );
};
