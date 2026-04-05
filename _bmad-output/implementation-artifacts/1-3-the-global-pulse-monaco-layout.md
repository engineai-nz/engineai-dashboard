# Story 1.3: The Global Pulse (Monaco Layout)

Status: ready-for-dev

## Story

As a Founder-Orchestrator,
I want a high-density "Monaco" layout with a persistent project sidebar and a HUD area,
so that I can maintain a 5-second pulse check on the entire agency (UX-DR4).

## Acceptance Criteria

1. **Authenticated dashboard home screen** implemented with the Monaco layout (persistent sidebar + flexible HUD area). [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
2. **Persistent sidebar** listing all active projects with "Shift-Light" status borders (Pulsing Gold for active, Static Red for risk, Deep Slate for idle). [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
3. **Main HUD area** displays high-density telemetry cards for "Global Heartbeat" metrics: MRR, Burn, and Velocity. [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
4. **Layout responds** to human interactions within 500ms and "Agent Thinking" visual feedback begins within 2s. [Source: _bmad-output/planning-artifacts/prd.md#Performance]
5. **Styling strictly follows BRAND.md**: Matte black background (#0A0A0A), Engine Gold (#C4A35A) accents, JetBrains Mono for data, and Inter for text.

## Tasks / Subtasks

- [ ] **Task 1: Monaco Layout Shell (AC: 1, 5)**
  - [ ] Create `src/app/(dashboard)/layout.tsx` to define the Monaco layout structure.
  - [ ] Implement a flexible main content area that supports high-density telemetry.
  - [ ] Ensure the background is matte Tech Noir (#0A0A0A).
- [ ] **Task 2: Project Sidebar with Shift-Lights (AC: 2, 5)**
  - [ ] Create `Sidebar.tsx` in `src/components/layout/`.
  - [ ] Implement project list items with dynamic status borders (Pulsing Gold, Red Glow, Slate).
  - [ ] Use Lucide React icons for project categorisation.
  - [ ] Map mock project data (initial) to the sidebar to verify visual states.
- [ ] **Task 3: Global Heartbeat HUD (AC: 3, 5)**
  - [ ] Create `TelemetryCard.tsx` in `src/components/dashboard/`.
  - [ ] Use JetBrains Mono for all numerical metrics and uppercase labels.
  - [ ] Implement cards for MRR, Burn, and Velocity with micro-sparklines or trend indicators.
  - [ ] Integrate cards into the dashboard home page (`src/app/(dashboard)/page.tsx`).
- [ ] **Task 4: Performance & Interaction (AC: 4)**
  - [ ] Ensure layout transitions and sidebar interactions meet the 500ms responsiveness target.
  - [ ] Implement "Scan-line" animation overlay for active processing states using Framer Motion.

## Dev Notes

- **Architecture Compliance:** Adhere to ADR-003 (Node.js runtime for logic) and ADR-005 (Sealed Envelope Pattern for data).
- **Design Inspiration:** Formula 1 App/HUD for telemetry cards and high-density precision.
- **Component Strategy:** Wrap Radix UI primitives for accessible behavior; use Tailwind for visual styling.
- **Animation:** Use Framer Motion for the "Shift-Light" pulses and "Scan-line" effects.

### Project Structure Notes

- **Feature Grouping:** Dashboard components should reside in `src/components/layout/` or `src/features/cockpit/`.
- **Route Groups:** Use Next.js `(dashboard)` route group to isolate the executive cockpit from auth and public routes.

### References

- [Source: BRAND.md] - Colors and typography tokens.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] - Monaco Layout and F1 HUD patterns.
- [Source: _bmad-output/planning-artifacts/prd.md] - Performance NFRs.
- [Source: _bmad-output/planning-artifacts/epics.md] - Epic 1: The Executive Cockpit.

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Flash

### Debug Log References

### Completion Notes List

### File List
- src/app/(dashboard)/layout.tsx
- src/app/(dashboard)/page.tsx
- src/components/layout/Sidebar.tsx
- src/components/dashboard/TelemetryCard.tsx
