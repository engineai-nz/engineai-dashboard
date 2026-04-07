import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface DecisionCardProps {
  rationale: string;
  agentRole: string;
  taskTitle: string;
  onClick: () => void;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ rationale, agentRole, taskTitle, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bg-gold/5 border border-gold/20 p-5 rounded-lg flex gap-4 hover:bg-gold/10 transition-colors group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gold animate-pulse" />
      
      <div className="p-2 bg-gold/10 rounded-full h-fit mt-1">
        <HelpCircle size={16} className="text-gold" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-mono text-gold/60 uppercase tracking-widest">{agentRole} Rationale</p>
          <span className="text-[8px] font-mono text-secondary/40 uppercase">Click to Drill-down</span>
        </div>
        <h3 className="text-lg font-light text-white tracking-tight leading-snug mb-1 line-clamp-3">
          {rationale || 'Analysing strategic variables...'}
        </h3>
        <p className="text-[10px] font-mono text-secondary uppercase truncate">
          Context: {taskTitle}
        </p>
      </div>

      {/* Decorative HUD Corner */}
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/20" />
    </motion.button>
  );
};

export default DecisionCard;
