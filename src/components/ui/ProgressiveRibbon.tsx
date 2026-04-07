'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

/**
 * 6-Stage Lifecycle for the Progressive Ribbon
 * Discovery -> Analysis -> Plan -> Solutioning -> Implementation -> Handoff
 */
const STAGES = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'plan', label: 'Plan' },
  { id: 'solutioning', label: 'Solutioning' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'handoff', label: 'Handoff' },
];

interface ProgressiveRibbonProps {
  currentStageId: string;
  lockedStages?: string[];
  onToggleLock?: (stageId: string) => void;
}

const ProgressiveRibbon: React.FC<ProgressiveRibbonProps> = ({ 
  currentStageId, 
  lockedStages = [], 
  onToggleLock 
}) => {
  const currentIndex = STAGES.findIndex(s => s.id === currentStageId);
  // Default to first stage if not found
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = STAGES.length > 1 ? (activeIndex / (STAGES.length - 1)) * 100 : 100;

  return (
    <div className="w-full py-8 px-4 overflow-x-auto scrollbar-hide">
      <div className="min-w-[700px] relative h-20">
        {/* SVG Track Background */}
        <svg className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 overflow-visible">
          {/* Base Track */}
          <line 
            x1="0" y1="0" x2="100%" y2="0" 
            className="stroke-white/[0.07]" 
            strokeWidth="1" 
          />
          {/* Progress Indicator */}
          <motion.line 
            x1="0" y1="0" x2={`${progressPercent}%`} y2="0" 
            className="stroke-gold" 
            strokeWidth="1.5"
            initial={{ x2: 0 }}
            animate={{ x2: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: "circOut" }}
          />
          
          {/* Scan-line Effect */}
          <motion.line
            x1="0" y1="0" x2="20" y2="0"
            className="stroke-gold/50"
            strokeWidth="2"
            animate={{ x: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        <div className="flex justify-between relative z-10 h-full items-center">
          {STAGES.map((stage, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            const isLocked = (lockedStages || []).includes(stage.id);

            return (
              <div key={stage.id} className="flex flex-col items-center justify-center gap-3 px-2">
                <button
                  onClick={() => onToggleLock?.(stage.id)}
                  aria-label={isLocked ? `Unlock ${stage.label}` : `Lock ${stage.label} for manual intervention`}
                  className="group relative outline-none transition-opacity hover:opacity-80 active:scale-95"
                >
                  {/* Node — rotated square, brand-tinted by state */}
                  <motion.div
                    className={`h-3.5 w-3.5 rotate-45 rounded-[2px] border transition-all duration-500 ${
                      isLocked
                        ? 'border-signal-error bg-signal-error shadow-[0_0_18px_rgba(239,68,68,0.55)]'
                        : isActive
                          ? 'border-gold bg-gold shadow-[0_0_22px_rgba(196,163,90,0.7)]'
                          : isCompleted
                            ? 'border-gold/50 bg-gold/60'
                            : 'border-white/25 bg-background'
                    }`}
                    animate={isActive && !isLocked ? {
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        '0 0 10px rgba(196,163,90,0.4)',
                        '0 0 28px rgba(196,163,90,0.85)',
                        '0 0 10px rgba(196,163,90,0.4)',
                      ],
                    } : {}}
                    transition={isActive && !isLocked ? {
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'easeInOut',
                    } : {}}
                  />

                  {/* Lock Indicator */}
                  <AnimatePresence>
                    {isLocked && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 text-signal-error"
                      >
                        <Lock size={14} className="animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active Aura */}
                  {isActive && !isLocked && (
                    <motion.div
                      className="absolute inset-0 rotate-45 rounded-[2px] border border-gold/50"
                      animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    />
                  )}

                  <div className="absolute -inset-3 rounded-full border border-transparent transition-colors group-hover:border-teal/20" />
                </button>

                {/* Stage Metadata */}
                <div className="pointer-events-none min-h-[35px] text-center">
                  <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-500 ${
                    isLocked
                      ? 'text-signal-error'
                      : isActive
                        ? 'text-gold'
                        : isCompleted
                          ? 'text-white/80'
                          : 'text-white/25'
                  }`}>
                    {stage.label}
                  </p>

                  <div className="h-4">
                    {isLocked ? (
                      <p className="mt-1 font-mono text-[9px] font-light uppercase tracking-[0.2em] text-signal-error/80">
                        Intervention
                      </p>
                    ) : isActive ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 font-mono text-[9px] font-light uppercase tracking-[0.26em] text-gold/70"
                      >
                        Active Phase
                      </motion.p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressiveRibbon;
