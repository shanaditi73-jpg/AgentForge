export interface AgentLog {
  id: number;
  run_id: number;
  agent_name: string;
  output: string;
  timestamp: string;
}

export interface Run {
  id: number;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
  agent_logs?: AgentLog[];
}

export interface AgentUpdate {
  type: 'started' | 'agent_update' | 'completed' | 'error';
  agent?: string;
  status?: string;
  output?: string;
  run_id?: number;
  message?: string;
  research?: string;
  coding?: string;
  review?: string;
}


