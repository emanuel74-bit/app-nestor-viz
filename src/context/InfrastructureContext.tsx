import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Source, App, VirtualMachine, AppType, APP_TYPES, CategoryNode, SourceProperties } from '@/types/infrastructure';
import { buildCategoryTree, filterSources, pathToKey } from '@/lib/hierarchy';

interface InfrastructureState {
  sources: Source[];
  apps: App[];
  vms: VirtualMachine[];
}

interface HierarchyState {
  expandedPaths: Set<string>;
  activeScopePath: string[] | null;
  searchQuery: string;
}

interface InfrastructureContextType extends InfrastructureState {
  // CRUD operations
  createSource: (name: string, categoryPath: string[], properties?: SourceProperties) => { source: Source; apps: App[]; newVms: VirtualMachine[] };
  addVM: (name: string, appType: AppType) => VirtualMachine;
  deployApp: (sourceId: string, appType: AppType, vmId: string) => App;
  removeApp: (appId: string) => void;
  redeployApp: (appId: string, newVmId: string) => void;
  
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
}

const InfrastructureContext = createContext<InfrastructureContextType | null>(null);

const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial demo data with category paths
const initialSources: Source[] = [
  { 
    id: 'src-1', 
    name: 'Acme Corp', 
    categoryPath: ['enterprise', 'us-east', 'production'],
    properties: { environment: 'prod', region: 'us-east-1', team: 'platform' },
    createdAt: new Date('2024-01-15') 
  },
  { 
    id: 'src-2', 
    name: 'TechStart Inc', 
    categoryPath: ['enterprise', 'us-east', 'staging'],
    properties: { environment: 'staging', region: 'us-east-1', team: 'devops' },
    createdAt: new Date('2024-02-20') 
  },
  { 
    id: 'src-3', 
    name: 'GlobalBank', 
    categoryPath: ['enterprise', 'eu-west', 'production'],
    properties: { environment: 'prod', region: 'eu-west-1', team: 'payments' },
    createdAt: new Date('2024-03-10') 
  },
  { 
    id: 'src-4', 
    name: 'HealthPlus', 
    categoryPath: ['healthcare', 'us-west', 'production'],
    properties: { environment: 'prod', region: 'us-west-2', team: 'medical' },
    createdAt: new Date('2024-03-15') 
  },
  { 
    id: 'src-5', 
    name: 'RetailMax', 
    categoryPath: ['retail', 'eu-central', 'production'],
    properties: { environment: 'prod', region: 'eu-central-1', team: 'commerce' },
    createdAt: new Date('2024-04-01') 
  },
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

// Collect all paths for initial expanded state
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

  // Memoized category tree
  const categoryTree = useMemo(() => buildCategoryTree(sources), [sources]);

  // Memoized filtered sources
  const filteredSources = useMemo(
    () => filterSources(sources, activeScopePath, searchQuery),
    [sources, activeScopePath, searchQuery]
  );

  const hierarchyState: HierarchyState = useMemo(() => ({
    expandedPaths,
    activeScopePath,
    searchQuery,
  }), [expandedPaths, activeScopePath, searchQuery]);

  const isPathExpanded = useCallback((path: string[]) => {
    return expandedPaths.has(pathToKey(path));
  }, [expandedPaths]);

  const toggleExpanded = useCallback((path: string[]) => {
    const key = pathToKey(path);
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedPaths(collectAllPaths(sources));
  }, [sources]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const getVMsByAppType = useCallback((appType: AppType) => {
    return vms.filter(vm => vm.appType === appType);
  }, [vms]);

  const getAppsBySource = useCallback((sourceId: string) => {
    return apps.filter(app => app.sourceId === sourceId);
  }, [apps]);

  const getAppsByVM = useCallback((vmId: string) => {
    return apps.filter(app => app.vmId === vmId);
  }, [apps]);

  const getSourceById = useCallback((id: string) => {
    return sources.find(s => s.id === id);
  }, [sources]);

  const getVMById = useCallback((id: string) => {
    return vms.find(vm => vm.id === id);
  }, [vms]);

  const createSource = useCallback((name: string, categoryPath: string[] = [], properties: SourceProperties = {}) => {
    const source: Source = {
      id: generateId(),
      name,
      categoryPath,
      properties,
      createdAt: new Date(),
    };

    const newApps: App[] = [];
    const newVms: VirtualMachine[] = [];

    // Create apps for all types
    APP_TYPES.forEach(appType => {
      const compatibleVMs = vms.filter(vm => vm.appType === appType);
      let targetVmId: string | null = null;

      if (compatibleVMs.length > 0) {
        targetVmId = compatibleVMs[0].id;
      } else {
        // Create new VM for this app type
        const newVM: VirtualMachine = {
          id: generateId(),
          name: `${appType}-node-${String(vms.length + newVms.length + 1).padStart(2, '0')}`,
          appType,
          status: 'online',
          createdAt: new Date(),
        };
        newVms.push(newVM);
        targetVmId = newVM.id;
      }

      newApps.push({
        id: generateId(),
        sourceId: source.id,
        type: appType,
        vmId: targetVmId,
        status: 'running',
      });
    });

    setSources(prev => [...prev, source]);
    setVMs(prev => [...prev, ...newVms]);
    setApps(prev => [...prev, ...newApps]);

    // Expand the new path
    for (let i = 1; i <= categoryPath.length; i++) {
      const pathKey = pathToKey(categoryPath.slice(0, i));
      setExpandedPaths(prev => new Set([...prev, pathKey]));
    }

    return { source, apps: newApps, newVms };
  }, [vms]);

  const addVM = useCallback((name: string, appType: AppType) => {
    const vm: VirtualMachine = {
      id: generateId(),
      name,
      appType,
      status: 'online',
      createdAt: new Date(),
    };
    setVMs(prev => [...prev, vm]);
    return vm;
  }, []);

  const deployApp = useCallback((sourceId: string, appType: AppType, vmId: string) => {
    const app: App = {
      id: generateId(),
      sourceId,
      type: appType,
      vmId,
      status: 'running',
    };
    setApps(prev => [...prev, app]);
    return app;
  }, []);

  const removeApp = useCallback((appId: string) => {
    setApps(prev => prev.filter(app => app.id !== appId));
  }, []);

  const redeployApp = useCallback((appId: string, newVmId: string) => {
    setApps(prev =>
      prev.map(app =>
        app.id === appId ? { ...app, vmId: newVmId, status: 'running' as const } : app
      )
    );
  }, []);

  return (
    <InfrastructureContext.Provider
      value={{
        sources,
        apps,
        vms,
        createSource,
        addVM,
        deployApp,
        removeApp,
        redeployApp,
        getAppsBySource,
        getAppsByVM,
        getVMsByAppType,
        getSourceById,
        getVMById,
        // Hierarchy
        categoryTree,
        hierarchyState,
        filteredSources,
        toggleExpanded,
        setActiveScopePath,
        setSearchQuery,
        expandAll,
        collapseAll,
        isPathExpanded,
      }}
    >
      {children}
    </InfrastructureContext.Provider>
  );
}

export function useInfrastructure() {
  const context = useContext(InfrastructureContext);
  if (!context) {
    throw new Error('useInfrastructure must be used within InfrastructureProvider');
  }
  return context;
}
