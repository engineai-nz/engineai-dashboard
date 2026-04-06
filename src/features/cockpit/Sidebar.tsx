'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DivisionSlug, DIVISIONS, Project } from '@/lib/data';
import { useFilteredProjects } from '@/hooks/useFilteredProjects';
import QuickLookPortal from '@/components/ui/QuickLookPortal';
import { AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activeDivision?: DivisionSlug;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDivision = 'global' }) => {
  const filteredProjects = useFilteredProjects(activeDivision);
  const [isTriggering, setIsTriggering] = useState(false);
  
  // Quick-Look Portal State
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });
  const [isPortalHovered, setIsPortalHovered] = useState(false);

  // Boundary-aware positioning
  const handleMouseEnter = (e: React.MouseEvent, project: Project) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const portalWidth = 320; // w-80
    let left = rect.right + 10;
    
    // Flip to left if overflowing right edge
    if (left + portalWidth > window.innerWidth) {
      left = rect.left - 10 - portalWidth;
    }

    setPortalPos({ top: rect.top, left });
    setHoveredProject(project);
  };

  const handleMouseLeave = () => {
    // Small delay to allow moving to the portal
    setTimeout(() => {
      setHoveredProject(prev => {
        // If the portal itself is hovered, don't close it
        if (isPortalHovered) return prev;
        return null;
      });
    }, 100);
  };

  // Close portal on scroll or division change
  useEffect(() => {
    const handleScroll = () => setHoveredProject(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  useEffect(() => {
    setHoveredProject(null);
  }, [activeDivision]);

  const initiateLoop = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/workflows/agent-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: '00000000-0000-0000-0000-000000000000', 
          project_name: 'Jackson Construction',
          project_brief: 'Initialise industrial refactor for Construction suite.'
        })
      });
      if (res.ok) {
        alert('SYSTEM: Agent Handoff Loop Initialised. Check Audit Stream.');
      } else {
        throw new Error('Response not OK');
      }
    } catch (err) {
      alert('SYSTEM ERROR: Workflow Initiation Failed.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
      {/* Mobile Division Strip */}
      <div className="lg:hidden flex overflow-x-auto p-2 gap-2 bg-surface border-b border-primary/10 scrollbar-hide">
        {Array.isArray(DIVISIONS) && DIVISIONS.map((d) => (
          <Link 
            key={`mobile-${d.slug}`}
            href={d.slug === 'global' ? '/' : `/division/${d.slug}`}
            aria-label={`Switch to ${d.name} view`}
            className={`text-[9px] font-mono uppercase px-3 py-1 rounded-sm whitespace-nowrap transition-colors flex-shrink-0 ${
              activeDivision === d.slug 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'text-muted-foreground/60 border border-transparent'
            }`}
          >
            {d.slug}
          </Link>
        ))}
      </div>

      <aside className="hidden lg:flex w-64 border-r border-primary/10 bg-surface h-full flex-col">
        <div className="p-4 border-b border-primary/10 overflow-y-auto flex-1 text-xs">
          <p className="text-[10px] font-mono uppercase text-primary/40 tracking-[0.2em] mb-4">Division Access</p>
          <div className="grid grid-cols-1 gap-1 mb-6">
            {Array.isArray(DIVISIONS) && DIVISIONS.map((d) => (
              <Link 
                key={d.slug}
                href={d.slug === 'global' ? '/' : `/division/${d.slug}`}
                aria-label={`Switch to ${d.name} view`}
                className={`text-[10px] font-mono uppercase px-3 py-1.5 rounded-sm transition-colors ${
                  activeDivision === d.slug 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-muted-foreground/60 hover:text-muted hover:bg-white/5'
                }`}
              >
                {d.slug}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <p className="text-[10px] font-mono uppercase text-primary/40 tracking-[0.2em]">Operations</p>
            <button 
              disabled={isTriggering}
              onClick={initiateLoop}
              className="w-full bg-primary/5 border border-primary/20 text-[10px] font-mono text-primary px-3 py-2 hover:bg-primary/10 transition-colors uppercase text-left flex justify-between items-center group disabled:opacity-50"
            >
              <span>{isTriggering ? 'Initialising...' : 'Initiate Handoff Loop'}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>

          <p className="text-[10px] font-mono uppercase text-primary/40 tracking-[0.2em] mb-4">Project Portfolio</p>
          <div className="space-y-2">
            {!filteredProjects || filteredProjects.length === 0 ? (
              <p className="text-[10px] font-mono text-muted-foreground/40 uppercase p-3">No active projects</p>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onMouseEnter={(e) => handleMouseEnter(e, project)}
                  onMouseLeave={handleMouseLeave}
                  className={`p-3 bg-background/50 border-l-2 cursor-pointer hover:bg-background transition-colors group relative ${
                    project.status === 'active'
                      ? 'border-primary animate-pulse-gold'
                      : project.status === 'blocked'
                      ? 'border-red-500'
                      : 'border-transparent'
                  }`}
                >
                  <p className="text-xs font-bold text-muted group-hover:text-primary transition-colors truncate">{project.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{project.stage}</p>
                    <div className={`w-1 h-1 rounded-full ${
                      project.status === 'active' ? 'bg-primary' : project.status === 'blocked' ? 'bg-red-500' : 'bg-muted-foreground/20'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-primary/10 mt-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as HTMLFormElement;
              const input = target.elements.namedItem('command') as HTMLInputElement;
              if (input && input.value.trim()) {
                alert(`SYSTEM: Executing command "${input.value.trim()}"...`);
                input.value = '';
              }
            }}
            className="relative group mb-4 hidden lg:block"
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
              <span className="text-[10px] font-mono">$</span>
            </div>
            <input
              name="command"
              type="text"
              placeholder="COMMAND..."
              className="w-full bg-background/40 border border-primary/10 p-2 pl-7 text-muted focus:border-primary/40 outline-none transition-colors font-mono text-[9px] uppercase tracking-wider"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-mono text-primary font-bold">JD</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Founder Orchestrator</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Session: {activeDivision?.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {hoveredProject && (
          <QuickLookPortal 
            project={hoveredProject} 
            position={portalPos} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
