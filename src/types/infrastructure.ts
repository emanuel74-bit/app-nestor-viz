export type AppType = 'ingest' | 'processor' | 'api' | 'storage' | 'analytics';

export const APP_TYPES: AppType[] = ['ingest', 'processor', 'api', 'storage', 'analytics'];

export interface SourceProperties {
  [key: string]: string;
}

export interface Source {
  id: string;
  name: string;
  categoryPath: string[];
  properties: SourceProperties;
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

// Hierarchy tree types
export interface CategoryNode {
  name: string;
  path: string[];
  children: Map<string, CategoryNode>;
  sources: Source[];
}

export interface HierarchyState {
  expandedPaths: Set<string>;
  activeScopePath: string[] | null;
  searchQuery: string;
}
