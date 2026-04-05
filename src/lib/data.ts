export type DivisionSlug = 'global' | 'biab' | 'skunkworks' | 'modular' | 'desktop';

export interface Division {
  slug: DivisionSlug;
  name: string;
  kpis: {
    label: string;
    key: string;
  }[];
}

export const DIVISIONS: Division[] = [
  { 
    slug: 'global', 
    name: 'Global Portfolio',
    kpis: [
      { label: 'Monthly Recurring Revenue', key: 'mrr' },
      { label: 'Agency Velocity', key: 'velocity' },
      { label: 'Token Consumption', key: 'tokens' },
      { label: 'System Health', key: 'health' }
    ]
  },
  { 
    slug: 'biab', 
    name: 'Business In A Box',
    kpis: [
      { label: 'Build Velocity', key: 'velocity' },
      { label: 'Cloning Efficiency', key: 'cloning' },
      { label: 'Active Provisioning', key: 'active' },
      { label: 'Success Rate', key: 'success' }
    ]
  },
  { 
    slug: 'skunkworks', 
    name: 'SkunkWorks (Special Projects)',
    kpis: [
      { label: 'R&D Burn Rate', key: 'burn' },
      { label: 'Innovation Index', key: 'innovation' },
      { label: 'Prototype Lead Time', key: 'lead_time' },
      { label: 'Research Depth', key: 'research' }
    ]
  },
  { 
    slug: 'modular', 
    name: 'Modular Builds (OpenClaw)',
    kpis: [
      { label: 'Module Hot-Loads', key: 'hotloads' },
      { label: 'Interface Stability', key: 'stability' },
      { label: 'Bridge Traffic', key: 'bridge' },
      { label: 'Agent Handoffs', key: 'handoffs' }
    ]
  },
  { 
    slug: 'desktop', 
    name: 'Desktop AI Setups',
    kpis: [
      { label: 'Deployment Count', key: 'deployments' },
      { label: 'Local Latency', key: 'latency' },
      { label: 'Sync Integrity', key: 'sync' },
      { label: 'Compute Efficiency', key: 'compute' }
    ]
  }
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
