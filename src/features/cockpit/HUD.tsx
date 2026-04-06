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
        
        // Console diagnostics using NZ English
        if (!isCurrentlyLocked) {
          console.log(`[EXECUTIVE] Authorising Surgical Lock for ${p.name} at ${stageId} stage.`);
          console.log(`[SYSTEM] Intervention Synchronised: Stage ${stageId} locked.`);
        } else {
          console.log(`[EXECUTIVE] Deauthorising Surgical Lock for ${p.name} at ${stageId} stage.`);
        }

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
      
      <main className={`flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6 space-y-8 bg-background/50 backdrop-blur-sm transition-all duration-500 ${isSystemPaused ? 'grayscale-[0.5] contrast-[0.8]' : ''}`}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-primary/10 pb-6 gap-4 font-mono relative z-20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-muted tracking-tighter uppercase">{division.name}</h1>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 border border-primary/20 bg-primary/5 rounded-sm">
                  <p className={`text-[8px] uppercase tracking-[0.2em] animate-pulse ${isSreActive ? 'text-red-500' : isSystemPaused ? 'text-amber-500' : 'text-primary'}`}>
                    Pipeline: {isSreActive ? 'Repairing' : isSystemPaused ? 'Paused' : 'Active'}
                  </p>
                </div>
                {/* Mode Toggles */}
                <div className="flex border border-primary/10 rounded-sm overflow-hidden ml-4">
                  <button onClick={() => setMode('operations')} className={`px-2 py-1 text-[8px] uppercase font-bold transition-colors ${mode === 'operations' ? 'bg-primary text-primary-foreground' : 'text-primary/40 hover:bg-white/5'}`}><LayoutDashboard size={10} /></button>
                  <button onClick={() => setMode('services')} className={`px-2 py-1 text-[8px] uppercase font-bold transition-colors ${mode === 'services' ? 'bg-blue-500 text-white' : 'text-blue-400/40 hover:bg-white/5'}`}><LifeBuoy size={10} /></button>
                </div>
              </div>
            </div>
            <p className="text-[10px] uppercase text-primary/60 mt-1 tracking-[0.2em]">Operational Oversight: {division.slug === 'global' ? 'Active Agency Portfolio' : 'Division Intelligence'}</p>
          </div>
          <div className="text-right text-muted-foreground">
            <p className="text-[10px] uppercase leading-none mb-1 text-xs text-muted-foreground/40">Last Context Sync</p>
            <p className="text-xs font-mono uppercase">{syncTime}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'operations' ? (
            <motion.div key="operations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <section className="space-y-4 relative z-20">
                <h2 className="text-[10px] font-mono uppercase text-primary/40 tracking-[0.2em]">Strategic Rationale</h2>
                {latestDecision ? (
                  <DecisionCard rationale={latestDecision.executive_rationale!} agentRole={latestDecision.recipient_role} taskTitle={latestDecision.task_title} onClick={() => setSelectedTask(latestDecision as unknown as AuditTask)} />
                ) : (
                  <div className="p-8 border border-primary/10 bg-primary/5 rounded-sm flex items-center justify-center text-center opacity-40">
                    <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">Awaiting Agentic Decisions...</p>
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
                <div className="lg:col-span-2 bg-surface border border-primary/10 p-6 rounded-sm min-h-[300px] flex flex-col relative group text-xs overflow-hidden">
                  <FlickerOverlay isActive={isRefactoring} />
                  <div className="flex justify-between items-center mb-6 font-mono relative z-20">
                    <h2 className="text-xs uppercase text-primary/80 tracking-widest font-bold">Active Deliveries</h2>
                    <button className="text-[10px] text-primary/40 hover:text-primary transition-colors uppercase underline font-mono">View Full Factory</button>
                  </div>
                  <div className="flex-1 space-y-6 relative z-20">
                    {[...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as DivisionSlug, lockedStages: [] }))].length === 0 ? (
                      <div className="h-full flex items-center justify-center border border-primary/5 rounded-sm bg-background/20 opacity-20"><p className="text-[10px] font-mono uppercase tracking-[0.3em]">Initialising Component Stream...</p></div>
                    ) : (
                      [...projects, ...modules.map(m => ({ id: m.id, name: m.concept_title, stage: 'analysis', status: 'active' as const, division: 'modular' as any, lockedStages: [] }))].map(project => {
                        const statusInfo = projectStatusMap[project.name] || {};
                        const isQualityValid = statusInfo.quality === 'completed';
                        const isHotLoaded = modules.some(m => m.id === project.id);
                        return (
                          <div key={project.id} className={`border p-4 rounded-sm transition-all duration-500 relative overflow-hidden ${project.lockedStages && project.lockedStages.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-primary/5 bg-background/20'}`}>
                            {project.lockedStages && project.lockedStages.length > 0 && (
                              <div className="absolute top-0 right-0 bg-amber-500/90 text-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest animate-pulse z-20">
                                HITL LOCK ACTIVE
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-4 relative z-20">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[11px] font-bold text-muted uppercase tracking-tight">{project.name}</span>
                                {isQualityValid && <div className="flex items-center gap-1 text-[8px] font-mono text-green-500 uppercase bg-green-500/10 px-1.5 py-0.5 border border-green-500/20 rounded-xs"><ShieldCheck size={10} /> Quality Verified</div>}
                                {isHotLoaded && <div className="flex items-center gap-1 text-[8px] font-mono text-primary uppercase bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded-xs animate-pulse font-bold tracking-widest"><Rocket size={10} /> Hot-Loaded</div>}
                              </div>
                              <span className="text-[9px] font-mono text-primary/60 uppercase">{project.stage} phase</span>
                            </div>
                            <div className="relative z-20">
                              <ProgressiveRibbon currentStageId={project.stage} lockedStages={project.lockedStages} onToggleLock={(stageId) => handleToggleLock(project.id, stageId)} />
                            </div>
                            <div className="mt-4 relative z-20"><CodeStream isActive={isRefactoring && project.status === 'active'} /></div>
                            
                            {project.status === 'blocked' && (
                              <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <div className="mt-20">
                                  <p className="text-[10px] font-mono text-amber-500/40 uppercase tracking-[0.4em] font-bold">Project Blocked: HITL Active</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {isSystemPaused && <div className="absolute inset-0 bg-background/20 backdrop-grayscale flex items-center justify-center z-30"><p className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.4em] font-bold">Flow Interrupted</p></div>}
                </div>

                <div className="bg-surface border border-primary/10 p-6 rounded-sm flex flex-col h-full text-xs">
                  <h2 className="text-xs font-mono uppercase text-primary/80 tracking-widest mb-6 font-bold text-xs">Task Ledger Audit</h2>
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] scrollbar-hide relative z-20">
                    {tasks.length === 0 ? <p className="text-[10px] font-mono uppercase tracking-widest text-center py-10 opacity-20">Audit Stream Empty</p> : tasks.map((task) => (
                      <button key={task.id} onClick={() => setSelectedTask(task as unknown as AuditTask)} className="w-full text-left flex gap-3 items-start border-l border-primary/20 pl-3 py-2 hover:bg-primary/5 transition-colors group">
                        <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${task.task_title?.includes('SRE') || task.status === 'failed' ? 'bg-red-500 animate-pulse' : task.status === 'completed' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                        <div>
                          <div className="flex justify-between items-center gap-4">
                            <p className={`text-[10px] font-bold uppercase ${task.task_title?.includes('SRE') || task.status === 'failed' ? 'text-red-500' : 'text-primary'}`}>{task.sender_role} → {task.recipient_role}</p>
                            <p className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-tighter">Trace available</p>
                          </div>
                          <p className={`text-[11px] font-bold uppercase tracking-tight mt-0.5 ${task.task_title?.includes('SRE') ? 'text-red-400' : 'text-muted'}`}>{task.task_title}</p>
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
