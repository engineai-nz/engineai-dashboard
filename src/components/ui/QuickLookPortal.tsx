'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { Project } from '@/lib/data';

interface QuickLookPortalProps {
  project: Project;
  position: { top: number; left: number };
}

const QuickLookPortal: React.FC<QuickLookPortalProps> = ({ project, position }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, x: -6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97, x: -6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ top: position.top, left: position.left }}
      className="liquid-glass pointer-events-none fixed z-[300] w-72 rounded-[1.4rem] p-6"
    >
      <div className="relative z-[1]">
        <header className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#888]">Project Portal</p>
          <h3 className="mt-1 truncate text-[1.05rem] font-medium tracking-[-0.02em] text-white">
            {project.name}
          </h3>
        </header>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08]">
              <Zap size={12} className="text-gold" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">Current Stage</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white">{project.stage} phase</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <Activity size={12} className="text-teal" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">Build Velocity</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white">
                {Math.floor(Math.random() * (95 - 75) + 75)}% Optimal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-signal-live/30 bg-signal-live/[0.08]">
              <ShieldCheck size={12} className="text-signal-live" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">Tenant Security</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white">RLS Active</p>
            </div>
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">
            Initialising telemetry...
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse-signal rounded-full bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.7)]"
          />
        </footer>
      </div>
    </motion.div>
  );
};

export default QuickLookPortal;
