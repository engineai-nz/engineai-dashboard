'use client'

import React, { useState } from 'react';
import { MessageSquare, LifeBuoy, Info, HelpCircle } from 'lucide-react';

interface Inquiry {
  id: string;
  client: string;
  subject: string;
  status: 'pending' | 'resolving' | 'closed';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
}

const MOCK_INQUIRIES: Inquiry[] = [
  { id: 'q1', client: 'Jackson Construction', subject: 'AST Sync Verification', status: 'pending', priority: 'high', timestamp: '2026-04-05 14:22' },
  { id: 'q2', client: 'Stellar Logistics', subject: 'Database RLS Boundary clarification', status: 'resolving', priority: 'medium', timestamp: '2026-04-05 13:10' },
];

const ServicesDesk: React.FC = () => {
  const [inquiries] = useState(MOCK_INQUIRIES);

  const handleInitialise = (id: string) => {
    alert(`SYSTEM: Initialising resolution sequence for Enquiry ${id}...`);
  };

  const priorityTone = (p: Inquiry['priority']) =>
    p === 'high'
      ? 'border-signal-error/30 bg-signal-error/[0.06] text-signal-error'
      : p === 'medium'
        ? 'border-amber-400/30 bg-amber-400/[0.06] text-amber-300'
        : 'border-white/[0.08] bg-white/[0.02] text-[#888]';

  const statusDot = (s: Inquiry['status']) =>
    s === 'pending'
      ? 'animate-pulse-signal bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.65)]'
      : s === 'resolving'
        ? 'animate-pulse-signal bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.7)]'
        : 'bg-white/30';

  return (
    <div className="flex h-full min-h-[600px] flex-1 flex-col gap-8">
      {/* Active Inquiries */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-8 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LifeBuoy size={18} className="text-gold" />
            <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">
              Active Inquiries
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal-live/30 bg-signal-live/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-signal-live">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse-signal rounded-full bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.7)]"
            />
            Support Pulse
          </span>
        </div>

        <h3 className="mb-6 text-2xl font-medium tracking-[-0.03em] text-white">
          Current queue
        </h3>

        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[1.2rem] border border-dashed border-white/[0.07] bg-black/20 py-12">
              <HelpCircle size={22} className="text-white/25" />
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/30">
                No active inquiries
              </p>
            </div>
          ) : (
            inquiries.map((q) => (
              <div
                key={q.id}
                className="group cursor-pointer rounded-[1.2rem] border border-white/[0.07] bg-black/20 p-5 transition-all duration-300 hover:border-teal/25 hover:bg-teal/[0.03]"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${statusDot(q.status)}`} />
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#888]">
                      {q.client}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${priorityTone(q.priority)}`}>
                    {q.priority} priority
                  </span>
                </div>
                <h4 className="text-[1.05rem] font-medium tracking-[-0.02em] text-white">
                  {q.subject}
                </h4>
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">
                    {q.timestamp} UTC
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInitialise(q.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold hover:text-black"
                  >
                    Initialise Response &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Workflow Interrogation — empty-state prompt */}
      <section className="relative flex h-[280px] flex-col overflow-hidden rounded-[1.75rem] border border-dashed border-white/[0.08] bg-[rgba(12,12,12,0.5)] p-8">
        <div className="mb-6 flex items-center gap-3">
          <Info size={18} className="text-gold/70" />
          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">
            Workflow Interrogation
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <MessageSquare size={28} className="text-white/25" />
          <p className="max-w-sm font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
            Use the command strip to query active pipelines
          </p>
          <p className="max-w-md text-sm italic text-white/30">
            e.g. &ldquo;Interrogate Jackson Construction AST Sync&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
};

export default ServicesDesk;
