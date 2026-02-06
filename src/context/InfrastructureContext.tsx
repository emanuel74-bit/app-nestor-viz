import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Source, App, VirtualMachine, AppType, APP_TYPES, CategoryNode, CreateSourceInput } from '@/types/infrastructure';
import { FilterGroup, sourceMatchesFilterExpression } from '@/types/filters';
import { buildCategoryTree, filterSources, pathToKey } from '@/lib/hierarchy';

interface HierarchyState {
  expandedPaths: Set<string>;
  activeScopePath: string[] | null;
  searchQuery: string;
}

interface InfrastructureContextType {
  sources: Source[];
  apps: App[];
  vms: VirtualMachine[];

  // Source CRUD
  createSource: (input: CreateSourceInput) => { source: Source; apps: App[]; newVms: VirtualMachine[] };
  createSources: (inputs: CreateSourceInput[]) => { sources: Source[]; apps: App[]; newVms: VirtualMachine[] };

  // VM
  addVM: (name: string, appType: AppType) => VirtualMachine;

  // App operations
  deployApp: (sourceId: string, appType: AppType, vmId: string | null) => App;
  removeApp: (appId: string) => void;
  redeployApp: (appId: string, newVmId: string) => void;
  bulkDeployApp: (sourceIds: string[], appType: AppType, vmId: string | null) => void;
  redeployAllAppsOnVM: (vmId: string) => void;
  moveAllAppsToVM: (fromVmId: string, toVmId: string) => void;

  // Getters
  getAppsBySource: (sourceId: string) => App[];
  getAppsByVM: (vmId: string) => App[];
  getVMsByAppType: (appType: AppType) => VirtualMachine[];
  getSourceById: (id: string) => Source | undefined;
  getVMById: (id: string) => VirtualMachine | undefined;

  // Hierarchy
  categoryTree: CategoryNode;
  hierarchyState: HierarchyState;
  filteredSources: Source[];
  toggleExpanded: (path: string[]) => void;
  setActiveScopePath: (path: string[] | null) => void;
  setSearchQuery: (query: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isPathExpanded: (path: string[]) => boolean;

  // Filter expression (AND/OR groups)
  filterGroups: FilterGroup[];
  setFilterGroups: (groups: FilterGroup[]) => void;

  // Source selection
  selectedSourceIds: Set<string>;
  toggleSourceSelection: (id: string) => void;
  selectAllFilteredSources: () => void;
  clearSourceSelection: () => void;

  // VM filtering
  vmSearchQuery: string;
  setVmSearchQuery: (q: string) => void;
  vmAppTypeFilter: AppType | null;
  setVmAppTypeFilter: (t: AppType | null) => void;
  filteredVMs: VirtualMachine[];
}

const InfrastructureContext = createContext<InfrastructureContextType | null>(null);

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialSources: Source[] = [
  { id: 'src-1', name: 'Acme Corp', categoryPath: ['enterprise', 'us-east', 'production'], environment: 'prod', region: 'us-east-1', team: 'platform', createdAt: new Date('2024-01-15') },
  { id: 'src-2', name: 'TechStart Inc', categoryPath: ['enterprise', 'us-east', 'staging'], environment: 'staging', region: 'us-east-1', team: 'devops', createdAt: new Date('2024-02-20') },
  { id: 'src-3', name: 'GlobalBank', categoryPath: ['enterprise', 'eu-west', 'production'], environment: 'prod', region: 'eu-west-1', team: 'payments', createdAt: new Date('2024-03-10') },
  { id: 'src-4', name: 'HealthPlus', categoryPath: ['healthcare', 'us-west', 'production'], environment: 'prod', region: 'us-west-2', team: 'medical', createdAt: new Date('2024-03-15') },
  { id: 'src-5', name: 'RetailMax', categoryPath: ['retail', 'eu-central', 'production'], environment: 'prod', region: 'eu-central-1', team: 'commerce', createdAt: new Date('2024-04-01') },
];

const initialVMs: VirtualMachine[] = [
  { id: 'vm-1', name: 'ingest-node-01', appType: 'ingest', status: 'online', createdAt: new Date('2024-01-10') },
  { id: 'vm-2', name: 'processor-node-01', appType: 'processor', status: 'online', createdAt: new Date('2024-01-10') },
  { id: 'vm-3', name: 'api-node-01', appType: 'api', status: 'online', createdAt: new Date('2024-01-10') },
  { id: 'vm-4', name: 'storage-node-01', appType: 'storage', status: 'online', createdAt: new Date('2024-01-12') },
  { id: 'vm-5', name: 'analytics-node-01', appType: 'analytics', status: 'online', createdAt: new Date('2024-01-12') },
];

const initialApps: App[] = [
  { id: 'app-1', sourceId: 'src-1', type: 'ingest', vmId: 'vm-1', status: 'running' },
  { id: 'app-2', sourceId: 'src-1', type: 'processor', vmId: 'vm-2', status: 'running' },
  { id: 'app-3', sourceId: 'src-1', type: 'api', vmId: 'vm-3', status: 'running' },
  { id: 'app-4', sourceId: 'src-1', type: 'storage', vmId: 'vm-4', status: 'running' },
  { id: 'app-5', sourceId: 'src-1', type: 'analytics', vmId: 'vm-5', status: 'running' },
  { id: 'app-6', sourceId: 'src-2', type: 'ingest', vmId: 'vm-1', status: 'running' },
  { id: 'app-7', sourceId: 'src-2', type: 'processor', vmId: 'vm-2', status: 'running' },
  { id: 'app-8', sourceId: 'src-2', type: 'api', vmId: 'vm-3', status: 'running' },
  { id: 'app-9', sourceId: 'src-3', type: 'ingest', vmId: 'vm-1', status: 'running' },
  { id: 'app-10', sourceId: 'src-3', type: 'processor', vmId: 'vm-2', status: 'running' },
  { id: 'app-11', sourceId: 'src-4', type: 'ingest', vmId: 'vm-1', status: 'running' },
  { id: 'app-12', sourceId: 'src-5', type: 'ingest', vmId: 'vm-1', status: 'running' },
];

function collectAllPaths(sources: Source[]): Set<string> {
  const paths = new Set<string>();
  for (const source of sources) {
    for (let i = 1; i <= source.categoryPath.length; i++) {
      paths.add(pathToKey(source.categoryPath.slice(0, i)));
    }
  }
  return paths;
}

export function InfrastructureProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [apps, setApps] = useState<App[]>(initialApps);
  const [vms, setVMs] = useState<VirtualMachine[]>(initialVMs);

