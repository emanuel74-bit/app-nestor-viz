import React, { createContext, useContext, useState, useCallback } from 'react';
import { Source, App, VirtualMachine, AppType, APP_TYPES } from '@/types/infrastructure';

interface InfrastructureState {
  sources: Source[];
  apps: App[];
  vms: VirtualMachine[];
}

interface InfrastructureContextType extends InfrastructureState {
  createSource: (name: string) => { source: Source; apps: App[]; newVms: VirtualMachine[] };
  addVM: (name: string, appType: AppType) => VirtualMachine;
  deployApp: (sourceId: string, appType: AppType, vmId: string) => App;
  removeApp: (appId: string) => void;
  redeployApp: (appId: string, newVmId: string) => void;
  getAppsBySource: (sourceId: string) => App[];
  getAppsByVM: (vmId: string) => App[];
  getVMsByAppType: (appType: AppType) => VirtualMachine[];
  getSourceById: (id: string) => Source | undefined;
  getVMById: (id: string) => VirtualMachine | undefined;
}

const InfrastructureContext = createContext<InfrastructureContextType | null>(null);

const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial demo data
const initialSources: Source[] = [
  { id: 'src-1', name: 'Acme Corp', createdAt: new Date('2024-01-15') },
  { id: 'src-2', name: 'TechStart Inc', createdAt: new Date('2024-02-20') },
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
];

export function InfrastructureProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [apps, setApps] = useState<App[]>(initialApps);
  const [vms, setVMs] = useState<VirtualMachine[]>(initialVMs);

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

  const createSource = useCallback((name: string) => {
    const source: Source = {
      id: generateId(),
      name,
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
