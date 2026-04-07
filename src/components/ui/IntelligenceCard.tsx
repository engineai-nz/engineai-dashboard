'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { IntelligenceItem } from '@/lib/hub-data';
import { FileText, ExternalLink, Award } from 'lucide-react';

interface IntelligenceCardProps {
  item: IntelligenceItem;
}

const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ item }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative h-full overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition duration-500 hover:-translate-y-1 hover:border-gold/25"
    >
      {/* Gold accent bar — marketing card pattern */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

      <header className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">
          {item.category || 'general'}
        </span>
        <div className="flex items-center gap-1.5">
          <Award size={11} className="text-gold/80" />
          <span className="font-mono text-[11px] font-light text-gold tracking-[0.04em]">
            {((item.confidence || 0) * 100).toFixed(0)}%
          </span>
        </div>
      </header>

      <h3 className="mt-8 text-2xl font-medium leading-[1.18] tracking-[-0.03em] text-white line-clamp-2">
        {item.title || 'Untitled Intel'}
      </h3>

      <p className="mt-4 text-[0.95rem] leading-7 text-[#E8E6E1]/80 line-clamp-3">
        {item.summary || 'Initialising summary...'}
      </p>

      {/* Gold gradient divider — marketing card pattern */}
      <div className="mt-6 h-px w-full bg-gradient-to-r from-gold/35 via-white/[0.08] to-transparent transition duration-500 group-hover:from-gold/70" />

      <div className="mt-5 flex flex-wrap gap-2">
        {(item.tags || []).slice(0, 4).map(tag => (
          <span
            key={tag}
            className="rounded-full border border-white/[0.06] bg-black/25 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#888]"
          >
            {tag}
          </span>
        ))}
      </div>

      <footer className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-5">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-white/30" />
          <span className="max-w-[140px] truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[#888]">
            {item.source || 'Internal'}
          </span>
        </div>
        <button
          aria-label={`View full report for ${item.title}`}
          className="rounded-full border border-white/[0.06] bg-white/[0.02] p-2 text-white/40 transition-colors hover:border-gold/30 hover:text-gold"
        >
          <ExternalLink size={13} />
        </button>
      </footer>
    </motion.div>
  );
};

export default IntelligenceCard;
