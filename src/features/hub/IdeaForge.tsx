'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Sparkles, Loader2, Zap, Cpu } from 'lucide-react';
import { useTenant } from '@/features/auth/TenantContext';

interface ForgeAssessment {
  viability?: string;
  complexity?: string;
  required_modules?: string[];
  rationale?: string;
  id?: string | null;
}

interface ForgeApiResponse {
  success?: boolean;
  assessment?: ForgeAssessment;
}

const IdeaForge: React.FC = () => {
  const { tenantId } = useTenant();
  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [assessment, setAssessment] = useState<ForgeAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || description.length < 10 || isForging || !tenantId) return;

    setIsForging(true);
    setAssessment(null);
    setError(null);

    try {
      const res = await fetch('/api/workflows/idea-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          concept_title: concept,
          concept_description: description,
        }),
      });

      if (!res.ok) throw new Error('Industrial Assessment Failed');
      const data = (await res.json()) as ForgeApiResponse;
      setAssessment({ ...(data.assessment ?? {}), id: data.success ? 'NEW' : null });
    } catch (err) {
      console.error('IdeaForge: forge sequence failed', err);
      setError('Forge Sequence Interrupted. Supervisor SRE Notified.');
    } finally {
      setIsForging(false);
    }
  };

  const handleActivate = async () => {
    if (!tenantId || isActivating) return;
    setIsActivating(true);
    try {
      const res = await fetch('/api/workflows/module-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          idea_id: '00000000-0000-0000-0000-000000000000',
          concept_title: concept,
        }),
      });
      if (res.ok) {
        alert('SYSTEM: Module Hot-Loaded. Synchronising with Cockpit...');
        setAssessment(null);
        setConcept('');
        setDescription('');
      }
    } catch (err) {
      console.error('IdeaForge: activation failed', err);
      setError('Activation Failed. Manual Intervention Required.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Concept Entry */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

        <div className="mb-8 flex items-center gap-3">
          <Hammer size={18} className="text-gold" />
          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">Concept Entry</span>
        </div>

        <h3 className="text-2xl font-medium tracking-[-0.03em] text-white">Describe the industrial intent.</h3>
        <p className="mt-3 text-[0.95rem] leading-7 text-[#E8E6E1]/80">
          Two fields. The forge handles the rest.
        </p>

        <form onSubmit={handleForge} className="mt-8 flex flex-1 flex-col space-y-6">
          <div className="space-y-2">
            <label htmlFor="forge-title" className="block font-mono text-[10px] uppercase tracking-[0.24em] text-[#888]">
              Module Title
            </label>
            <input
              id="forge-title"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., Automated CRM bridge"
              className="w-full rounded-[1.1rem] border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="forge-desc" className="block font-mono text-[10px] uppercase tracking-[0.24em] text-[#888]">
              Concept Description <span className="text-white/30">(min 10 characters)</span>
            </label>
            <textarea
              id="forge-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the business outcome you want this module to deliver."
              rows={6}
              className="w-full resize-none rounded-[1.1rem] border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[14px] leading-6 text-white placeholder:text-white/30 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-red-400/90">{error}</p>
          )}

          <button
            type="submit"
            disabled={isForging || !concept.trim() || description.length < 10}
            className="group inline-flex items-center justify-center gap-3 rounded-full border border-gold/30 bg-gold px-6 py-3.5 text-sm font-semibold tracking-[0.08em] text-black transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            {isForging ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} className="transition-transform group-hover:scale-110" />
            )}
            {isForging ? 'Initialising forge...' : 'Commence Incubation'}
          </button>
        </form>
      </section>

      {/* Industrial Assessment */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-white/[0.08] bg-[rgba(12,12,12,0.5)] p-8">
        <div className="mb-8 flex items-center gap-3">
          <Cpu size={18} className="text-gold/70" />
          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">Industrial Assessment</span>
        </div>

        <div className="flex h-full flex-col">
          <AnimatePresence mode="wait">
            {!assessment && !isForging && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center text-center"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/25">
                  Awaiting input sequence...
                </p>
                <p className="mt-3 text-xs text-white/30">
                  Submit a concept to receive the viability assessment.
                </p>
              </motion.div>
            )}

            {isForging && (
              <motion.div
                key="forging"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col justify-center space-y-5"
              >
                <div className="relative h-px w-full overflow-hidden bg-white/[0.06]">
                  <motion.div
                    animate={{ left: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent"
                  />
                </div>
                <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-gold/80">
                  Analysing technical feasibility...
                </p>
              </motion.div>
            )}

            {assessment && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-7"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1.1rem] border border-white/[0.07] bg-black/30 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#888]">Viability</p>
                    <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.1em] text-white">
                      {assessment.viability ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-white/[0.07] bg-black/30 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#888]">Complexity</p>
                    <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.1em] text-white">
                      {assessment.complexity ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#888]">Required Modules</p>
                  <div className="flex flex-wrap gap-2">
                    {(assessment.required_modules || []).map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-gold/25 bg-gold/[0.05] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Executive rationale — liquid-glass-gold quote block per marketing pattern */}
                <blockquote className="rounded-[1.4rem] border border-gold/15 bg-[linear-gradient(180deg,rgba(196,163,90,0.10),rgba(12,12,12,0.88))] p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold">Executive Rationale</p>
                  <p className="mt-3 text-[15px] font-light leading-7 text-white/90">
                    &ldquo;{assessment.rationale}&rdquo;
                  </p>
                </blockquote>

                <button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="liquid-glass inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] text-[#efebe3] transition duration-300 hover:border-gold/40 hover:text-white disabled:opacity-40"
                >
                  <span className="relative z-[1] flex items-center gap-3">
                    {isActivating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-gold" />}
                    {isActivating ? 'Hot-loading...' : 'Initialise Live Activation'}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default IdeaForge;
