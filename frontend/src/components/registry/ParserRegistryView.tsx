import React from 'react';
import type { RegistryRule } from '../../types/log';
import { INITIAL_REGISTRY_RULES } from '../../api/mockData';

interface ParserRegistryViewProps {
  rules: RegistryRule[];
}

export const ParserRegistryView: React.FC<ParserRegistryViewProps> = ({ rules = INITIAL_REGISTRY_RULES }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base text-white tracking-wide">Deterministic Parser Registry</h2>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/80 text-[11px] font-mono">
              Fast-Path Rulebook
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Promoted rules bypass the AI model entirely, normalizing matching log formats in microseconds with deterministic precision and zero computational overhead.
          </p>
        </div>

        {/* Speed Stats Comparison Pill */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded flex items-center justify-between sm:justify-start space-x-4 font-mono text-xs w-full md:w-auto">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Registry Speed</div>
            <div className="text-emerald-400">
              0.15 ms / log
            </div>
          </div>
          <div className="border-l border-zinc-800 pl-4">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">AI Fallback Speed</div>
            <div className="text-amber-400">
              15 - 40 sec / log
            </div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <span className="text-xs font-mono text-zinc-300">
            Active Promoted Parser Rules ({rules.length})
          </span>
          <span className="text-xs text-zinc-500 font-mono">99.98% Total Log Pipeline Throughput</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[11px]">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Source Regex Pattern</th>
                <th className="py-3 px-4">Target OCSF Class</th>
                <th className="py-3 px-4">Source Origin</th>
                <th className="py-3 px-4 text-right">Processed Count</th>
                <th className="py-3 px-4 text-right">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 text-white">{rule.rule_name}</td>
                  <td className="py-3 px-4 text-cyan-300 font-mono max-w-xs truncate" title={rule.source_pattern}>
                    <code className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{rule.source_pattern}</code>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-mono">{rule.ocsf_class}</td>
                  <td className="py-3 px-4">
                    {rule.created_from_ai ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                        Promoted from AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                        Hand-Written
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-200">
                    {rule.match_count.toLocaleString()} logs
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    {rule.avg_latency_ms} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
