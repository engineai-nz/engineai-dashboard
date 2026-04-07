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

  // Boundary-aware positioning
  const handleMouseEnter = (e: React.MouseEvent, project: Project) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const portalWidth = 288; // w-72
    let left = rect.right + 14;

    if (left + portalWidth > window.innerWidth) {
      left = rect.left - 14 - portalWidth;
    }

    setPortalPos({ top: rect.top, left });
    setHoveredProject(project);
  };

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
          project_brief: 'Initialise industrial refactor for Construction suite.',
        }),
      });
      if (res.ok) {
        alert('SYSTEM: Agent Handoff Loop Initialised. Check Audit Stream.');
      } else {
        throw new Error('Response not OK');
      }
    } catch (err) {
      console.error('Sidebar: initiateLoop failed', err);
      alert('SYSTEM ERROR: Workflow Initiation Failed.');
    } finally {
      setIsTriggering(false);
    }
  };

  const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#888]">{children}</span>
      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );

  return (
    <>
      {/* Mobile Division Strip */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/[0.07] p-3 scrollbar-hide lg:hidden">
        {Array.isArray(DIVISIONS) && DIVISIONS.map((d) => (
          <Link
            key={`mobile-${d.slug}`}
            href={d.slug === 'global' ? '/' : `/division/${d.slug}`}
            aria-label={`Switch to ${d.name} view`}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
              activeDivision === d.slug
                ? 'border-gold/30 bg-gold/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-white/[0.06] bg-black/20 text-[#cec9c1] hover:border-teal/30 hover:text-teal'
            }`}
          >
            {d.slug}
          </Link>
        ))}
      </div>

      <aside className="hidden h-full w-[18rem] shrink-0 flex-col border-r border-white/[0.05] lg:flex">
        <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
          {/* Division Access */}
          <section className="mb-8">
            <SectionLabel>Division Access</SectionLabel>
            <div className="space-y-2">
              {Array.isArray(DIVISIONS) && DIVISIONS.map((d) => {
                const isActive = activeDivision === d.slug;
                return (
                  <Link
                    key={d.slug}
                    href={d.slug === 'global' ? '/' : `/division/${d.slug}`}
                    aria-label={`Switch to ${d.name} view`}
                    className={`block rounded-full border px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.2em] transition-all duration-300 ${
                      isActive
                        ? 'border-gold/30 bg-gold/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(196,163,90,0.10)]'
                        : 'border-white/[0.06] bg-black/20 text-[#cec9c1] hover:border-teal/30 hover:bg-teal/[0.04] hover:text-teal'
                    }`}
                  >
                    {d.slug}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Operations CTA */}
          <section className="mb-8">
            <SectionLabel>Operations</SectionLabel>
            <button
              disabled={isTriggering}
              onClick={initiateLoop}
              className="group inline-flex w-full items-center justify-between gap-3 rounded-full border border-gold/30 bg-gold px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.15em] text-black transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              <span>{isTriggering ? 'Initialising...' : 'Initiate Handoff Loop'}</span>
              <span className="opacity-0 transition-opacity group-hover:opacity-100">&rarr;</span>
            </button>
          </section>

          {/* Project Portfolio */}
          <section>
            <SectionLabel>Project Portfolio</SectionLabel>
            <div className="space-y-2.5">
              {!filteredProjects || filteredProjects.length === 0 ? (
                <p className="rounded-[1rem] border border-dashed border-white/[0.06] bg-black/20 p-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
                  No active projects
                </p>
              ) : (
                filteredProjects.map((project) => {
                  const isActive = project.status === 'active';
                  const isBlocked = project.status === 'blocked';
                  return (
                    <button
                      type="button"
                      key={project.id}
                      onMouseEnter={(e) => handleMouseEnter(e, project)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className={`group relative block w-full rounded-[1rem] border px-4 py-3 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-gold/25 bg-gold/[0.04] hover:border-gold/45'
                          : isBlocked
                            ? 'border-signal-error/30 bg-signal-error/[0.03] hover:border-signal-error/50'
                            : 'border-white/[0.06] bg-black/20 hover:border-teal/25 hover:bg-teal/[0.03]'
                      }`}
                    >
                      <p className="truncate font-mono text-[12px] uppercase tracking-[0.14em] text-white">
                        {project.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888]">
                          {project.stage}
                        </p>
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive
                              ? 'animate-pulse-signal bg-signal-live shadow-[0_0_10px_rgba(76,175,80,0.7)]'
                              : isBlocked
                                ? 'bg-signal-error shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                                : 'bg-white/30'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Footer — command input + operator badge */}
        <div className="border-t border-white/[0.07] px-6 py-6">
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
            className="relative mb-5"
          >
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-gold/60">
              $
            </span>
            <input
              name="command"
              type="text"
              placeholder="COMMAND..."
              aria-label="Execute cockpit command"
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white placeholder:text-white/25 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="font-mono text-[11px] font-semibold text-gold">JD</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-white">
                Founder Orchestrator
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#888]">
                Session &middot; {activeDivision?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {hoveredProject && (
          <QuickLookPortal project={hoveredProject} position={portalPos} />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
