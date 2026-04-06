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
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Cpu, Database, Github, GitBranch, GitPullRequest, ExternalLink, Lock, Rocket, LayoutDashboard, LifeBuoy } from 'lucide-react';

type CockpitMode = 'operations' | 'services';

interface HUDProps {
  activeDivision?: DivisionSlug;
  isSystemPaused?: boolean;
}

const HUD: React.FC<HUDProps> = ({ activeDivision = 'global', isSystemPaused = false }) => {
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
    return <div className="p-8 text-red-500 font-mono text-xs uppercase text-center border border-red-500/20 bg-red-500/5 uppercase">CRITICAL: SYSTEM DATA CORRUPTED</div>;
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
    const map: Record<string, { quality?: string; branch?: string; prUrl?: string; prStatus?: string; secrets?: boolean; provisioning?: { github: boolean; supabase: boolean }; resolved?: boolean }> = {};
    
    // Sort tasks by creation date (ascending) so later tasks overwrite earlier ones if needed
    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    sortedTasks.forEach(t => {
      // Robust project identification using payload.project_id (manual for root tasks) or title split
      const projectId = t.payload?.project_id;
      const projectNameFromTitle = t.task_title?.split(': ')[1];
      const key = projectId && projectId !== 'manual' ? projectId : projectNameFromTitle;
      
      if (!key) return;
      if (!map[key]) map[key] = {};
      
      const title = t.task_title || "";
      if (title.includes('Quality Integrity')) map[key].quality = t.status;
      if (title.includes('Initialise Branch')) map[key].branch = t.payload?.branch;
      if (title.includes('Verify Secrets')) map[key].secrets = t.status === 'completed';
      if (title.includes('PR Pending')) { 
        map[key].prUrl = t.payload?.url; 
        map[key].prStatus = t.status; 
      }
      if (title.includes('Provision GitHub')) map[key].provisioning = { ...map[key].provisioning!, github: t.status === 'completed' };
      if (title.includes('Provision Supabase')) map[key].provisioning = { ...map[key].provisioning!, supabase: t.status === 'completed' };
      if (title.includes('Conflict Resolved')) map[key].resolved = t.status === 'completed';
    });
    return map;
  }, [tasks]);

  const handleToggleLock = (projectId: string, stageId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId || p.name === projectId) {
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

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] overflow-hidden relative">
      <Sidebar activeDivision={activeDivision} />
      <GlitchOverlay isActive={isSreActive} />
      
      <AnimatePresence>
        {isSystemPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-[300] border-[12px] border-amber-500/10">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black px-6 py-1.5 font-mono font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl backdrop-blur-sm pointer-events-auto">
              Orchestration Paused: Manual Control Active
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className={`flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6 space-y-8 bg-background transition-all duration-500 ${isSystemPaused ? 'grayscale-[0.5] contrast-[0.8]' : ''}`}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/[0.07] pb-6 gap-4 font-mono relative z-20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-light font-sans text-white tracking-tighter uppercase">{division.name}</h1>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 border border-gold/20 bg-gold/5 rounded-none">
                  <p className={`text-[8px] uppercase tracking-[0.1em] animate-pulse ${isSreActive ? 'text-gold' : isSystemPaused ? 'text-white/40' : 'text-gold'}`}>
                    Pipeline: {isSreActive ? 'Repairing' : isSystemPaused ? 'Paused' : 'Active'}
                  </p>
                </div>
                {/* Mode Toggles */}
                <div className="flex border border-white/[0.07] rounded-full overflow-hidden ml-4">
                  <button onClick={() => setMode('operations')} className={`px-2 py-1 text-[8px] uppercase font-bold transition-opacity ${mode === 'operations' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}><LayoutDashboard size={10} /></button>
                  <button onClick={() => setMode('services')} className={`px-2 py-1 text-[8px] uppercase font-bold transition-opacity ${mode === 'services' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}><LifeBuoy size={10} /></button>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono font-light uppercase text-secondary mt-1 tracking-[0.1em]">Operational Oversight: {division.slug === 'global' ? 'Active Agency Portfolio' : 'Division Intelligence'}</p>
          </div>
          <div className="text-right text-secondary">
            <p className="text-[10px] uppercase leading-none mb-1 text-xs">Last Context Sync</p>
            <p className="text-xs font-mono uppercase font-light text-white">{syncTime}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'operations' ? (
            <motion.div key="operations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <section className="space-y-4 relative z-20">
                <h2 className="text-[10px] font-mono uppercase text-secondary tracking-[0.1em]">Strategic Rationale</h2>
                {latestDecision ? (
                  <DecisionCard rationale={latestDecision.executive_rationale!} agentRole={latestDecision.recipient_role} taskTitle={latestDecision.task_title} onClick={() => setSelectedTask(latestDecision as unknown as AuditTask)} />
                ) : (
                  <div className="p-8 border border-white/[0.07] bg-card-bg rounded-lg flex items-center justify-center text-center opacity-40">
                    <p className="text-[10px] font-mono uppercase tracking-[0.1em] leading-relaxed text-secondary">Awaiting Agentic Decisions...</p>
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-20">
                {division.kpis?.map((kpi, idx) => (
                  <TelemetryCard 
                    key={`${division.slug}-${kpi.key}-${idx}`} 
                    label={kpi.label} 
                    value={kpi.key === 'health' ? systemHealth.value : 'READ'} 
                    trend={kpi.key === 'health' ? systemHealth.latency : undefined}
                    status={kpi.key === 'health' ? systemHealth.status : 'nominal'}
                  />
                ))}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-20">
                <div className="lg:col-span-2 bg-card-bg border border-white/[0.07] p-6 rounded-lg min-h-[300px] flex flex-col relative group text-xs overflow-hidden">
                  <FlickerOverlay isActive={isRefactoring} />
                  <div className="flex justify-between items-center mb-6 font-mono relative z-20">
                    <h2 className="text-xs uppercase text-white tracking-[0.1em] font-light">Active Deliveries</h2>
                    <button className="text-[10px] text-gold hover:text-gold/80 transition-opacity uppercase underline font-mono">View Full Factory</button>
                  </div>
                  <div className="flex-1 space-y-6 relative z-20">
                    {[...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as DivisionSlug, lockedStages: [] }))].length === 0 ? (
                      <div className="h-full flex items-center justify-center border border-white/[0.07] rounded-lg bg-white/[0.02] opacity-20"><p className="text-[10px] font-mono uppercase tracking-[0.1em] text-secondary">Initialising Component Stream...</p></div>
                    ) : (
                      [...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as any, lockedStages: [] }))].map(project => {
                        const statusInfo = projectStatusMap[project.id] || projectStatusMap[project.name] || {};
                        const isQualityValid = statusInfo.quality === 'completed';
                        const isHotLoaded = modules.some(m => m.id === project.id);
                        return (
                          <div key={project.id} className={`border p-4 rounded-lg transition-all duration-500 relative overflow-hidden ${project.lockedStages && project.lockedStages.length > 0 ? 'border-white/20 bg-white/5' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[11px] font-light font-mono text-white uppercase tracking-tight">{project.name}</span>
                                {isQualityValid && <div className="flex items-center gap-1 text-[8px] font-mono text-gold bg-gold/5 px-1.5 py-0.5 border border-gold/20 rounded-full"><ShieldCheck size={10} /> Quality Verified</div>}
                                {isHotLoaded && <div className="flex items-center gap-1 text-[8px] font-mono text-white bg-white/10 px-1.5 py-0.5 border border-white/20 rounded-full animate-pulse font-light tracking-[0.1em]"><Rocket size={10} /> Hot-Loaded</div>}
                                {statusInfo.prUrl && (
                                  <a 
                                    href={statusInfo.prUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 border rounded-full transition-all hover:bg-white/10 ${
                                      statusInfo.prStatus === 'blocked' && !statusInfo.resolved
                                        ? 'text-red-400 border-red-400/20 bg-red-400/5 animate-pulse' 
                                        : statusInfo.resolved 
                                          ? 'text-gold border-gold/20 bg-gold/5'
                                          : 'text-blue-400 border-blue-400/20 bg-blue-400/5'
                                    }`}
                                  >
                                    {statusInfo.prStatus === 'blocked' && !statusInfo.resolved ? <GitBranch size={10} /> : <GitPullRequest size={10} />}
                                    {statusInfo.prStatus === 'blocked' && !statusInfo.resolved ? 'Conflict Detected' : statusInfo.resolved ? 'Conflict Resolved' : 'PR Pending'}
                                    <ExternalLink size={8} className="ml-0.5 opacity-50" />
                                  </a>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-secondary uppercase">{project.stage} phase</span>
                            </div>
                            <ProgressiveRibbon currentStageId={project.stage} lockedStages={project.lockedStages} onToggleLock={(stageId) => handleToggleLock(project.id, stageId)} />
                            <div className="mt-4"><CodeStream isActive={isRefactoring && project.status === 'active'} /></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {isSystemPaused && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30"><p className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-light">Flow Interrupted</p></div>}
                </div>

                <div className="bg-card-bg border border-white/[0.07] p-6 rounded-lg flex flex-col h-full text-xs">
                  <h2 className="text-xs font-mono uppercase text-secondary tracking-[0.1em] mb-6 font-light text-xs">Task Ledger Audit</h2>
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] scrollbar-hide relative z-20">
                    {tasks.length === 0 ? <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-center py-10 opacity-20 text-secondary">Audit Stream Empty</p> : tasks.map((task) => (
                      <button key={task.id} onClick={() => setSelectedTask(task as unknown as AuditTask)} className="w-full text-left flex gap-3 items-start border-l border-white/[0.07] pl-3 py-2 hover:bg-white/[0.02] transition-colors group">
                        <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${task.task_title?.includes('SRE') || task.status === 'failed' ? 'bg-red-500 animate-pulse' : task.status === 'completed' ? 'bg-gold animate-pulse' : 'bg-secondary'}`} />
                        <div>
                          <div className="flex justify-between items-center gap-4">
                            <p className={`text-[10px] font-mono font-light uppercase ${task.task_title?.includes('SRE') || task.status === 'failed' ? 'text-red-400' : 'text-secondary'}`}>{task.sender_role} → {task.recipient_role}</p>
                            <p className="text-[8px] font-mono text-secondary/40 uppercase tracking-tighter">Trace available</p>
                          </div>
                          <p className={`text-[11px] font-mono font-light uppercase tracking-tight mt-0.5 ${task.task_title?.includes('SRE') ? 'text-gold' : 'text-white'}`}>{task.task_title}</p>
                        </div>
                      </button>
                    ))}
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
