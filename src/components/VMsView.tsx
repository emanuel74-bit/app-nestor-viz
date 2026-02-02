import { useState, useMemo } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddVMDialog } from '@/components/dialogs/AddVMDialog';
import { Plus, HardDrive, Box, FolderTree } from 'lucide-react';

export function VMsView() {
  const { vms, apps, getAppsByVM, getSourceById, filteredSources, hierarchyState } = useInfrastructure();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Filter VMs to only show those with apps from filtered sources (when scope is active)
  const filteredSourceIds = useMemo(() => 
    new Set(filteredSources.map(s => s.id)), 
    [filteredSources]
  );

  const scopeDescription = hierarchyState.activeScopePath?.length 
    ? `Showing VMs with apps from: ${hierarchyState.activeScopePath.join(' / ')}`
    : 'Showing all virtual machines';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Virtual Machines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopeDescription}
            {hierarchyState.searchQuery && ` • Searching: "${hierarchyState.searchQuery}"`}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add VM
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vms.map((vm) => {
          const allVmApps = getAppsByVM(vm.id);
          
          // Filter apps based on source scope
          const scopedApps = hierarchyState.activeScopePath || hierarchyState.searchQuery
            ? allVmApps.filter(app => filteredSourceIds.has(app.sourceId))
            : allVmApps;
          
          // If scope is active and no matching apps, dim this VM
          const hasMatchingApps = scopedApps.length > 0;
          const isScoped = hierarchyState.activeScopePath || hierarchyState.searchQuery;
          
          return (
            <Card 
              key={vm.id} 
              className={`bg-gradient-card border-border/50 animate-fade-in transition-opacity ${
                isScoped && !hasMatchingApps ? 'opacity-40' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-mono">{vm.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIndicator status={vm.status} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    App Type
                  </span>
                  <AppTypeBadge type={vm.appType} />
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                    {isScoped ? `Matching Apps (${scopedApps.length}/${allVmApps.length})` : `Running Apps (${allVmApps.length})`}
                  </div>
                  <div className="space-y-2">
                    {(isScoped ? scopedApps : allVmApps).length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center bg-secondary/30 rounded-md">
                        {isScoped ? 'No matching apps' : 'No apps deployed'}
                      </p>
                    ) : (
                      (isScoped ? scopedApps : allVmApps).map((app) => {
                        const source = getSourceById(app.sourceId);
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate">
                                  {source?.name || 'Unknown'}
                                </span>
                              </div>
                              {source?.categoryPath && source.categoryPath.length > 0 && (
                                <div className="flex items-center gap-1 ml-5.5 mt-0.5">
                                  <FolderTree className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {source.categoryPath.join(' / ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <StatusIndicator status={app.status} showLabel={false} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {vms.length === 0 && (
          <Card className="border-dashed md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardDrive className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No virtual machines available.
                <br />
                Add a VM to start deploying applications.
              </p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First VM
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddVMDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
