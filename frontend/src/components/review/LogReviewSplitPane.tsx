import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { RawLogItem, OCSFEvent, ParseLogResponse } from '../../types/log';
import { parseLogApi } from '../../api/client';
import { StatusBadge, SeverityBadge } from '../common/Badge';

interface LogReviewSplitPaneProps {
  log: RawLogItem | null;
  onBack: () => void;
  onApproveAndSave: (updatedLog: RawLogItem, promoteToRegistry: boolean, rulePattern: string) => void;
}

type UiState = 'idle' | 'loading' | 'parsed' | 'quarantined' | 'network_error';

export const LogReviewSplitPane: React.FC<LogReviewSplitPaneProps> = ({
  log,
  onBack,
  onApproveAndSave,
}) => {
  const [uiState, setUiState] = useState<UiState>(() => {
    if (log?.status === 'ai_resolved' && log.ocsf_event) return 'parsed';
    if (log?.status === 'needs_review') return 'quarantined';
    return 'idle';
  });
  const [jsonContent, setJsonContent] = useState<string>(() => {
    if (log?.ocsf_event) {
      return JSON.stringify(log.ocsf_event, null, 2);
    }
    return '';
  });
  const [attempts, setAttempts] = useState<number>(log?.attempts || 0);
  const [errorMessage, setErrorMessage] = useState<string>(log?.error || '');
  const [promoteChecked, setPromoteChecked] = useState<boolean>(true);
  const [rulePattern, setRulePattern] = useState<string>(
    log?.source && log.source !== 'Unknown' ? `${log.source}.*` : 'sshd\\[\\d+\\]: .*'
  );
  const [loadingSeconds, setLoadingSeconds] = useState<number>(0);

  // Timer for loading state
  useEffect(() => {
    let interval: any;
    if (uiState === 'loading') {
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [uiState]);

  if (!log) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
        <p className="text-zinc-400 font-mono">No log selected for review. Please select a log from the Quarantine Queue.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-zinc-800 text-white text-xs font-mono rounded border border-zinc-700 cursor-pointer">
          Back to Quarantine Queue
        </button>
      </div>
    );
  }

  // Generate AI Mapping trigger
  const handleGenerateAiMapping = async () => {
    setUiState('loading');
    setErrorMessage('');
    try {
      const response: ParseLogResponse = await parseLogApi(log.raw_log);
      setAttempts(response.attempts);

      if (response.status === 'parsed' && response.ocsf_event) {
        setJsonContent(JSON.stringify(response.ocsf_event, null, 2));
        setUiState('parsed');
      } else if (response.status === 'quarantined') {
        setErrorMessage(response.error || 'Schema validation failed after 3 retries.');
        // Provide editable default OCSF template
        const fallbackTemplate: OCSFEvent = {
          class_uid: 3002,
          category_uid: 3,
          severity_id: 3,
          time: new Date().toISOString(),
          metadata: {
            uid: `evt-manual-${Date.now()}`,
            original_format: 'manual_authoring'
          },
          unmapped: {
            raw_log_source: log.source,
            raw: log.raw_log
          }
        };
        setJsonContent(JSON.stringify(fallbackTemplate, null, 2));
        setUiState('quarantined');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error: Failed to connect to OmniLog AI backend service at /api/parse_log');
      setUiState('network_error');
    }
  };

  // Handle Save
  const handleSave = () => {
    try {
      const parsedOcsf: OCSFEvent = JSON.parse(jsonContent);
      const updatedLog: RawLogItem = {
        ...log,
        status: 'approved',
        attempts: attempts,
        ocsf_event: parsedOcsf,
      };
      onApproveAndSave(updatedLog, promoteChecked, rulePattern);
    } catch (e: any) {
      alert(`Invalid JSON: ${e.message}. Please fix syntax before approving.`);
    }
  };

  // Extract severity for badge if valid JSON
  const currentSeverity = (() => {
    try {
      const obj = JSON.parse(jsonContent);
      return typeof obj.severity_id === 'number' ? obj.severity_id : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-xs transition-all cursor-pointer"
            title="Back to queue"
          >
            ← Back
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs font-mono">Log ID: {log.id}</span>
              <StatusBadge status={log.status} />
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Ingested: <span className="text-zinc-200">{log.timestamp}</span> | Source: <span className="text-cyan-400">{log.source}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {uiState !== 'idle' && uiState !== 'loading' && (
            <button
              onClick={handleGenerateAiMapping}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-mono rounded border border-zinc-700 transition-all cursor-pointer"
            >
              Re-run Local AI
            </button>
          )}
        </div>
      </div>

      {/* Main Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[580px]">
        {/* Left Pane: Read-only Raw Log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden shadow-xl">
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-300">
              Raw Log Text (Forensic Read-Only)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded border border-zinc-800">
              Whitespace Preserved
            </span>
          </div>
          <div className="p-4 flex-1 bg-[#09090b] font-mono text-xs text-emerald-400/90 whitespace-pre-wrap break-all overflow-y-auto leading-relaxed selection:bg-zinc-700">
            {log.raw_log}
          </div>
          <div className="bg-zinc-950 px-4 py-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex justify-between">
            <span>Encoding: UTF-8</span>
            <span>Length: {log.raw_log.length} chars</span>
          </div>
        </div>

        {/* Right Pane: AI Output & OCSF Editor */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden shadow-xl">
          {/* Header Strip */}
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono text-white">
              Normalized OCSF Event (JSON)
            </span>

            {uiState === 'parsed' && (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded border border-cyan-800/80">
                  AI-Inferred ({attempts} {attempts === 1 ? 'attempt' : 'attempts'})
                </span>
                <SeverityBadge severityId={currentSeverity} />
              </div>
            )}

            {uiState === 'quarantined' && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950 text-rose-300 rounded border border-rose-800/80">
                Failed {attempts} attempts · Manual Fallback
              </span>
            )}
          </div>

          {/* Pane Body based on UI State */}
          <div className="flex-1 flex flex-col justify-center bg-[#0d0d11] relative">
            {/* 1. IDLE STATE */}
            {uiState === 'idle' && (
              <div className="p-8 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 mx-auto rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 font-mono text-xs">
                  AI
                </div>
                <div>
                  <h3 className="text-sm text-white">Generate AI OCSF Mapping</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal">
                    Send raw log to the local on-device LLM to infer OCSF taxonomy, severity, and extract unstructured metadata.
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiMapping}
                  className="w-full py-2.5 px-4 bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs rounded border border-cyan-600 shadow transition-all cursor-pointer"
                >
                  Generate AI Mapping
                </button>
              </div>
            )}

            {/* 2. LOADING STATE */}
            {uiState === 'loading' && (
              <div className="p-8 text-center max-w-md mx-auto space-y-6">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-cyan-400">
                    {loadingSeconds}s
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-white">
                    Analyzing log with local AI model
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Executing strict schema-constrained inference on-device. This can take up to a minute on CPU hardware. UI remains responsive.
                  </p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-cyan-400 h-full w-3/4"></div>
                </div>
              </div>
            )}

            {/* 3. PARSED & 4. QUARANTINED (SHOW MONACO EDITOR) */}
            {(uiState === 'parsed' || uiState === 'quarantined') && (
              <div className="flex-1 flex flex-col h-full">
                {/* Error Banner if Quarantined */}
                {uiState === 'quarantined' && (
                  <div className="bg-rose-950/60 border-b border-rose-800 p-3 text-xs font-mono text-rose-200">
                    <span className="text-rose-300">Last attempt failed (3 retries): </span>
                    {errorMessage}
                  </div>
                )}

                {/* Monaco JSON Editor */}
                <div className="flex-1 min-h-[420px] bg-[#09090b]">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={jsonContent}
                    onChange={(val) => setJsonContent(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      tabSize: 2,
                      automaticLayout: true,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
              </div>
            )}

            {/* 5. NETWORK / SERVER ERROR STATE */}
            {uiState === 'network_error' && (
              <div className="p-8 text-center max-w-md mx-auto space-y-4">
                <div>
                  <h3 className="text-sm text-rose-300">Backend Connection Error</h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">{errorMessage}</p>
                </div>
                <button
                  onClick={handleGenerateAiMapping}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded border border-zinc-700 cursor-pointer"
                >
                  Retry API Call
                </button>
              </div>
            )}
          </div>

          {/* Bottom Action & Promotion Bar */}
          {(uiState === 'parsed' || uiState === 'quarantined') && (
            <div className="bg-zinc-950 p-4 border-t border-zinc-800 space-y-3">
              {/* Promotion Checkbox Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteChecked}
                    onChange={(e) => setPromoteChecked(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs text-white">
                      Promote to Registry as Permanent Rule
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Future matching logs skip AI entirely & parse instantly in 0.1ms.
                    </p>
                  </div>
                </label>

                {promoteChecked && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:space-x-2 w-full sm:w-auto">
                    <span className="text-[11px] font-mono text-zinc-400">Regex Pattern:</span>
                    <input
                      type="text"
                      value={rulePattern}
                      onChange={(e) => setRulePattern(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none w-full sm:w-48"
                      placeholder="sshd\\[\\d+\\]: .*"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono rounded border border-zinc-800 transition-all cursor-pointer text-center"
                >
                  Discard
                </button>

                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs rounded border border-emerald-600 shadow transition-all cursor-pointer text-center"
                >
                  Approve & Save Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
