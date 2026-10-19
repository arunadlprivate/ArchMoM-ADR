export type PriorityLevel = 'P0' | 'P1' | 'P2';

export interface ActionItem {
  task: string;
  owner: string;
  deadline?: string | null;
  priority: PriorityLevel;
}

export interface Decision {
  decision: string;
  rationale?: string | null;
  discarded_options?: string[];
}

export interface MeetingMinutes {
  title: string;
  date?: string | null;
  executive_summary: string;
  decisions: Decision[];
  action_items: ActionItem[];
  risks_and_open_questions: string[];
}

export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  status: 'Proposed' | 'Accepted' | 'Rejected' | 'Deprecated';
  context: string;
  decision: string;
  consequences: string;
  alternatives_considered: string[];
  date?: string | null;
}

export interface OllamaStatus {
  connected: boolean;
  endpoint: string;
  models: string[];
  targetModel: string;
  error?: string;
  privacyGuarantee: {
    cloudEgressBytes: number;
    mode: string;
    schemaEnforced: boolean;
  };
}

export type IngestionMode = 'text' | 'audio' | 'vision';
export type ViewTab = 'mom' | 'adrs' | 'actions' | 'json' | 'architecture' | 'cli';

export interface TestResultItem {
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'running';
  duration?: string;
  detail?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationSeconds: number;
  output: string;
  tests: TestResultItem[];
}
