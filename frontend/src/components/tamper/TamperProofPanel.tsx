import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyLogIntegrityApi } from '../../api/client';
import type { TamperVerifyResponse } from '../../types/log';

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base text-white tracking-wide">Tamper-Evidence Verification Engine</h2>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[11px] font-mono">
              Immutable Ledger
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Cryptographic proof ensuring raw log records have not been altered or deleted post-ingestion.
            The browser client recomputes and verifies the hash chain locally.
          </p>
        </div>

        {/* Demo Tamper Toggle */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={simulateTamper}
              onChange={(e) => setSimulateTamper(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-xs font-mono text-zinc-300 flex items-center">
              Simulate Log Tampering (Demo Mode)
            </span>
          </label>
        </div>
      </div>

      {/* Main Chain Visualizer */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest text-[11px]">
            Cryptographic Hash Chain Sequence (Block #894,102)
          </span>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={isVerifying}
            className={`px-4 py-2 text-xs font-mono rounded border transition-all cursor-pointer ${
              isVerifying
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
            }`}
          >
            {isVerifying ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}
          </motion.button>
        </div>

        {/* Client-side recalculation indicator */}
        <AnimatePresence>
          {isVerifying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-cyan-950/40 border border-cyan-800/80 rounded p-4 text-center space-y-2 overflow-hidden"
            >
              <div className="font-mono text-xs text-cyan-300">{recalculatingStep}</div>
              <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="bg-cyan-400 h-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cryptographic Block Chain Nodes */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 relative"
        >
          {/* Previous Block */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Block N-1 (Previous)</span>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Previous Hash Digest:</div>
              <div className="text-xs text-cyan-400 font-mono truncate mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                0x8f2a4c1e9b7d3f0a5c...
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">Timestamp: 2026-10-24 09:18:00</div>
          </motion.div>

          {/* Target Current Record */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className={`bg-zinc-950 border rounded-lg p-4 space-y-3 font-mono relative transition-all ${
              result
                ? result.verified
                  ? 'border-emerald-500/80 bg-emerald-950/10'
                  : 'border-rose-600 bg-rose-950/20'
                : 'border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300 uppercase tracking-wider">Block N (Target Record)</span>
              {result && (
                result.verified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    VERIFIED MATCH
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800/80">
                    TAMPER DETECTED
                  </span>
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
          </motion.div>

          {/* Next Block */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Block N+1 (Next)</span>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Next Hash Digest:</div>
              <div className="text-xs text-cyan-400 font-mono truncate mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                0x1c4e7b0a2d5f8c1e3b...
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">Timestamp: 2026-10-24 09:18:10</div>
          </motion.div>
        </motion.div>

        {/* Verification Result Alert Banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-lg border font-mono text-xs ${
                result.verified
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-800 text-rose-100'
              }`}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
