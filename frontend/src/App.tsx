import { useState,useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RawLogItem, RegistryRule } from './types/log';
import { INITIAL_QUARANTINE_LOGS, INITIAL_REGISTRY_RULES } from './api/mockData';
import { Header } from './components/common/Header';
import type { ActiveTab } from './components/common/Header';
import { QuarantineTable } from './components/quarantine/QuarantineTable';
import { LogReviewSplitPane } from './components/review/LogReviewSplitPane';
import { TamperProofPanel } from './components/tamper/TamperProofPanel';
import { ParserRegistryView } from './components/registry/ParserRegistryView';
import { promoteToRegistryApi, approveLogApi ,fetchQuarantineLogsApi} from './api/client';

import { LoadingSplash } from './components/common/LoadingSplash';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quarantine');
  const [logs, setLogs] = useState<RawLogItem[]>(INITIAL_QUARANTINE_LOGS);
  const [rules, setRules] = useState<RegistryRule[]>(INITIAL_REGISTRY_RULES);
  const [selectedLog, setSelectedLog] = useState<RawLogItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  const loadLogs = async () => {
    const data = await fetchQuarantineLogsApi();
    setLogs(data);
  };

  // Load real logs from the database when the app starts
  useEffect(() => {
    loadLogs();
  }, []);
  // ----------------------
  // Unprocessed and Needs Review counts for badge counters
  const unprocessedCount = logs.filter((l) => l.status === 'unprocessed').length;
  const needsReviewCount = logs.filter((l) => l.status === 'needs_review').length;

  const handleSelectLogForReview = (log: RawLogItem) => {
    setSelectedLog(log);
    setActiveTab('review');
  };

  const handleApproveAndSave = async (
    updatedLog: RawLogItem,
    shouldPromote: boolean,
    rulePattern: string
  ) => {
    // 1. Update log in backend
    const savedLog = await approveLogApi(updatedLog.id, updatedLog.ocsf_event) || updatedLog;

    // 2. Update log in queue list
    setLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? { ...savedLog, status: 'approved' } : l)));

    let notifyMsg = `Log ${updatedLog.id} approved and saved as normalized OCSF record.`;

    // 3. Promote to registry if requested
    if (shouldPromote) {
      const newRule = await promoteToRegistryApi({
        logId: updatedLog.id,
        pattern: rulePattern,
        ruleName: `Rule for ${updatedLog.source}`,
        ocsfClass: `Class ${updatedLog.ocsf_event?.class_uid || 3002}`,
      });
      setRules((prev) => [newRule, ...prev]);
      notifyMsg += ` Promoted new rule '${newRule.rule_name}' to deterministic registry!`;
    }

    setNotification(notifyMsg);
    setTimeout(() => setNotification(null), 5000);

    // Return to quarantine queue
    setSelectedLog(null);
    setActiveTab('quarantine');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Cryptographic Boot Splash Screen */}
      <LoadingSplash />
      {/* Fixed SIEM Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unprocessedCount={unprocessedCount}
        needsReviewCount={needsReviewCount}
      />

      {/* Global Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-emerald-950/95 border border-emerald-800/80 text-emerald-200 px-4 py-3 rounded-lg shadow-2xl text-xs backdrop-blur max-w-sm sm:max-w-md mx-auto sm:mx-0"
          >
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'quarantine' && (
              <QuarantineTable logs={logs} onSelectLogForReview={handleSelectLogForReview} onRefresh={loadLogs} />
            )}

            {activeTab === 'review' && (
              <LogReviewSplitPane
                log={selectedLog || logs[0]}
                onBack={() => setActiveTab('quarantine')}
                onApproveAndSave={handleApproveAndSave}
              />
            )}

            {activeTab === 'tamper' && <TamperProofPanel />}

            {activeTab === 'registry' && <ParserRegistryView rules={rules} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-600 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <span className="inline-flex items-baseline">
            <span className="text-zinc-400">Log</span>
            <span className="text-cyan-400 inline-block relative top-[1.5px]">सेतु</span>
            <span className="ml-1 text-zinc-500">— Universal Log Normalization Engine</span>
          </span>
          <span className="hidden sm:inline text-zinc-800">|</span>
          <span className="text-zinc-500">Air-Gapped OCSF Platform</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
