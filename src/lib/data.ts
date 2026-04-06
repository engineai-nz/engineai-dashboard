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
  lastArtifact?: {
    type: 'markdown' | 'code' | 'sow';
    content: string;
    filename?: string;
  };
}

export const MOCK_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Jackson Construction', 
    division: 'biab', 
    status: 'active', 
    stage: 'build', 
    lockedStages: [],
    lastArtifact: {
      type: 'code',
      filename: 'schema.sql',
      content: 'CREATE TABLE clients (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  name TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);'
    }
  },
  { 
    id: '2', 
    name: 'Stellar Logistics', 
    division: 'biab', 
    status: 'idle', 
    stage: 'analysis', 
    lockedStages: [],
    lastArtifact: {
      type: 'markdown',
      content: '# Analysis Report\n\n- Logistic efficiency at 78%\n- Bottleneck identified in Auckland port\n- Recommendation: Autonomous scheduling.'
    }
  },
  { 
    id: '3', 
    name: 'Nexus Pharma', 
    division: 'skunkworks', 
    status: 'blocked', 
    stage: 'plan', 
    lockedStages: ['plan'],
    lastArtifact: {
      type: 'sow',
      content: '## Scope of Work\n\n1. Research R&D Burn Rate\n2. Design Prototype\n3. Execute Skunkworks testing.'
    }
  },
  { id: '4', name: 'OpenClaw Bridge', division: 'modular', status: 'active', stage: 'solution', lockedStages: [] },
  { id: '5', name: 'Founder Desktop', division: 'desktop', status: 'active', stage: 'deploy', lockedStages: [] },
];
