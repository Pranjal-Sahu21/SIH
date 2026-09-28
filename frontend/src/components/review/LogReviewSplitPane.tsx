import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { RawLogItem, OCSFEvent, ParseLogResponse } from '../../types/log';
import { parseLogApi } from '../../api/client';
import { StatusBadge, SeverityBadge } from '../common/Badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  ArrowLeft,
  Save,
  Clock,
  AlertTriangle
} from 'lucide-react';

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
  if (!log) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-400 font-mono">No log selected for review. Please select a log from the Quarantine Queue.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Back to Quarantine Queue
        </Button>
      </Card>
    );
  }

  // Determine initial UI state based on log status
  const getInitialState = (): UiState => {
    if (log.status === 'ai_resolved' && log.ocsf_event) return 'parsed';
    if (log.status === 'needs_review') return 'quarantined';
    return 'idle';
  };

  const [uiState, setUiState] = useState<UiState>(getInitialState());
  const [jsonContent, setJsonContent] = useState<string>(() => {
    if (log.ocsf_event) {
      return JSON.stringify(log.ocsf_event, null, 2);
    }
    return '';
  });
  const [attempts, setAttempts] = useState<number>(log.attempts || 0);
  const [errorMessage, setErrorMessage] = useState<string>(log.error || '');
  const [promoteChecked, setPromoteChecked] = useState<boolean>(true);
  const [rulePattern, setRulePattern] = useState<string>(
    log.source !== 'Unknown' ? `${log.source}.*` : 'sshd\\[\\d+\\]: .*'
  );
  const [loadingSeconds, setLoadingSeconds] = useState<number>(0);

  // Timer for loading state
  useEffect(() => {
    let interval: any;
    if (uiState === 'loading') {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [uiState]);

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
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm sm:text-base text-zinc-100">
                Log ID: <span className="text-cyan-400 font-mono">{log.id}</span>
              </span>
              <StatusBadge status={log.status} />
            </div>

            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-2">
              <span>Ingested: <span className="text-zinc-300">{log.timestamp}</span></span>
              <span className="text-zinc-600">·</span>
              <span>Source: <span className="text-cyan-400">{log.source}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto justify-end">
          {uiState !== 'idle' && uiState !== 'loading' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAiMapping}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Re-run Local AI
            </Button>
          )}
        </div>
      </Card>

      {/* Main Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[580px]">
        {/* Left Pane: Read-only Raw Log */}
        <Card className="flex flex-col overflow-hidden">
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-300">
              Raw Log Text (Forensic Read-Only)
            </span>
            <Badge variant="secondary" className="whitespace-nowrap">Whitespace Preserved</Badge>
          </div>
          <div className="p-4 flex-1 bg-[#09090b] font-mono text-xs text-emerald-400/90 whitespace-pre-wrap break-all overflow-y-auto border-t-0 leading-relaxed selection:bg-zinc-700">
            {log.raw_log}
          </div>
          <div className="bg-zinc-950 px-4 py-2 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
            <span>Encoding: UTF-8</span>
            <span>Length: {log.raw_log.length} chars</span>
          </div>
        </Card>

        {/* Right Pane: AI Output & OCSF Editor */}
        <Card className="flex flex-col overflow-hidden">
          {/* Header Strip with Responsive Badge Flow */}
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <span className="text-xs text-white whitespace-nowrap">
              Normalized OCSF Event (JSON)
            </span>

            {uiState === 'parsed' && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" className="whitespace-nowrap">
                  AI-Inferred ({attempts} {attempts === 1 ? 'attempt' : 'attempts'})
                </Badge>
                <SeverityBadge severityId={currentSeverity} />
              </div>
            )}

            {uiState === 'quarantined' && (
              <Badge variant="destructive" className="whitespace-nowrap">
                Failed {attempts} attempts · Manual Fallback
              </Badge>
            )}
          </div>

          {/* Pane Body based on UI State */}
          <div className="flex-1 flex flex-col justify-center bg-[#0d0d11] relative">
            {/* 1. IDLE STATE */}
            {uiState === 'idle' && (
              <div className="p-8 text-center max-w-md mx-auto space-y-4">
                <div>
                  <h3 className="text-sm text-white">Generate AI OCSF Mapping</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal">
                    Send raw log to the local on-device LLM to infer OCSF taxonomy, severity, and extract unstructured metadata.
                  </p>
                </div>
                <Button
                  variant="cyan"
                  className="w-full py-2.5"
                  onClick={handleGenerateAiMapping}
                >
                  Generate AI Mapping
                </Button>
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
                  <h3 className="text-sm text-white flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" />
                    Analyzing log with local AI model
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Executing strict schema-constrained inference on-device. This can take up to a minute on CPU hardware. UI remains responsive.
                  </p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}

            {/* 3. PARSED & 4. QUARANTINED (SHOW MONACO EDITOR) */}
            {(uiState === 'parsed' || uiState === 'quarantined') && (
              <div className="flex-1 flex flex-col h-full">
                {/* Error Banner if Quarantined */}
                {uiState === 'quarantined' && (
                  <div className="bg-rose-950/60 border-b border-rose-800 p-3 text-xs font-mono text-rose-200 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-rose-300">Last attempt failed (3 retries): </span>
                      {errorMessage}
                    </div>
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
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/70 border border-rose-800 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm text-rose-300">Backend Connection Error</h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">{errorMessage}</p>
                </div>
                <Button variant="secondary" onClick={handleGenerateAiMapping}>
                  Retry API Call
                </Button>
              </div>
            )}
          </div>

          {/* Bottom Action & Promotion Bar */}
          {(uiState === 'parsed' || uiState === 'quarantined') && (
            <div className="bg-zinc-950 p-4 border-t border-zinc-800 space-y-3">
              {/* Promotion Checkbox Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteChecked}
                    onChange={(e) => setPromoteChecked(e.target.checked)}
                    className="mt-1 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
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
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-zinc-400">Regex Pattern:</span>
                    <Input
                      type="text"
                      value={rulePattern}
                      onChange={(e) => setRulePattern(e.target.value)}
                      className="w-48 text-cyan-300"
                      placeholder="sshd\\[\\d+\\]: .*"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <Button variant="secondary" onClick={onBack}>
                  Discard
                </Button>

                <Button variant="default" onClick={handleSave} className="px-5 py-2.5">
                  <Save className="w-4 h-4 mr-2" />
                  Approve & Save Event
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
