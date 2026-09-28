import React from 'react';
import type { RegistryRule } from '../../types/log';
import { INITIAL_REGISTRY_RULES } from '../../api/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface ParserRegistryViewProps {
  rules: RegistryRule[];
}

export const ParserRegistryView: React.FC<ParserRegistryViewProps> = ({ rules = INITIAL_REGISTRY_RULES }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg text-white tracking-wide">Deterministic Parser Registry</h2>
            <Badge variant="purple">Fast-Path Rulebook</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Promoted rules bypass AI processing to normalize matching logs deterministically in microseconds.
          </p>
        </div>

        {/* Speed Stats Comparison Pill */}
        <div className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-lg flex items-center text-xs w-full md:w-auto justify-between md:justify-start">
          <div className="pr-4 sm:pr-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Registry Speed</div>
            <div className="text-emerald-400 mt-0.5">
              0.15 ms / log
            </div>
          </div>
          <div className="border-l border-zinc-800 pl-4 sm:pl-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">AI Fallback Speed</div>
            <div className="text-amber-400 mt-0.5">
              15 - 40 sec / log
            </div>
          </div>
        </div>
      </Card>

      {/* Rules Table */}
      <Card className="overflow-hidden shadow-2xl">
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-4">
          <span className="text-xs text-zinc-300">
            Active Promoted Parser Rules ({rules.length})
          </span>
          <span className="text-xs text-zinc-500">99.98% Total Log Pipeline Throughput</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Source Regex Pattern</TableHead>
              <TableHead>Target OCSF Class</TableHead>
              <TableHead>Source Origin</TableHead>
              <TableHead className="text-right">Processed Count</TableHead>
              <TableHead className="text-right">Avg Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="text-white">{rule.rule_name}</TableCell>
                <TableCell className="text-cyan-300 font-mono max-w-xs truncate" title={rule.source_pattern}>
                  <code className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{rule.source_pattern}</code>
                </TableCell>
                <TableCell className="text-emerald-300">{rule.ocsf_class}</TableCell>
                <TableCell>
                  {rule.created_from_ai ? (
                    <Badge variant="info">
                      Promoted from AI
                    </Badge>
                  ) : (
                    <Badge variant="default">
                      Hand-Written
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-zinc-200">
                  {rule.match_count.toLocaleString()} logs
                </TableCell>
                <TableCell className="text-right text-emerald-400">
                  {rule.avg_latency_ms} ms
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
