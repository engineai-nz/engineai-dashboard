'use client'

import React, { useState, useEffect, useMemo } from 'react';
import IntelligenceCard from '@/components/ui/IntelligenceCard';
import CuratorSidebar from '@/features/hub/CuratorSidebar';
import IdeaForge from '@/features/hub/IdeaForge';
import { IntelligenceItem, IntelCategory } from '@/lib/hub-data';
import { getIntelligenceRecords } from '@/lib/hub-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

type HubMode = 'research' | 'forge';

export default function IntelligenceHub() {
  const [mode, setMode] = useState<HubMode>('research');
  const [intel, setIntel] = useState<IntelligenceItem[]>([]);
  const [filter, setFilter] = useState<IntelCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamic NZ Time Display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }) + ' NZST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Vault Sync
  useEffect(() => {
    let isMounted = true;
    async function loadIntel() {
      try {
        const data = await getIntelligenceRecords();
        if (isMounted) setIntel(data);
      } catch (err) {
        console.error("HUB: Failed to sync with Master Vault.", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadIntel();
    const interval = setInterval(loadIntel, 15000); // 15s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredIntel = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    return intel.filter(item => {
      const matchesFilter = filter === 'all' || item.category === filter;
      const matchesSearch = (item.title?.toLowerCase() || '').includes(cleanSearch) ||
                           (item.tags || []).some(t => t?.toLowerCase()?.includes(cleanSearch));
      return matchesFilter && matchesSearch;
    });
  }, [intel, filter, search]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-[#E8E6E1]">
      {/* Ambient atmosphere layer — grid + noise + gold blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-grid absolute inset-0 opacity-40" />
        <div className="page-noise absolute inset-0 opacity-20" />
        <div className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-gold/[0.10] blur-[140px]" />
        <div className="absolute right-[-12rem] top-[18rem] h-[26rem] w-[26rem] rounded-full bg-white/[0.04] blur-[160px]" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gold/[0.08] blur-[180px]" />
      </div>

      {/* Top header — fixed, glass on scroll feel via liquid-glass background */}
      <header className="relative z-40 border-b border-white/[0.07] bg-background/78 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10 md:h-24">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="Return to operational cockpit"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cec9c1] transition-all duration-300 hover:border-gold/30 hover:text-white"
            >
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              Cockpit
            </Link>

            <div className="hidden h-8 w-px bg-white/[0.07] md:block" />

            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-gold" />
              <h1 className="font-sans text-[1.05rem] font-semibold uppercase tracking-[0.16em] text-[#E8E6E1] sm:text-[1.2rem]">
                Intelligence Hub
              </h1>
            </div>
          </div>

          {/* Mode toggle — glass pill nav, marketing-site pattern */}
          <div className="hidden md:flex">
            <div className="liquid-glass flex items-center rounded-full px-2 py-1.5">
              <button
                onClick={() => setMode('research')}
                className={`relative z-[1] rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 ${
                  mode === 'research'
                    ? 'bg-gold/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_22px_rgba(196,163,90,0.18)]'
                    : 'text-[#cec9c1] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                Research
              </button>
              <button
                onClick={() => setMode('forge')}
                className={`relative z-[1] flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 ${
                  mode === 'forge'
                    ? 'bg-gold/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_22px_rgba(196,163,90,0.18)]'
                    : 'text-[#cec9c1] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Sparkles size={11} className={mode === 'forge' ? 'text-gold' : ''} />
                Idea Forge
              </button>
            </div>
          </div>

          <div className="hidden items-center gap-5 sm:flex">
            {/* Glass-pill search */}
            <div className="relative group hidden lg:block">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-gold"
                size={13}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vault..."
                aria-label="Search intelligence records"
                className="w-64 rounded-full border border-white/[0.08] bg-white/[0.02] py-2 pl-10 pr-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white placeholder:text-white/30 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
              />
            </div>

            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#888]">NZ Standard Time</p>
              <p className="font-mono text-[11px] uppercase text-[#E8E6E1]">{currentTime || 'Initialising...'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content — sidebar + canvas */}
      <div className="relative z-10 mx-auto flex max-w-7xl">
        <CuratorSidebar activeCategory={filter} onCategoryChange={setFilter} />

        <main className="flex-1 px-6 py-12 lg:px-10 lg:py-16">
          {/* Section label — marketing pattern */}
          <div className="mb-10 flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#888]">
              {mode === 'research' ? 'Master Vault' : 'Module Forge'}
            </span>
            <span className="h-px flex-1 bg-white/[0.07]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#888]">
              {mode === 'research' ? `${filteredIntel.length} records` : 'Concept entry'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'research' ? (
              <motion.div
                key="research"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {/* Headline */}
                <div className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                  <h2 className="max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.04em] text-white md:text-5xl">
                    Curated industrial intelligence,
                    <span className="mt-2 block text-gold">synced from the master vault.</span>
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-[#E8E6E1] md:justify-self-end md:text-[1.02rem]">
                    Filter by category, search by tag, and surface the signal you need to make the next call. Polled every fifteen seconds.
                  </p>
                </div>

                {loading ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <Loader2 size={22} className="animate-spin text-gold" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/40">
                      Initialising vault sync...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                        {filteredIntel.map((item) => (
                          <IntelligenceCard key={item.id} item={item} />
                        ))}
                      </AnimatePresence>
                    </div>

                    {filteredIntel.length === 0 && (
                      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-white/[0.07] bg-[rgba(12,12,12,0.5)]">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/30">
                          No matching intel records in master vault
                        </p>
                        <p className="text-xs text-white/40">Try clearing the filter or widening the search.</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="forge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                  <h2 className="max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.04em] text-white md:text-5xl">
                    Forge a new module
                    <span className="mt-2 block text-gold">from a single concept.</span>
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-[#E8E6E1] md:justify-self-end md:text-[1.02rem]">
                    Describe the industrial intent. The forge runs an industrial assessment, returns viability and complexity, and offers a hot-load into the cockpit.
                  </p>
                </div>

                <IdeaForge />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-background/40 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6 lg:px-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            Curator Agent v1.0.4 &middot; System: Authorised
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            Mode: {mode === 'research' ? 'Research' : 'Idea Forge'}
          </p>
        </div>
      </footer>
    </div>
  );
}