  // Hierarchy state
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => collectAllPaths(initialSources));
  const [activeScopePath, setActiveScopePath] = useState<string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  // Source selection
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());

  // VM filtering
  const [vmSearchQuery, setVmSearchQuery] = useState('');
  const [vmAppTypeFilter, setVmAppTypeFilter] = useState<AppType | null>(null);

  const categoryTree = useMemo(() => buildCategoryTree(sources), [sources]);

  const filteredSources = useMemo(() => {
    const scopeAndSearchFiltered = filterSources(sources, activeScopePath, searchQuery);
    return scopeAndSearchFiltered.filter(s => sourceMatchesFilterExpression(s, filterGroups));
  }, [sources, activeScopePath, searchQuery, filterGroups]);

  const filteredVMs = useMemo(() => {
    let result = vms;
    if (vmSearchQuery) {
      const q = vmSearchQuery.toLowerCase();
      result = result.filter(vm => vm.name.toLowerCase().includes(q));
    }
    if (vmAppTypeFilter) {
      result = result.filter(vm => vm.appType === vmAppTypeFilter);
    }
    return result;
  }, [vms, vmSearchQuery, vmAppTypeFilter]);

  const hierarchyState: HierarchyState = useMemo(() => ({
    expandedPaths,
    activeScopePath,
    searchQuery,
  }), [expandedPaths, activeScopePath, searchQuery]);

  const isPathExpanded = useCallback((path: string[]) => expandedPaths.has(pathToKey(path)), [expandedPaths]);

  const toggleExpanded = useCallback((path: string[]) => {
    const key = pathToKey(path);
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpandedPaths(collectAllPaths(sources)), [sources]);
  const collapseAll = useCallback(() => setExpandedPaths(new Set()), []);

  const getVMsByAppType = useCallback((appType: AppType) => vms.filter(vm => vm.appType === appType), [vms]);
  const getAppsBySource = useCallback((sourceId: string) => apps.filter(app => app.sourceId === sourceId), [apps]);
  const getAppsByVM = useCallback((vmId: string) => apps.filter(app => app.vmId === vmId), [apps]);
  const getSourceById = useCallback((id: string) => sources.find(s => s.id === id), [sources]);
  const getVMById = useCallback((id: string) => vms.find(vm => vm.id === id), [vms]);

  const buildSourceApps = useCallback((sourceId: string, currentVms: VirtualMachine[]) => {
    const newApps: App[] = [];
    const newVms: VirtualMachine[] = [];

    APP_TYPES.forEach(appType => {
      const allVms = [...currentVms, ...newVms];
      const compatibleVMs = allVms.filter(vm => vm.appType === appType);
      let targetVmId: string | null = null;

      if (compatibleVMs.length > 0) {
        targetVmId = compatibleVMs[0].id;
      } else {
        const newVM: VirtualMachine = {
          id: generateId(),
          name: `${appType}-node-${String(currentVms.length + newVms.length + 1).padStart(2, '0')}`,
          appType,
          status: 'online',
          createdAt: new Date(),
        };
        newVms.push(newVM);
        targetVmId = newVM.id;
      }

      newApps.push({ id: generateId(), sourceId, type: appType, vmId: targetVmId, status: 'running' });
    });

    return { newApps, newVms };
  }, []);

  const createSource = useCallback((input: CreateSourceInput) => {
    const source: Source = { id: generateId(), ...input, createdAt: new Date() };
    const { newApps, newVms } = buildSourceApps(source.id, vms);

    setSources(prev => [...prev, source]);
    setVMs(prev => [...prev, ...newVms]);
    setApps(prev => [...prev, ...newApps]);

    for (let i = 1; i <= input.categoryPath.length; i++) {
      setExpandedPaths(prev => new Set([...prev, pathToKey(input.categoryPath.slice(0, i))]));
    }

    return { source, apps: newApps, newVms };
  }, [vms, buildSourceApps]);

  const createSources = useCallback((inputs: CreateSourceInput[]) => {
    const allNewSources: Source[] = [];
    const allNewApps: App[] = [];
    const allNewVms: VirtualMachine[] = [];
    let currentVms = [...vms];

    for (const input of inputs) {
      const source: Source = { id: generateId(), ...input, createdAt: new Date() };
      const { newApps, newVms } = buildSourceApps(source.id, currentVms);
      allNewSources.push(source);
      allNewApps.push(...newApps);
      allNewVms.push(...newVms);
      currentVms = [...currentVms, ...newVms];
    }

    setSources(prev => [...prev, ...allNewSources]);
    setVMs(prev => [...prev, ...allNewVms]);
    setApps(prev => [...prev, ...allNewApps]);

    const newPaths = new Set<string>();
    for (const source of allNewSources) {
      for (let i = 1; i <= source.categoryPath.length; i++) {
        newPaths.add(pathToKey(source.categoryPath.slice(0, i)));
      }
    }
    setExpandedPaths(prev => new Set([...prev, ...newPaths]));

    return { sources: allNewSources, apps: allNewApps, newVms: allNewVms };
  }, [vms, buildSourceApps]);

  const addVM = useCallback((name: string, appType: AppType) => {
    const vm: VirtualMachine = { id: generateId(), name, appType, status: 'online', createdAt: new Date() };
    setVMs(prev => [...prev, vm]);
    return vm;
  }, []);

  const deployApp = useCallback((sourceId: string, appType: AppType, vmId: string | null) => {
    const app: App = { id: generateId(), sourceId, type: appType, vmId, status: vmId ? 'running' : 'pending' };
    setApps(prev => [...prev, app]);
    return app;
  }, []);

  const removeApp = useCallback((appId: string) => {
    setApps(prev => prev.filter(app => app.id !== appId));
  }, []);

  const redeployApp = useCallback((appId: string, newVmId: string) => {
    setApps(prev => prev.map(app => app.id === appId ? { ...app, vmId: newVmId, status: 'running' as const } : app));
  }, []);

  const bulkDeployApp = useCallback((sourceIds: string[], appType: AppType, vmId: string | null) => {
    const status = vmId ? 'running' : 'pending';
    const newApps: App[] = sourceIds.map(sourceId => ({
      id: generateId(), sourceId, type: appType, vmId, status,
    }));
    setApps(prev => [...prev, ...newApps]);
  }, []);

  const redeployAllAppsOnVM = useCallback((vmId: string) => {
    setApps(prev => prev.map(app => app.vmId === vmId ? { ...app, status: 'running' as const } : app));
  }, []);

  const moveAllAppsToVM = useCallback((fromVmId: string, toVmId: string) => {
    setApps(prev => prev.map(app => app.vmId === fromVmId ? { ...app, vmId: toVmId, status: 'running' as const } : app));
  }, []);

  // Selection
  const toggleSourceSelection = useCallback((id: string) => {
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllFilteredSources = useCallback(() => {
    setSelectedSourceIds(new Set(filteredSources.map(s => s.id)));
  }, [filteredSources]);

  const clearSourceSelection = useCallback(() => setSelectedSourceIds(new Set()), []);

  return (
    <InfrastructureContext.Provider
      value={{
        sources, apps, vms,
        createSource, createSources, addVM,
        deployApp, removeApp, redeployApp, bulkDeployApp,
        redeployAllAppsOnVM, moveAllAppsToVM,
        getAppsBySource, getAppsByVM, getVMsByAppType, getSourceById, getVMById,
        categoryTree, hierarchyState, filteredSources,
        toggleExpanded, setActiveScopePath, setSearchQuery, expandAll, collapseAll, isPathExpanded,
        filterGroups, setFilterGroups,
        selectedSourceIds, toggleSourceSelection, selectAllFilteredSources, clearSourceSelection,
        vmSearchQuery, setVmSearchQuery, vmAppTypeFilter, setVmAppTypeFilter, filteredVMs,
      }}
    >
      {children}
    </InfrastructureContext.Provider>
  );
}

export function useInfrastructure() {
  const context = useContext(InfrastructureContext);
  if (!context) throw new Error('useInfrastructure must be used within InfrastructureProvider');
  return context;
}
