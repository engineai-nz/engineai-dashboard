'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ControlSlateProps {
  isActive: boolean;
}

const ControlSlate: React.FC<ControlSlateProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden"
    >
      {/* Heavy Grayscale Filter for Background */}
      <div className="absolute inset-0 bg-background/20 backdrop-grayscale backdrop-blur-[2px]" />
      
      {/* High-Contrast Border Glow */}
      <div className="absolute inset-0 border-[24px] border-amber-500/10 shadow-[inset_0_0_100px_rgba(245,158,11,0.1)]" />

      {/* Control Slate Badge */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto"
      >
        <div className="bg-amber-500 text-black px-10 py-3 font-mono font-bold text-xs uppercase tracking-[0.5em] shadow-2xl flex items-center gap-3">
          <Lock size={14} fill="currentColor" />
          Control Slate Active
        </div>
        <div className="bg-black/80 border border-amber-500/40 text-amber-500 px-4 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md">
          Executive Override: Orchestration Paused
        </div>
      </motion.div>

      {/* Decorative Corner Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-amber-500/20" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-amber-500/20" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-amber-500/20" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-amber-500/20" />

      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
    </motion.div>
  );
};

export default ControlSlate;
