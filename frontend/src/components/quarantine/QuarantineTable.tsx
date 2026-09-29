import React, { useState, useMemo } from 'react';
import type { RawLogItem, LogStatus } from '../../types/log';
import { StatusBadge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { DashboardCharts } from '../common/DashboardCharts';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Search, ArrowUpDown, Eye, Cpu, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { LogUploader } from '../common/LogUploader';
interface QuarantineTableProps {
  logs: RawLogItem[];
  onSelectLogForReview: (log: RawLogItem) => void;
  onRefresh?: () => void;
}

export const QuarantineTable: React.FC<QuarantineTableProps> = ({
  logs,
  onSelectLogForReview,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<LogStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

  return (
    <div className="space-y-6">
      {/* Triage Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Unprocessed Queue"
          count={counts.unprocessed}
          total={counts.total}
          description="Awaiting AI analysis"
          badgeColor="bg-zinc-900/90 border-zinc-800"
          colorTheme="cyan"
          icon={<Clock className="w-5 h-5 text-cyan-400" />}
          active={filterStatus === 'unprocessed'}
          onClick={() => setFilterStatus(filterStatus === 'unprocessed' ? 'all' : 'unprocessed')}
        />
        <StatCard
          title="AI-Resolved"
          count={counts.ai_resolved}
          total={counts.total}
          description="Ready for rubber-stamp"
          badgeColor="bg-amber-950/20 border-amber-900/50"
          colorTheme="amber"
          icon={<Cpu className="w-5 h-5 text-amber-400" />}
          active={filterStatus === 'ai_resolved'}
          onClick={() => setFilterStatus(filterStatus === 'ai_resolved' ? 'all' : 'ai_resolved')}
        />
        <StatCard
          title="Needs Human Review"
          count={counts.needs_review}
          total={counts.total}
          description="Failed 3 retries"
          badgeColor="bg-rose-950/20 border-rose-900/50"
          colorTheme="rose"
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          active={filterStatus === 'needs_review'}
          onClick={() => setFilterStatus(filterStatus === 'needs_review' ? 'all' : 'needs_review')}
        />
        <StatCard
          title="Approved Logs"
          count={counts.approved}
          total={counts.total}
          description="Normalized & committed"
          badgeColor="bg-emerald-950/20 border-emerald-900/50"
          colorTheme="emerald"
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          active={filterStatus === 'approved'}
          onClick={() => setFilterStatus(filterStatus === 'approved' ? 'all' : 'approved')}
        />
      </div>

      {/* Chart.js Dashboard Visualizations */}
      <DashboardCharts />

      {/* Control Bar: Search & Filters */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search raw log, IP, or source device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Right: Status filter & Sort toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
            <Button
              variant={filterStatus === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({counts.total})
            </Button>
            <Button
              variant={filterStatus === 'unprocessed' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('unprocessed')}
            >
              Unprocessed
            </Button>
            <Button
              variant={filterStatus === 'ai_resolved' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('ai_resolved')}
              className={filterStatus === 'ai_resolved' ? 'bg-amber-950/80 text-amber-300' : ''}
            >
              AI-Resolved
            </Button>
            <Button
              variant={filterStatus === 'needs_review' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('needs_review')}
              className={filterStatus === 'needs_review' ? 'bg-rose-950/80 text-rose-300' : ''}
            >
              Needs Review
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            title="Toggle timestamp sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>

          <LogUploader onUploadComplete={onRefresh} />
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-3.5 px-4">Timestamp</TableHead>
              <TableHead className="py-3.5 px-4">Source Device / IP</TableHead>
              <TableHead className="py-3.5 px-4">Raw Log Preview</TableHead>
              <TableHead className="py-3.5 px-4">Status</TableHead>
              <TableHead className="py-3.5 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                  No log events found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectLogForReview(log)}
                >
                  {/* Timestamp */}
                  <TableCell className="text-xs text-zinc-400 whitespace-nowrap">
                    {log.timestamp}
                  </TableCell>

                  {/* Source */}
                  <TableCell className="text-xs text-zinc-300 whitespace-nowrap">
                    {log.source === 'Unknown' ? (
                      <span className="text-zinc-500 italic">Unknown</span>
                    ) : (
                      <span className="text-cyan-400">{log.source}</span>
                    )}
                  </TableCell>

                  {/* Raw Log Preview */}
                  <TableCell className="font-mono text-xs text-zinc-300 max-w-md truncate" title={log.raw_log}>
                    <span className="bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/60 block truncate">
                      {log.raw_log}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={log.status} />
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectLogForReview(log)}
                      className="group-hover:border-zinc-500"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Clean Responsive Footer Bar */}
        <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 text-center sm:text-left">
          <span>Showing {filteredLogs.length} of {logs.length} quarantine logs</span>
          <span>Deterministic Registry Active · Fast-path 0.12ms average</span>
        </div>
      </Card>
    </div>
  );
};
