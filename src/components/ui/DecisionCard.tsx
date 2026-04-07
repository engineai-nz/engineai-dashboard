import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface DecisionCardProps {
  rationale: string;
  agentRole: string;
  taskTitle: string;
  onClick: () => void;
}

/**
 * Highlighted 'Strategic Rationale' card — the most prominent card
 * on the cockpit home, so it gets the full liquid-glass-gold
 * marketing quote-block treatment.
 *
 * Brand recipe (from engineai.co.nz blockquote sections):
 * - rounded-[1.8rem] border-gold/15
 * - 180deg gold linear-gradient background
 * - Light-weight headline, gold mono label, tight tracking
 */
const DecisionCard: React.FC<DecisionCardProps> = ({ rationale, agentRole, taskTitle, onClick }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-[1.8rem] border border-gold/20 bg-[linear-gradient(180deg,rgba(196,163,90,0.10),rgba(12,12,12,0.88))] p-7 text-left shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition duration-500 hover:border-gold/40 md:p-9"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Sparkles size={14} className="text-gold" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-gold">
            {agentRole || 'Executive'} Rationale
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/25 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#888] transition-colors group-hover:border-teal/30 group-hover:text-teal">
          Drill-down
          <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>

      <h3 className="max-w-3xl text-xl font-light leading-[1.4] tracking-[-0.02em] text-white md:text-[1.45rem] md:leading-[1.45]">
        &ldquo;{rationale || 'Analysing strategic variables...'}&rdquo;
      </h3>

      <div className="mt-7 h-px w-full bg-gradient-to-r from-gold/40 via-white/[0.08] to-transparent transition duration-500 group-hover:from-gold/70" />

      <p className="mt-5 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
        Context &middot; {taskTitle}
      </p>
    </motion.button>
  );
};

export default DecisionCard;
