import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CRYPTIC_SYMBOLS_UPPER = '#*&%$@!?~^<>/\\|:;=+-[]{}0189XØΞλΔ§±89#*&%$@!';
const CRYPTIC_SYMBOLS_LOWER = '#*&%$@!?~^<>/\\|:;=+-[]{}0189xøΞλΔ§±89#*&%$@!';
const TARGET_TEXT = 'OmniLog AI';
const NUM_COLUMNS = 5;

// Staircase Columns Variants with Staggered Delays
const columnVariants = {
  initial: { y: '0%' },
  exit: (index: number) => ({
    y: '-100%',
    transition: {
      duration: 0.75,
      ease: [0.76, 0, 0.24, 1] as const,
      delay: index * 0.08, // Staircase staggered delay per column
    },
  }),
};

interface LoadingSplashProps {
  onComplete?: () => void;
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({ onComplete }) => {
  const [displayText, setDisplayText] = useState('OmniLog AI');
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let iteration = 0;
    const maxIterations = 32;

    // 1. Cryptic Symbol Text Scramble Interval
    const scrambleInterval = setInterval(() => {
      setDisplayText(
        TARGET_TEXT.split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < Math.floor((iteration / maxIterations) * TARGET_TEXT.length)) {
              return TARGET_TEXT[index];
            }
            if (char === char.toUpperCase()) {
              return CRYPTIC_SYMBOLS_UPPER[Math.floor(Math.random() * CRYPTIC_SYMBOLS_UPPER.length)];
            }
            return CRYPTIC_SYMBOLS_LOWER[Math.floor(Math.random() * CRYPTIC_SYMBOLS_LOWER.length)];
          })
          .join('')
      );

      iteration += 1;
      if (iteration > maxIterations) {
        setDisplayText(TARGET_TEXT);
        clearInterval(scrambleInterval);
      }
    }, 60);

    // 2. Progress Bar Interval (~3s)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 4) + 2;
        return next > 100 ? 100 : next;
      });
    }, 60);

    // 3. Extended Slide Up Exit Timer (3.2s)
    const exitTimer = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(progressInterval);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  // Split displayText for consistent dual-color rendering
  const brandPart = displayText.length >= 7 ? displayText.slice(0, 7) : displayText;
  const aiPart = displayText.length >= 7 ? displayText.slice(7) : '';

  return (
    <AnimatePresence>
      {!isFinished && (
        <div key="loading-splash-wrapper" className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none font-sans">
          {/* Staircase Slide-Up Background Columns */}
          <div className="absolute inset-0 flex w-full h-full">
            {Array.from({ length: NUM_COLUMNS }).map((_, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={columnVariants}
                initial="initial"
                exit="exit"
                className="h-full flex-1 bg-[#09090b] border-r border-zinc-900/40"
              />
            ))}
          </div>

          {/* Centered Main Content Overlay */}
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 pb-16 sm:pb-24 z-10"
          >
            <div className="max-w-md w-full space-y-8 text-center pointer-events-auto -translate-y-8 sm:-translate-y-12">
              {/* Logo Emblem */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center"
              >
                <img
                  src="/favicon.svg"
                  alt="OmniLog AI Logo"
                  className="w-14 h-14 rounded-2xl shadow-2xl shadow-cyan-950/80 border border-zinc-800 p-1 bg-zinc-950"
                />
              </motion.div>

              {/* Seamless Scrambling Text Header */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl tracking-wider font-sans select-none min-h-[44px]">
                  <span className="text-white">{brandPart}</span>
                  <span className="text-cyan-400">{aiPart}</span>
                </h1>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">
                  Universal Log Pre-processing Framework
                </p>
              </div>

              {/* Clean Minimal Progress Loader Bar */}
              <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800 shadow-2xl">
                <motion.div
                  className="h-full bg-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
