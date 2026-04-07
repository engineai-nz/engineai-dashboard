'use client'

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import TelemetryCard from '@/components/ui/TelemetryCard';
import ProgressiveRibbon from '@/components/ui/ProgressiveRibbon';
import CommandStrip from './CommandStrip';
import AuditDrilldown, { AuditTask } from './AuditDrilldown';
import GlitchOverlay from './GlitchOverlay';
import FlickerOverlay from '@/components/ui/FlickerOverlay';
import CodeStream from '@/components/ui/CodeStream';
import DecisionCard from '@/components/ui/DecisionCard';
import ServicesDesk from './ServicesDesk';
import { DIVISIONS, DivisionSlug } from '@/lib/data';
import { useFilteredProjects } from '@/hooks/useFilteredProjects';
import { useTaskLedger } from '@/hooks/useTaskLedger';
import { useActiveModules } from '@/hooks/useActiveModules';
import { useCockpitShell } from '@/components/CockpitShell';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Cpu, Database, Github, GitBranch, GitPullRequest, ExternalLink, Lock, Rocket, LayoutDashboard, LifeBuoy } from 'lucide-react';

type CockpitMode = 'operations' | 'services';

interface HUDProps {
  activeDivision?: DivisionSlug;
  /**
   * Optional override. When omitted, HUD reads pause state from
   * <CockpitShell> via useCockpitShell(). The prop exists so the
   * component can still be mounted in isolation (Storybook, tests)
   * without a shell wrapper.
   */
  isSystemPaused?: boolean;
}

