export type ContactStatus = 'pending' | 'processing' | 'sent';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: ContactStatus;
  message?: string;
  timestamp?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  worker: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export enum WorkerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING'
}

export interface Worker {
  id: string;
  name: string;
  status: string;
  load: number;
}

export interface AppState {
  contacts: Contact[];
  logs: LogEntry[];
  workerStatus: WorkerStatus;
  processedCount: number;
  otpCode: string | null;
  workers: Worker[];
}
