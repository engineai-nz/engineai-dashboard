'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

const STAGES = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'plan', label: 'Plan' },
  { id: 'solution', label: 'Solution' },
  { id: 'build', label: 'Build' },
  { id: 'deploy', label: 'Deploy' },
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
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = STAGES.length > 1 ? (activeIndex / (STAGES.length - 1)) * 100 : 100;

  return (
    <div className="w-full py-8 px-4 overflow-x-auto scrollbar-hide">
      <div className="min-w-[600px] relative h-20">
        <svg className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 overflow-visible">
          <line x1="0" y1="0" x2="100%" y2="0" className="stroke-primary/10" strokeWidth="1" />
          <motion.line 
            x1="0" y1="0" x2={`${progressPercent}%`} y2="0" 
            className="stroke-primary" 
            strokeWidth="1"
            initial={{ x2: 0 }}
            animate={{ x2: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </svg>

        <div className="flex justify-between relative z-10 h-full">
          {STAGES.map((stage, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            const isLocked = (lockedStages || []).includes(stage.id);

            return (
              <div key={stage.id} className="flex flex-col items-center justify-center gap-3">
                <button 
                  onClick={() => onToggleLock?.(stage.id)}
                  aria-label={isLocked ? `Unlock ${stage.label}` : `Lock ${stage.label} for manual intervention`}
                  className="relative group transition-transform hover:scale-110 active:scale-95 outline-none"
                >
                  <motion.div
                    className={`w-3 h-3 rounded-full border transition-all ${
                      isLocked 
                        ? 'bg-[#E0E0E0] border-[#E0E0E0] shadow-[0_0_15px_rgba(224,224,224,0.5)]'
                        : isActive 
                        ? 'bg-primary border-primary shadow-[0_0_15px_#C4A35A]' 
                        : isCompleted 
                        ? 'bg-primary/40 border-primary/40' 
                        : 'bg-background border-primary/20'
                    }`}
                    animate={isActive && !isLocked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={isActive && !isLocked ? { repeat: Infinity, duration: 2 } : {}}
                  />
                  
                  <AnimatePresence>
                    {isLocked && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5, y: 10 }}
                        animate={{ opacity: [1, 0.6, 1], scale: [1, 1.2, 1], y: 0 }}
                        transition={{ 
                          opacity: { repeat: Infinity, duration: 2 },
                          scale: { repeat: Infinity, duration: 2 },
                          y: { duration: 0.3 }
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500"
                      >
                        <Lock size={12} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute -inset-2 border border-primary/0 group-hover:border-primary/20 rounded-full transition-colors" />
                </button>

                <div className="text-center min-h-[30px]">
                  <p className={`text-[10px] font-mono uppercase tracking-[0.1em] transition-colors ${
                    isLocked ? 'text-amber-500 font-bold' : isActive ? 'text-primary font-bold' : isCompleted ? 'text-primary/60' : 'text-muted-foreground/40'
                  }`}>
                    {stage.label}
                  </p>
                  {isLocked ? (
                    <p className="text-[8px] font-mono text-amber-500/60 uppercase mt-0.5 tracking-tighter">Manual Intervention Required</p>
                  ) : isActive && (
                    <p className="text-[8px] font-mono text-primary/40 uppercase mt-0.5 animate-pulse font-bold tracking-tighter">Initialising...</p>
                  )}
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
