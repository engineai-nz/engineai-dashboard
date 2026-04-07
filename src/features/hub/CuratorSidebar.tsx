'use client'

import React from 'react';
import { Plus, Inbox } from 'lucide-react';
import { IntelCategory } from '@/lib/hub-data';

interface CuratorSidebarProps {
  activeCategory: IntelCategory | 'all';
  onCategoryChange: (cat: IntelCategory | 'all') => void;
}

const CATEGORIES: (IntelCategory | 'all')[] = ['all', 'technical', 'market', 'industry', 'modular'];

const CuratorSidebar: React.FC<CuratorSidebarProps> = ({ activeCategory, onCategoryChange }) => {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/[0.05] py-12 pl-6 pr-8 lg:block">
      <div className="space-y-12">
        {/* Ingestion CTA — gold liquid-glass pill */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#888]">
              Ingestion
            </span>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <button
            aria-label="Add new industrial intel"
            className="liquid-glass liquid-glass-gold group w-full rounded-full px-5 py-3 transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="relative z-[1] flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                New Industrial Intel
              </span>
              <Plus size={13} className="text-gold transition-transform group-hover:rotate-90" />
            </span>
          </button>
        </section>

        {/* Category filters — pill nav, marketing pattern */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#888]">
              Knowledge Base
            </span>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`group flex w-full items-center gap-3 rounded-full border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    isActive
                      ? 'border-gold/30 bg-gold/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(196,163,90,0.10)]'
                      : 'border-white/[0.06] bg-black/20 text-[#cec9c1] hover:border-gold/15 hover:text-white'
                  }`}
                >
                  <Inbox size={12} className={isActive ? 'text-gold' : 'text-white/30 group-hover:text-gold/70'} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* System pulse — small liquid-glass card */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#888]">
              System Pulse
            </span>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="liquid-glass relative space-y-4 rounded-[1.4rem] px-5 py-5">
            <div className="relative z-[1]">
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#888]">Vector Store</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_rgba(196,163,90,0.7)]" />
                Initialised
              </p>
            </div>
            <div className="relative z-[1]">
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#888]">RAG Context</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-white/60" />
                Active
              </p>
            </div>
          </div>
        </section>

        <p className="font-mono text-[9px] uppercase tracking-[0.26em] italic text-white/20">
          Optimising knowledge density...
        </p>
      </div>
    </aside>
  );
};

export default CuratorSidebar;
