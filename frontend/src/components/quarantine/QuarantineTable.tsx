import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RawLogItem, LogStatus } from '../../types/log';
import { StatusBadge } from '../common/Badge';
import { PipelineTriageHUD } from '../common/PipelineTriageHUD';
import { DashboardCharts } from '../common/DashboardCharts';

interface QuarantineTableProps {
  logs: RawLogItem[];
  onSelectLogForReview: (log: RawLogItem) => void;
}

export const QuarantineTable: React.FC<QuarantineTableProps> = ({
  logs,
  onSelectLogForReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<LogStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAll, setShowAll] = useState(false);

  // Summary counts
  const counts = useMemo(() => {
    return {
      unprocessed: logs.filter((l) => l.status === 'unprocessed').length,
      ai_resolved: logs.filter((l) => l.status === 'ai_resolved').length,
      needs_review: logs.filter((l) => l.status === 'needs_review').length,
      approved: logs.filter((l) => l.status === 'approved').length,
      total: logs.length,
    };
  }, [logs]);

  // Filtered & Sorted Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (filterStatus !== 'all' && log.status !== filterStatus) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            log.raw_log.toLowerCase().includes(query) ||
            log.source.toLowerCase().includes(query) ||
            log.timestamp.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, filterStatus, searchQuery, sortOrder]);

  const visibleLogs = useMemo(() => {
    return showAll ? filteredLogs : filteredLogs.slice(0, 5);
  }, [filteredLogs, showAll]);

  return (
    <div className="space-y-6">
      {/* Interactive Log Pipeline & Triage Flow HUD */}
      <PipelineTriageHUD
        counts={counts}
        filterStatus={filterStatus}
        onSelectFilter={setFilterStatus}
      />

      {/* Real-time Dashboard Analytics Section using Chart.js */}
      <DashboardCharts />

      {/* Control Bar: Search & Filters */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search raw log, IP, or source device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono tracking-wide"
          />
        </div>

        {/* Right: Status filter & Sort toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded text-xs tracking-wide transition-all cursor-pointer font-sans ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setFilterStatus('unprocessed')}
              className={`px-3 py-1.5 rounded text-xs tracking-wide transition-all cursor-pointer font-sans ${
                filterStatus === 'unprocessed'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              Unprocessed ({counts.unprocessed})
            </button>
            <button
              onClick={() => setFilterStatus('ai_resolved')}
              className={`px-3 py-1.5 rounded text-xs tracking-wide transition-all cursor-pointer font-sans ${
                filterStatus === 'ai_resolved'
                  ? 'bg-amber-950 text-amber-200 border border-amber-800/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              AI-Resolved ({counts.ai_resolved})
            </button>
            <button
              onClick={() => setFilterStatus('needs_review')}
              className={`px-3 py-1.5 rounded text-xs tracking-wide transition-all cursor-pointer font-sans ${
                filterStatus === 'needs_review'
                  ? 'bg-rose-950 text-rose-200 border border-rose-800/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              Needs Review ({counts.needs_review})
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-sans text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
            title="Toggle timestamp sort order"
          >
            {sortOrder === 'desc' ? 'Sort: Newest ↓' : 'Sort: Oldest ↑'}
          </motion.button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-xs text-zinc-400 font-sans tracking-wide">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Source Device / IP</th>
                <th className="py-3.5 px-4">Raw Log Preview</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-xs">
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono">
                    No log events found matching the criteria.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="sync">
                  {visibleLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectLogForReview(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 font-mono text-xs text-zinc-300 whitespace-nowrap">
                        {log.source === 'Unknown' ? (
                          <span className="text-zinc-500 italic">Unknown</span>
                        ) : (
                          <span className="text-cyan-400">{log.source}</span>
                        )}
                      </td>

                      {/* Raw Log Preview */}
                      <td className="py-3 px-4 font-mono text-xs text-zinc-300 max-w-md truncate" title={log.raw_log}>
                        <span className="bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/60 block truncate">
                          {log.raw_log}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onSelectLogForReview(log)}
                          className="px-3 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
                        >
                          Review
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar with Show More / Show Less */}
        <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 font-mono">
          <span>Showing {visibleLogs.length} of {filteredLogs.length} quarantine logs</span>
          {filteredLogs.length > 5 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAll(!showAll)}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-700/80 rounded text-xs transition-all cursor-pointer font-mono"
            >
              {showAll ? 'Show Less (5)' : `Show More (${filteredLogs.length - 5} more)`}
            </motion.button>
          )}
          <span>Deterministic Registry Active · Fast-path 0.12ms average</span>
        </div>
      </div>
    </div>
  );
};