const HUD: React.FC<HUDProps> = ({ activeDivision = 'global', isSystemPaused: pausedProp }) => {
  const { isSystemPaused: pausedFromShell } = useCockpitShell();
  const isSystemPaused = pausedProp ?? pausedFromShell;
  const [mode, setMode] = useState<CockpitMode>('operations');
  const division = useMemo(() => 
    Array.isArray(DIVISIONS) ? (DIVISIONS.find(d => d.slug === activeDivision) || DIVISIONS.find(d => d.slug === 'global') || DIVISIONS[0]) : null
  , [activeDivision]);

  const filteredProjectsInitial = useFilteredProjects(activeDivision);
  const [projects, setProjects] = useState(filteredProjectsInitial);
  const [isRefactoring, setIsRefactoring] = useState(false);
  
  const { tasks = [] } = useTaskLedger(5000);
  const { modules = [] } = useActiveModules(10000);
  const [selectedTask, setSelectedTask] = useState<AuditTask | null>(null);
  const [isSreActive, setIsSreActive] = useState(false);

  useEffect(() => {
    setProjects(filteredProjectsInitial);
  }, [activeDivision, filteredProjectsInitial.length]);

  if (!division) {
    return (
      <div className="m-8 rounded-[1.4rem] border border-signal-error/30 bg-signal-error/[0.05] p-8 text-center font-mono text-[11px] uppercase tracking-[0.26em] text-signal-error">
        CRITICAL &middot; System Data Corrupted
      </div>
    );
  }

  // Memoize latest decision
  const latestDecision = useMemo(() => {
    return [...tasks]
      .filter(t => t.executive_rationale)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
  }, [tasks]);

  // Memoize system health
  const systemHealth = useMemo(() => {
    const healthTask = tasks.find(t => t.payload?.task_type === 'IT_HEALTH');
    if (!healthTask) return { value: 'OPTIMAL', status: 'nominal' as const, latency: '24ms' };
    
    const status = healthTask.payload?.status;
    return {
      value: status,
      status: status === 'CRITICAL' ? 'critical' as const : status === 'DEGRADED' ? 'warning' as const : 'nominal' as const,
      latency: healthTask.payload?.latency || '24ms'
    };
  }, [tasks]);

  const projectStatusMap = useMemo(() => {
    const map: Record<string, { quality?: string; branch?: string; prUrl?: string; prStatus?: string; secrets?: boolean; provisioning?: { github: boolean; supabase: boolean } }> = {};
    tasks.forEach(t => {
      const projectName = t.payload?.project_id || t.task_title?.split(': ')[1];
      if (!projectName) return;
      if (!map[projectName]) map[projectName] = {};
      const title = t.task_title || "";
      if (title.includes('Quality Integrity')) map[projectName].quality = t.status;
      if (title.includes('Initialise Branch')) map[projectName].branch = t.payload?.branch;
      if (title.includes('Verify Secrets')) map[projectName].secrets = t.status === 'completed';
      if (title.includes('PR Pending')) { map[projectName].prUrl = t.payload?.url; map[projectName].prStatus = t.status; }
      if (title.includes('Provision GitHub')) map[projectName].provisioning = { ...map[projectName].provisioning!, github: t.status === 'completed' };
      if (title.includes('Provision Supabase')) map[projectName].provisioning = { ...map[projectName].provisioning!, supabase: t.status === 'completed' };
    });
    return map;
  }, [tasks]);

  const handleToggleLock = (projectId: string, stageId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const currentLocks = p.lockedStages || [];
        const isCurrentlyLocked = currentLocks.includes(stageId);
        const nextLocks = isCurrentlyLocked ? currentLocks.filter(s => s !== stageId) : [...currentLocks, stageId];
        return { ...p, lockedStages: nextLocks, status: nextLocks.length > 0 ? 'blocked' : 'active' };
      }
      return p;
    }));
  };

  const syncTime = useMemo(() => {
    const date = new Date(tasks[0]?.created_at || 0);
    return isNaN(date.getTime()) || !tasks[0]
      ? 'INITIALISING...'
      : date.toLocaleTimeString('en-NZ', { timeZone: 'UTC', hour12: false }) + ' UTC';
  }, [tasks]);

  const pipelineLabel = isSreActive ? 'Repairing' : isSystemPaused ? 'Paused' : 'Active';
  const pipelineTone = isSystemPaused
    ? 'border-amber-400/30 bg-amber-400/[0.06] text-amber-300'
    : isSreActive
      ? 'border-signal-error/30 bg-signal-error/[0.06] text-signal-error'
      : 'border-gold/30 bg-gold/[0.06] text-gold';

  return (
    <div className="relative flex h-auto flex-col overflow-hidden lg:h-[calc(100vh-5.25rem)] lg:flex-row">
      <Sidebar activeDivision={activeDivision} />
      <GlitchOverlay isActive={isSreActive} />

      <AnimatePresence>
        {isSystemPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[300] border-[12px] border-amber-400/10"
          >
            <div className="pointer-events-auto absolute left-1/2 top-[7.5rem] -translate-x-1/2 rounded-full border border-amber-400/40 bg-amber-400/90 px-6 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-black shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm">
              Orchestration Paused &middot; Manual Control Active
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`relative flex-1 space-y-10 overflow-y-auto px-6 py-10 pb-28 transition-all duration-500 lg:px-10 lg:pb-10 ${
          isSystemPaused ? 'grayscale-[0.5] contrast-[0.8]' : ''
        }`}
      >
        <header className="relative z-20 flex flex-col gap-6 border-b border-white/[0.07] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#888]">
                {division.slug === 'global' ? 'Active Portfolio' : 'Division Intelligence'}
              </span>
              <span className="h-px flex-1 max-w-[12rem] bg-white/[0.07]" />
            </div>
            <div className="flex flex-wrap items-end gap-5">
              <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white md:text-5xl">
                {division.name}
              </h1>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] ${pipelineTone}`}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 animate-pulse-signal rounded-full bg-current"
                />
                Pipeline &middot; {pipelineLabel}
              </span>

              {/* Mode toggle — glass pill nav */}
              <div className="liquid-glass flex items-center rounded-full px-1.5 py-1">
                <button
                  onClick={() => setMode('operations')}
                  aria-label="Operations mode"
                  className={`relative z-[1] inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    mode === 'operations'
                      ? 'bg-gold/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_18px_rgba(196,163,90,0.18)]'
                      : 'text-[#cec9c1] hover:bg-teal/[0.06] hover:text-teal'
                  }`}
                >
                  <LayoutDashboard size={11} className={mode === 'operations' ? 'text-gold' : ''} />
                  Ops
                </button>
                <button
                  onClick={() => setMode('services')}
                  aria-label="Services mode"
                  className={`relative z-[1] inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    mode === 'services'
                      ? 'bg-gold/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_18px_rgba(196,163,90,0.18)]'
                      : 'text-[#cec9c1] hover:bg-teal/[0.06] hover:text-teal'
                  }`}
                >
                  <LifeBuoy size={11} className={mode === 'services' ? 'text-gold' : ''} />
                  Services
                </button>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#888]">Last Context Sync</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-white">{syncTime}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'operations' ? (
            <motion.div
              key="operations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-12"
            >
              {/* Strategic Rationale */}
              <section className="relative z-20 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#888]">
                    Strategic Rationale
                  </span>
                  <span className="h-px flex-1 max-w-[12rem] bg-white/[0.07]" />
                </div>
                {latestDecision ? (
                  <DecisionCard
                    rationale={latestDecision.executive_rationale!}
                    agentRole={latestDecision.recipient_role}
                    taskTitle={latestDecision.task_title}
                    onClick={() => setSelectedTask(latestDecision as unknown as AuditTask)}
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-[1.4rem] border border-dashed border-white/[0.07] bg-[rgba(12,12,12,0.5)] p-10">
                    <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/30">
                      Awaiting agentic decisions...
                    </p>
                  </div>
                )}
              </section>

              {/* KPI grid */}
              <section className="relative z-20 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#888]">
                    Telemetry
                  </span>
                  <span className="h-px flex-1 max-w-[12rem] bg-white/[0.07]" />
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {division.kpis?.map((kpi, idx) => {
                    // 'health' is the only live KPI right now — it reads from
                    // the task ledger via systemHealth above. Every other KPI
                    // falls back to the mock value/trend defined in DIVISIONS.
                    const isHealth = kpi.key === 'health';
                    return (
                      <TelemetryCard
                        key={`${division.slug}-${kpi.key}-${idx}`}
                        label={kpi.label}
                        value={isHealth ? systemHealth.value : kpi.value}
                        trend={isHealth ? systemHealth.latency : kpi.trend}
                        status={isHealth ? systemHealth.status : kpi.status ?? 'nominal'}
                      />
                    );
                  })}
                </div>
              </section>

              {/* Active Deliveries + Task Ledger */}
              <section className="relative z-20 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.32)] lg:col-span-2">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />
                  <FlickerOverlay isActive={isRefactoring} />

                  <div className="relative z-20 mb-7 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">
                        Active Deliveries
                      </span>
                    </div>
                    <button className="group/link inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-teal">
                      View Full Factory
                      <span className="transition-transform group-hover/link:translate-x-0.5">&rarr;</span>
                    </button>
                  </div>

                  <div className="relative z-20 flex-1 space-y-5">
                    {[...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as DivisionSlug, lockedStages: [] }))].length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-[1.2rem] border border-dashed border-white/[0.07] bg-black/20 py-10">
                        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/30">
                          Initialising component stream...
                        </p>
                      </div>
                    ) : (
                      [...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as DivisionSlug, lockedStages: [] }))].map(project => {
                        const statusInfo = projectStatusMap[project.name] || {};
                        const isQualityValid = statusInfo.quality === 'completed';
                        const isHotLoaded = modules.some(m => m.id === project.id);
                        const isLocked = (project.lockedStages?.length ?? 0) > 0;
                        return (
                          <div
                            key={project.id}
                            className={`relative overflow-hidden rounded-[1.2rem] border p-5 transition-all duration-500 ${
                              isLocked
                                ? 'border-signal-error/25 bg-signal-error/[0.03]'
                                : 'border-white/[0.07] bg-white/[0.02]'
                            }`}
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-white">
                                  {project.name}
                                </span>
                                {isQualityValid && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-signal-live/30 bg-signal-live/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-signal-live">
                                    <ShieldCheck size={10} /> Quality
                                  </span>
                                )}
                                {isHotLoaded && (
                                  <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-teal/30 bg-teal/[0.06] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-teal">
                                    <Rocket size={10} /> Hot-Loaded
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888]">
                                {project.stage}
                              </span>
                            </div>
                            <ProgressiveRibbon
                              currentStageId={project.stage}
                              lockedStages={project.lockedStages}
                              onToggleLock={(stageId) => handleToggleLock(project.id, stageId)}
                            />
                            <div className="mt-4">
                              <CodeStream isActive={isRefactoring && project.status === 'active'} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isSystemPaused && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white">
                        Flow Interrupted
                      </p>
                    </div>
                  )}
                </div>

                {/* Task Ledger Audit */}
                <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#888]">
                      Task Ledger
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 animate-pulse-signal rounded-full bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.7)]"
                    />
                  </div>

                  <div className="scrollbar-hide relative z-20 max-h-[400px] flex-1 space-y-1 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.26em] text-white/25">
                        Audit stream empty
                      </p>
                    ) : (
                      tasks.map((task) => {
                        const isCritical = task.task_title?.includes('SRE') || task.status === 'failed';
                        const isCompleted = task.status === 'completed';
                        return (
                          <button
                            type="button"
                            key={task.id}
                            onClick={() => setSelectedTask(task as unknown as AuditTask)}
                            className="group flex w-full items-start gap-3 rounded-[0.9rem] border border-transparent px-3 py-2.5 text-left transition-colors hover:border-teal/20 hover:bg-teal/[0.03]"
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                isCritical
                                  ? 'animate-pulse bg-signal-error shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                                  : isCompleted
                                    ? 'bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.6)]'
                                    : 'bg-white/30'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className={`truncate font-mono text-[10px] uppercase tracking-[0.18em] ${
                                  isCritical ? 'text-signal-error' : 'text-[#888]'
                                }`}>
                                  {task.sender_role} &rarr; {task.recipient_role}
                                </p>
                                <p className="shrink-0 font-mono text-[8px] uppercase tracking-[0.18em] text-white/30">
                                  Trace
                                </p>
                              </div>
                              <p className={`mt-1 truncate font-mono text-[11px] uppercase tracking-[0.12em] ${
                                isCritical ? 'text-signal-error' : 'text-white'
                              }`}>
                                {task.task_title}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </motion.div>

          ) : (
            <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <ServicesDesk />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>{selectedTask && <AuditDrilldown task={selectedTask} onClose={() => setSelectedTask(null)} />}</AnimatePresence>
      <CommandStrip 
        projectName={projects[0]?.name} 
        projectStage={projects[0]?.stage} 
      />
    </div>
  );
};

export default HUD;
