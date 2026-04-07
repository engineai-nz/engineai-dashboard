'use client'

import React, { createContext, useContext, useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import ManualOverride from '@/features/cockpit/ManualOverride'

type SystemStatus = 'active' | 'paused' | 'terminated'

interface CockpitShellContextValue {
  systemStatus: SystemStatus
  isSystemPaused: boolean
}

const CockpitShellContext = createContext<CockpitShellContextValue>({
  systemStatus: 'active',
  isSystemPaused: false,
})

/**
 * Read the cockpit shell state (paused / terminated overrides) from
 * inside any descendant of <CockpitShell>. Returns the default state
 * (`active`, not paused) when called outside the shell, so consumers
 * stay safe in routes that intentionally render bare (e.g. /login).
 */
export function useCockpitShell() {
  return useContext(CockpitShellContext)
}

interface CockpitShellProps {
  children: React.ReactNode
}

/**
 * The Engine AI cockpit chrome: top nav with brand wordmark, system
 * status, manual override, and the Intelligence Hub jump-off. Wraps
 * every cockpit route (home, division/[slug]).
 *
 * State (system override) lives in this component and is exposed via
 * React Context (`useCockpitShell`) so descendants can react to pause
 * state without prop-drilling. The plain `children: ReactNode` shape
 * lets server components compose this shell — render-prop children
 * would not survive the server -> client boundary.
 *
 * Visual language: brand-aligned with engineai.co.nz.
 * - Glass-pill top nav with backdrop-blur-2xl
 * - Gold wordmark "EA" logo square
 * - Mono JetBrains brand treatment with 0.16em tracking
 * - Status indicators use semantic signal-live (green) / teal hover
 * - Ambient atmosphere is inherited from root layout
 */
export default function CockpitShell({ children }: CockpitShellProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('active')

  const handleOverride = async (state: SystemStatus) => {
    setSystemStatus(state)
    if (state !== 'active') {
      // eslint-disable-next-line no-console
      console.log(`SYSTEM: Executive Override Initiated - State: ${state.toUpperCase()}`)
    }
  }

  const isSystemPaused = systemStatus === 'paused' || systemStatus === 'terminated'

  return (
    <CockpitShellContext.Provider value={{ systemStatus, isSystemPaused }}>
      <div className="relative min-h-screen text-[#E8E6E1]">
        {/* Sticky brand header */}
        <nav className="relative z-40 border-b border-white/[0.07] bg-background/78 backdrop-blur-2xl">
          <div className="mx-auto flex h-20 max-w-[92rem] items-center justify-between px-6 md:h-[5.25rem] lg:px-10">
            {/* Left — brand wordmark */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-gold/25 bg-gold/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(196,163,90,0.12)]">
                <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">
                  EA
                </span>
              </div>
              <div className="hidden items-baseline gap-2 md:flex">
                <span className="font-sans text-[1.05rem] font-semibold uppercase tracking-[0.16em] text-[#E8E6E1]">
                  EngineAI
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#888]">OS</span>
              </div>
            </div>

            {/* Centre — status readouts */}
            <div className="hidden items-center gap-5 md:flex">
              <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full transition-colors ${
                    systemStatus === 'active'
                      ? 'animate-pulse-signal bg-signal-live shadow-[0_0_12px_rgba(76,175,80,0.7)]'
                      : systemStatus === 'paused'
                        ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                        : 'bg-signal-error shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                  }`}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white">
                  System: {systemStatus}
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#888]">
                Tenant: Executive
              </span>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/hub"
                aria-label="Open Intelligence Hub"
                className="group hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#cec9c1] transition-all duration-300 hover:border-teal/30 hover:bg-teal/[0.04] hover:text-teal lg:inline-flex"
              >
                <BookOpen size={13} className="transition-colors group-hover:text-teal" />
                Hub
              </Link>

              <ManualOverride onOverride={handleOverride} systemStatus={systemStatus} />

              <button
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                Initialise
              </button>
            </div>
          </div>
        </nav>

        {children}
      </div>
    </CockpitShellContext.Provider>
  )
}
