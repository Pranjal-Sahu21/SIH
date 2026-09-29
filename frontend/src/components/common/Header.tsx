import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Cpu, GitMerge, FileText, Menu, X } from 'lucide-react';

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

  const desktopTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
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

  const mobileTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'quarantine',
      label: 'Quarantine Queue',
      icon: <FileText className="w-6 h-6 mr-4 text-zinc-400" />,
      badge: unprocessedCount + needsReviewCount > 0 ? unprocessedCount + needsReviewCount : undefined,
    },
    {
      id: 'review',
      label: 'Log Review',
      icon: <Cpu className="w-6 h-6 mr-4 text-cyan-400" />,
    },
    {
      id: 'tamper',
      label: 'Tamper Proof',
      icon: <ShieldCheck className="w-6 h-6 mr-4 text-emerald-400" />,
    },
    {
      id: 'registry',
      label: 'Parser Registry',
      icon: <GitMerge className="w-6 h-6 mr-4 text-purple-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          <div className="flex items-center justify-between w-full sm:w-auto">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => setActiveTab('quarantine')}
              >
                <img src="/favicon.svg" alt="Logसेतु Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex-shrink-0" />
                <div className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg tracking-wider text-white inline-flex items-baseline select-none">
                    Log<span className="text-cyan-400 inline-block relative top-[2px]">सेतु</span>
                  </span>
                </div>
              </div>

            {/* Mobile Hamburger Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Desktop Navigation Tabs with Framer Motion Sliding Pill Animation */}
          <nav className="hidden sm:flex space-x-1 sm:space-x-2">
            {desktopTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-zinc-800/90 border border-zinc-700 rounded-lg shadow-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <Badge variant="destructive" className="ml-2 px-1.5 py-0.2">
                        {tab.badge}
                      </Badge>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Full Width Mobile Menu Overlay with Slide-In Animation */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] sm:hidden"
                />

                {/* Full Width Slide-in Drawer Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="fixed inset-0 h-full w-full bg-[#09090b] z-[101] p-6 sm:p-8 flex flex-col justify-between shadow-2xl sm:hidden"
                >
                  <div>
                    {/* Header bar matching exact brand logo size and close X button */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-8">
                      <div
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => {
                          setActiveTab('quarantine');
                          setIsOpen(false);
                        }}
                      >
                        <img src="/favicon.svg" alt="Logसेतु Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex-shrink-0" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-base sm:text-lg tracking-wider text-white inline-flex items-baseline select-none">
                              Log<span className="text-cyan-400 inline-block relative top-[2px]">सेतु</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5 text-white" />
                      </Button>
                    </div>

                    {/* Full Width Large Font Navigation Menu */}
                    <div className="space-y-4">
                      {mobileTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-xl sm:text-2xl transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-lg'
                                : 'bg-zinc-950/60 text-zinc-300 border-zinc-800/80 hover:bg-zinc-900 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center">
                              {tab.icon}
                              {tab.label}
                            </span>
                            {tab.badge !== undefined && tab.badge > 0 && (
                              <Badge variant="destructive" className="text-sm px-3 py-1 font-mono">
                                {tab.badge}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-6 text-sm text-zinc-500 text-center">
                    Logसेतु Engine
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
