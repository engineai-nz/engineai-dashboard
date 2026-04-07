export type DivisionSlug = 'global' | 'biab' | 'skunkworks' | 'modular' | 'desktop';

/**
 * KPI definition for a division telemetry tile.
 *
 * `value` and `trend` are optional mock data used until real values
 * are wired through from the task ledger / Supabase. The 'health'
 * KPI is special-cased in HUD.tsx to read from the live task ledger,
 * so its value/trend here are just fallbacks for when no health
 * task is in flight yet.
 *
 * `status` defaults to 'nominal'. Set to 'warning' or 'critical' to
 * tint the corresponding TelemetryCard.
 */
export interface DivisionKpi {
  label: string;
  key: string;
  value: string;
  trend?: string;
  status?: 'nominal' | 'warning' | 'critical';
}

export interface Division {
  slug: DivisionSlug;
  name: string;
  kpis: DivisionKpi[];
}

export const DIVISIONS: Division[] = [
  {
    slug: 'global',
    name: 'Global Portfolio',
    kpis: [
      { label: 'Monthly Recurring Revenue', key: 'mrr', value: '$142.5K', trend: '+12% MoM' },
      { label: 'Agency Velocity', key: 'velocity', value: '8.2', trend: '+1.4 ships/wk' },
      { label: 'Token Consumption', key: 'tokens', value: '$8,420', trend: '-5% optimised' },
      { label: 'System Health', key: 'health', value: 'OPTIMAL', trend: '24ms' },
    ],
  },
  {
    slug: 'biab',
    name: 'Business In A Box',
    kpis: [
      { label: 'Build Velocity', key: 'velocity', value: '24h', trend: 'avg full-stack' },
      { label: 'Cloning Efficiency', key: 'cloning', value: '94%', trend: '+3% WoW' },
      { label: 'Active Provisioning', key: 'active', value: '3', trend: 'tenants' },
      { label: 'Success Rate', key: 'success', value: '97%', trend: 'last 30d' },
    ],
  },
  {
    slug: 'skunkworks',
    name: 'SkunkWorks (Special Projects)',
    kpis: [
      { label: 'R&D Burn Rate', key: 'burn', value: '$4.1K', trend: 'monthly' },
      { label: 'Innovation Index', key: 'innovation', value: '7.8', trend: '/10 internal' },
      { label: 'Prototype Lead Time', key: 'lead_time', value: '6d', trend: 'concept to demo' },
      { label: 'Research Depth', key: 'research', value: '12', trend: 'active threads' },
    ],
  },
  {
    slug: 'modular',
    name: 'Modular Builds (OpenClaw)',
    kpis: [
      { label: 'Module Hot-Loads', key: 'hotloads', value: '47', trend: 'last 24h' },
      { label: 'Interface Stability', key: 'stability', value: '99.4%', trend: '7d uptime' },
      { label: 'Bridge Traffic', key: 'bridge', value: '1.2K', trend: 'reqs/hr' },
      { label: 'Agent Handoffs', key: 'handoffs', value: '312', trend: 'last 24h' },
    ],
  },
  {
    slug: 'desktop',
    name: 'Desktop AI Setups',
    kpis: [
      { label: 'Deployment Count', key: 'deployments', value: '5', trend: 'active rigs' },
      { label: 'Local Latency', key: 'latency', value: '12ms', trend: 'p95' },
      { label: 'Sync Integrity', key: 'sync', value: '100%', trend: 'no drift' },
      { label: 'Compute Efficiency', key: 'compute', value: '88%', trend: 'GPU util' },
    ],
  },
];

export interface Project {
  id: string;
  name: string;
  division: DivisionSlug;
  status: 'active' | 'blocked' | 'idle';
  stage: string;
  lockedStages?: string[];
}

export const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Jackson Construction', division: 'biab', status: 'active', stage: 'implementation', lockedStages: [] },
  { id: '2', name: 'Stellar Logistics', division: 'biab', status: 'idle', stage: 'analysis', lockedStages: [] },
  { id: '3', name: 'Nexus Pharma', division: 'skunkworks', status: 'blocked', stage: 'plan', lockedStages: ['plan'] },
  { id: '4', name: 'OpenClaw Bridge', division: 'modular', status: 'active', stage: 'solutioning', lockedStages: [] },
  { id: '5', name: 'Founder Desktop', division: 'desktop', status: 'active', stage: 'handoff', lockedStages: [] },
];
