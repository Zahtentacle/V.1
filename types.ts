export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  message?: string;
  log?: string;
  timestamp?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  worker: 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA' | 'SYSTEM';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export enum WorkerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  SLEEPING = 'SLEEPING'
}

export interface WorkerActivity {
  id: 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA';
  name: string;
  status: 'active' | 'idle' | 'warning';
  load: number;
}

export interface AppState {
  contacts: Contact[];
  logs: LogEntry[];
  workerStatus: WorkerStatus;
  processedCount: number;
  otpCode: string | null;
  workers: WorkerActivity[];
}