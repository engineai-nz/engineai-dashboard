'use client'

import React from 'react';
import ReasoningLog from '@/components/ui/ReasoningLog';
import SocialPreview from '@/components/ui/SocialPreview';
import ReportPreview from '@/components/ui/ReportPreview';
import { X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AuditTask {
  id: string;
  task_title: string;
  sender_role: string;
  recipient_role: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  created_at: string;
  parent?: AuditTask | null;
}

interface AuditDrilldownProps {
  task: AuditTask;
  onClose: () => void;
}

const MAX_AUDIT_DEPTH = 10;

const TaskAncestry: React.FC<{ task: AuditTask; depth: number }> = ({ task, depth }) => {
  if (depth > MAX_AUDIT_DEPTH) {
    return (
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        Max depth exceeded
      </div>
    );
  }
  return (
    <>
      {task.parent && <TaskAncestry task={task.parent} depth={depth + 1} />}
      <div className={`flex items-center gap-3 ${depth > 0 ? 'opacity-40' : ''}`}>
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${
            depth === 0
              ? 'bg-gold shadow-[0_0_10px_rgba(196,163,90,0.6)]'
              : 'border border-white/30'
          }`}
        />
        <p className={`truncate font-mono text-[11px] uppercase tracking-[0.14em] ${
          depth === 0 ? 'text-white' : 'text-white/40'
        }`}>
          {task.task_title}
        </p>
        {depth > 0 && <ChevronRight size={12} className="shrink-0 text-white/20" />}
      </div>
    </>
  );
};

const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
  <div className="mb-4 flex items-center gap-3">
    <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#888]">{children}</span>
    <span className="h-px flex-1 bg-white/[0.07]" />
  </div>
);

const AuditDrilldown: React.FC<AuditDrilldownProps> = ({ task, onClose }) => {
  const isMarketingDraft = task.payload?.task_type === 'MARKETING_DRAFT' || task.task_title?.includes('Creative Draft');
  const isPerformanceReport = task.payload?.task_type === 'PERFORMANCE_REPORT' || task.task_title?.includes('Performance Report');

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-y-0 right-0 z-[200] flex w-full flex-col border-l border-white/[0.07] bg-[rgba(12,12,12,0.94)] backdrop-blur-2xl lg:w-[540px]"
    >
      <header className="relative flex items-start justify-between border-b border-white/[0.07] p-7">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />
        <div className="min-w-0 flex-1 pr-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#888]">
            Audit Sequence Trace
          </p>
          <h2 className="mt-2 truncate text-xl font-medium tracking-[-0.02em] text-white">
            {task.task_title}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close trace"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-[#cec9c1] transition-all duration-300 hover:border-teal/30 hover:bg-teal/[0.04] hover:text-teal"
        >
          <X size={15} />
        </button>
      </header>

      <main className="scrollbar-hide flex-1 space-y-10 overflow-y-auto p-7">
        <section>
          <SectionLabel>Handoff Ancestry</SectionLabel>
          <div className="flex flex-col gap-3 rounded-[1.2rem] border border-white/[0.07] bg-black/25 p-5">
            <TaskAncestry task={task} depth={0} />
          </div>
        </section>

        {isMarketingDraft && (
          <section className="duration-500 animate-in fade-in slide-in-from-bottom-2">
            <SectionLabel>Social Content Preview</SectionLabel>
            <SocialPreview linkedin={task.payload?.linkedin} twitter={task.payload?.twitter} />
          </section>
        )}

        {isPerformanceReport && (
          <section className="duration-500 animate-in fade-in slide-in-from-bottom-2">
            <SectionLabel>Performance Report Preview</SectionLabel>
            <ReportPreview
              summary={task.payload?.summary}
              slides={task.payload?.slides}
              artifactUrl={task.payload?.artifact_url}
            />
          </section>
        )}

        <section>
          <SectionLabel>Reasoning Log</SectionLabel>
          <ReasoningLog payload={task.payload} role={task.recipient_role} />
        </section>

        <div className="border-t border-white/[0.07] pt-5 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/30">
            Authorisation verified via Omni-channel Protocol
          </p>
        </div>
      </main>
    </motion.div>
  );
};

export default AuditDrilldown;
