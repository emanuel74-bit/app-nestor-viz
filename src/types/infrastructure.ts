export type AppType = 'ingest' | 'processor' | 'api' | 'storage' | 'analytics';

export const APP_TYPES: AppType[] = ['ingest', 'processor', 'api', 'storage', 'analytics'];

export interface Source {
  id: string;
  name: string;
  categoryPath: string[];
  environment: string;
  region: string;
  team: string;
  createdAt: Date;
}

export interface CreateSourceInput {
  name: string;
  categoryPath: string[];
  environment: string;
  region: string;
  team: string;
}

/** Fields that appear in create/edit forms */
export interface SourceFieldMeta {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export const SOURCE_EDITABLE_FIELDS: SourceFieldMeta[] = [
  { key: 'name', label: 'Name', required: true, placeholder: 'e.g., Acme Corporation' },
  { key: 'categoryPath', label: 'Category Path', required: false, placeholder: 'e.g., enterprise/us-east/production' },
  { key: 'environment', label: 'Environment', required: true, placeholder: 'e.g., prod, staging, dev' },
  { key: 'region', label: 'Region', required: true, placeholder: 'e.g., us-east-1, eu-west-1' },
  { key: 'team', label: 'Team', required: true, placeholder: 'e.g., platform, payments' },
];

/** Fields available for filtering (excludes name which uses search bar) */
export const SOURCE_FILTERABLE_FIELDS = ['environment', 'region', 'team'] as const;
export type SourceFilterableField = (typeof SOURCE_FILTERABLE_FIELDS)[number];

/** Fields to exclude when cloning a source */
export const SOURCE_CLONE_EXCLUDE: string[] = ['name'];

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
