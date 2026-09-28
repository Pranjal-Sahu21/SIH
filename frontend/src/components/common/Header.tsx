import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Cpu, ShieldCheck, GitMerge, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActiveTab = 'quarantine' | 'review' | 'tamper' | 'registry';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unprocessedCount: number;
  needsReviewCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unprocessedCount,
  needsReviewCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'quarantine',
      label: 'Quarantine Queue',
      icon: <FileText className="w-4 h-4 mr-2 text-zinc-400" />,
      badge: unprocessedCount + needsReviewCount > 0 ? unprocessedCount + needsReviewCount : undefined,
    },
    {
      id: 'review',
      label: 'Log Review',
      icon: <Cpu className="w-4 h-4 mr-2 text-cyan-400" />,
    },
    {
      id: 'tamper',
      label: 'Tamper Proof',
      icon: <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" />,
    },
    {
      id: 'registry',
      label: 'Parser Registry',
      icon: <GitMerge className="w-4 h-4 mr-2 text-purple-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveTab('quarantine')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-cyan-400 text-xs tracking-widest font-mono shadow-sm flex-shrink-0">
                OL
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-base sm:text-lg tracking-wide text-white">OmniLog <span className="text-cyan-400">AI</span></span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 hidden md:block tracking-wide">Universal Log Normalization Engine</p>
              </div>
            </motion.div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white sm:hidden cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex space-x-1 sm:space-x-2 relative">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center px-3.5 py-2.5 rounded text-xs sm:text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-[11px] font-mono rounded bg-rose-950 text-rose-300 border border-rose-800">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Slide-In Drawer from Right (Portaled to document.body for clean stacking) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Dark Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] sm:hidden"
              />

              {/* Slide-out Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 h-full w-80 max-w-[85vw] bg-[#09090b] border-l border-zinc-800 z-[101] p-6 flex flex-col justify-between shadow-2xl sm:hidden"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-cyan-400 text-xs font-mono shadow-sm">
                        OL
                      </div>
                      <span className="text-sm font-medium tracking-wide text-white">OmniLog Menu</span>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 cursor-pointer transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded text-sm tracking-wide transition-all cursor-pointer ${
                            isActive
                              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <span className="flex items-center">
                            {tab.icon}
                            {tab.label}
                          </span>
                          {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="px-2 py-0.5 text-xs font-mono rounded bg-rose-950 text-rose-300 border border-rose-800">
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-4 text-xs font-mono text-zinc-500 text-center">
                  OmniLog AI Engine v1.0.0
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};
