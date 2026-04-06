'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, FileText, Code, ExternalLink, X } from 'lucide-react';
import { Project } from '@/lib/data';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface QuickLookPortalProps {
  project: Project;
  position: { top: number; left: number };
}

const QuickLookPortal: React.FC<QuickLookPortalProps> = ({ project, position }) => {
  const artifact = project.lastArtifact;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[300] w-80 bg-[rgba(12,12,12,0.84)] backdrop-blur-xl border border-[rgba(196,163,90,0.24)] p-0 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-sm"
    >
      {/* HUD-style corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#C4A35A]/30" />
      
      <header className="p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] font-mono text-[#C4A35A] uppercase tracking-[0.2em] mb-1">Project Oversight</p>
            <h3 className="text-sm font-bold text-[#F2EFE8] uppercase tracking-tight truncate">{project.name}</h3>
          </div>
          <div className={`px-2 py-0.5 rounded-xs border text-[8px] font-mono uppercase ${
            project.status === 'active' ? 'bg-[#C4A35A]/10 border-[#C4A35A]/30 text-[#C4A35A]' : 'bg-white/5 border-white/10 text-muted-foreground'
          }`}>
            {project.status}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Core Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xs">
            <p className="text-[7px] font-mono text-muted-foreground uppercase mb-1">Current Stage</p>
            <div className="flex items-center gap-1.5">
              <Zap size={10} className="text-[#C4A35A]" />
              <p className="text-[9px] font-mono text-[#E8E6E1] uppercase font-bold">{project.stage}</p>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xs">
            <p className="text-[7px] font-mono text-muted-foreground uppercase mb-1">System Health</p>
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-[#C4A35A]" />
              <p className="text-[9px] font-mono text-[#E8E6E1] uppercase font-bold">Optimal</p>
            </div>
          </div>
        </div>

        {/* Artifact Content */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            {artifact?.type === 'code' ? <Code size={12} className="text-[#C4A35A]" /> : <FileText size={12} className="text-[#C4A35A]" />}
            <p className="text-[9px] font-mono text-[#C4A35A]/60 uppercase tracking-widest">
              {artifact ? `Latest Artifact: ${artifact.filename || artifact.type}` : 'No Artifacts Available'}
            </p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xs p-3 max-h-48 overflow-hidden relative">
            {artifact ? (
              <div className="text-[10px] leading-relaxed">
                {artifact.type === 'code' ? (
                  <div className="font-mono text-[9px] overflow-hidden">
                    <SyntaxHighlighter
                      language="sql"
                      style={vscDarkPlus}
                      customStyle={{ 
                        margin: 0, 
                        padding: 0, 
                        background: 'transparent',
                        fontSize: '9px'
                      }}
                    >
                      {artifact.content}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none prose-p:text-[10px] prose-p:leading-normal prose-headings:text-[11px] prose-headings:font-bold prose-headings:mb-1 prose-headings:mt-0">
                    <ReactMarkdown>{artifact.content}</ReactMarkdown>
                  </div>
                )}
                {/* Fade out effect */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            ) : (
              <p className="text-[10px] font-mono text-muted-foreground/40 italic py-4 text-center">Initialising data stream...</p>
            )}
          </div>
        </div>
      </div>

      <footer className="p-4 pt-0 border-t border-white/5 mt-2 flex justify-between items-center bg-white/[0.01]">
        <div className="flex items-center gap-1.5 py-3">
          <ShieldCheck size={10} className="text-[#C4A35A]/40" />
          <span className="text-[8px] font-mono text-[#C4A35A]/30 uppercase tracking-widest">RLS Context: Secure</span>
        </div>
        
        <button className="flex items-center gap-1.5 text-[9px] font-mono text-[#C4A35A] hover:text-[#F2EFE8] transition-colors uppercase tracking-widest group">
          Surgical Portal
          <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </footer>
    </motion.div>
  );
};

export default QuickLookPortal;
