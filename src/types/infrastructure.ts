export type AppType = 'ingest' | 'processor' | 'api' | 'storage' | 'analytics';

export const APP_TYPES: AppType[] = ['ingest', 'processor', 'api', 'storage', 'analytics'];

export interface Source {
  id: string;
  name: string;
  createdAt: Date;
}

export interface App {
  id: string;
  sourceId: string;
  type: AppType;
  vmId: string | null;
  status: 'running' | 'stopped' | 'pending';
}

export interface VirtualMachine {
  id: string;
  name: string;
  appType: AppType;
  status: 'online' | 'offline';
  createdAt: Date;
}
