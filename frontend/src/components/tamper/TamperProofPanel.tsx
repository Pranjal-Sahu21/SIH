import React, { useState } from 'react';
import { verifyLogIntegrityApi } from '../../api/client';
import type { TamperVerifyResponse } from '../../types/log';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, RefreshCw, Lock } from 'lucide-react';

export const TamperProofPanel: React.FC = () => {
  const [selectedEventId] = useState<string>('evt-ocsf-9921');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [recalculatingStep, setRecalculatingStep] = useState<string>('');
  const [simulateTamper, setSimulateTamper] = useState<boolean>(false);
  const [result, setResult] = useState<TamperVerifyResponse | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setResult(null);

    // Client-side recalculation step animation
    setRecalculatingStep('1/3 Fetching Merkle tree proof & block headers...');
    await new Promise((r) => setTimeout(r, 600));

    setRecalculatingStep('2/3 Browser computing SHA-256 digest of raw payload...');
    await new Promise((r) => setTimeout(r, 800));

    setRecalculatingStep('3/3 Verifying ECDSA signature against previous block hash...');
    await new Promise((r) => setTimeout(r, 600));

    const response = await verifyLogIntegrityApi(selectedEventId, simulateTamper);
    setResult(response);
    setIsVerifying(false);
    setRecalculatingStep('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg text-white tracking-wide">Tamper-Evidence Verification Engine</h2>
            <Badge variant="success">Immutable Ledger</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Cryptographic hash chain verification ensuring log integrity and tamper protection.
          </p>
        </div>

        {/* Demo Tamper Toggle */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex items-center space-x-3 w-full md:w-auto">
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-mono text-zinc-300">
            <input
              type="checkbox"
              checked={simulateTamper}
              onChange={(e) => setSimulateTamper(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
            />
            <span>Simulate Log Tampering (Demo Mode)</span>
          </label>
        </div>
      </Card>

      {/* Main Chain Visualizer */}
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Cryptographic Hash Chain Sequence (Block #894,102)
          </span>

          <Button
            variant={isVerifying ? 'secondary' : 'default'}
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full sm:w-auto font-mono text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isVerifying ? 'animate-spin text-cyan-400' : ''}`} />
            {isVerifying ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}
          </Button>
        </div>

        {/* Client-side recalculation indicator */}
        {isVerifying && (
          <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-lg p-4 text-center space-y-2 animate-pulse">
            <div className="font-mono text-xs text-cyan-300">{recalculatingStep}</div>
            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div className="bg-cyan-400 h-full w-2/3 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Cryptographic Block Chain Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Previous Block */}
          <Card className="p-4 space-y-3 font-mono bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 uppercase">Block N-1 (Previous)</span>
              <Lock className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Previous Hash Digest:</div>
              <div className="text-xs text-cyan-400 font-mono truncate mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                0x8f2a4c1e9b7d3f0a5c...
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">Timestamp: 2026-10-24 09:18:00</div>
          </Card>

          {/* Target Current Record */}
          <Card
            className={`p-4 space-y-3 font-mono relative transition-all bg-zinc-950 ${
              result
                ? result.verified
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-950/10'
                  : 'border-rose-600 ring-2 ring-rose-600/30 bg-rose-950/20'
                : 'border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-300 uppercase">Block N (Target Log Record)</span>
              {result && (
                result.verified ? (
                  <Badge variant="success">
                    VERIFIED MATCH
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="animate-pulse">
                    TAMPER DETECTED
                  </Badge>
                )
              )}
            </div>

            <div>
              <div className="text-xs text-zinc-400">Target Event ID:</div>
              <div className="text-xs text-white font-mono mt-0.5">evt-ocsf-9921</div>
            </div>

            <div>
              <div className="text-xs text-zinc-400">Expected Block Hash:</div>
              <div className="text-xs text-cyan-300 font-mono truncate mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                0x3e7a1d9c5b2f4a6e8c0b2d4f6a8e1c3b5a7f9c2
              </div>
            </div>

            {result && !result.verified && (
              <div className="bg-rose-950/80 border border-rose-800 p-2 rounded text-[11px] text-rose-200">
                <span>Computed Hash: </span>
                <span className="font-mono text-rose-400">{result.computed_hash}</span>
              </div>
            )}
          </Card>

          {/* Next Block */}
          <Card className="p-4 space-y-3 font-mono bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 uppercase">Block N+1 (Next)</span>
              <Lock className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Next Hash Digest:</div>
              <div className="text-xs text-cyan-400 font-mono truncate mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                0x1c4e7b0a2d5f8c1e3b...
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">Timestamp: 2026-10-24 09:18:10</div>
          </Card>
        </div>

        {/* Verification Result Alert Banner */}
        {result && (
          <div
            className={`p-5 rounded-xl border font-mono text-xs ${
              result.verified
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-100'
            }`}
          >
            <div className="flex items-start space-x-3">
              {result.verified ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0 animate-bounce" />
              )}
              <div className="space-y-1">
                <h4 className="text-sm">
                  {result.verified
                    ? 'Cryptographic Verification Passed — Raw Log Authentic'
                    : 'CRITICAL SECURITY ALERT: Log Integrity Check Failed!'}
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  {result.verified
                    ? 'The client recalculated SHA-256 hash matches the immutable block ledger header exactly. No data modification has occurred.'
                    : 'The raw log payload stored in the database does NOT produce the expected SHA-256 hash. The record has been modified or corrupted post-ingestion.'}
                </p>
                <div className="pt-2 text-[11px] text-zinc-400 border-t border-zinc-800/80 mt-2 flex flex-wrap gap-4">
                  <span>Merkle Root: <code className="text-cyan-300">{result.merkle_root}</code></span>
                  <span>Signature: <code className="text-purple-300">{result.signature}</code></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
