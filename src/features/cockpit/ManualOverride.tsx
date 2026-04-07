'use client'

import React, { useState, useEffect } from 'react';
import { Power, Pause, Play, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualOverrideProps {
  onOverride: (state: 'active' | 'paused' | 'terminated') => void;
  systemStatus: 'active' | 'paused' | 'terminated';
}

const ManualOverride: React.FC<ManualOverrideProps> = ({ onOverride, systemStatus }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const isPaused = systemStatus === 'paused';
  const isTerminated = systemStatus === 'terminated';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirm(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleTerminate = () => {
    setShowConfirm(false);
    onOverride('terminated');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isTerminated}
        onClick={() => onOverride(isPaused ? 'active' : 'paused')}
        aria-label={isPaused ? 'Resume orchestration' : 'Pause orchestration'}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
          isPaused
            ? 'animate-pulse border-amber-400/60 bg-amber-400/15 text-amber-300'
            : 'border-white/[0.08] bg-white/[0.02] text-[#cec9c1] hover:border-teal/30 hover:bg-teal/[0.04] hover:text-teal disabled:opacity-30 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.02]'
        }`}
      >
        {isPaused ? <Play size={14} /> : <Pause size={14} />}
      </button>

      <button
        disabled={isTerminated}
        onClick={() => setShowConfirm(true)}
        aria-label="Terminate all sequences"
        className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-[#cec9c1] transition-all duration-300 hover:border-signal-error/40 hover:bg-signal-error/[0.08] hover:text-signal-error disabled:opacity-30"
      >
        <Power size={14} className="transition-transform group-hover:scale-110" />
      </button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-signal-error/30 bg-[rgba(12,12,12,0.92)] p-10 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            >
              {/* Red top accent bar — mirrors the gold pattern for danger surfaces */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-signal-error" />

              <div className="relative z-10 text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-signal-error/40 bg-signal-error/10">
                  <AlertCircle size={26} className="text-signal-error" />
                </div>

                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-signal-error">
                  Termination Sequence
                </p>
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-white">
                  Confirm absolute shutdown.
                </h2>
                <p className="mx-auto mt-4 max-w-sm text-[0.92rem] leading-7 text-[#E8E6E1]/70">
                  This will halt every active agent loop and is irreversible. The action will be logged to the Executive Ledger.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={handleTerminate}
                    className="inline-flex w-full items-center justify-center rounded-full border border-signal-error/50 bg-signal-error px-6 py-3 text-sm font-semibold tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Confirm Termination
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#cec9c1] transition duration-300 hover:border-teal/30 hover:text-teal"
                  >
                    Abort Override
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManualOverride;
