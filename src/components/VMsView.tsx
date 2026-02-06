import { useState, useMemo } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddVMDialog } from '@/components/dialogs/AddVMDialog';
import { Plus, HardDrive, Box, FolderTree, Search, X, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { APP_TYPES, AppType } from '@/types/infrastructure';
import { toast } from 'sonner';

export function VMsView() {
  const {
    vms, filteredVMs, filteredSources, getAppsByVM, getSourceById,
    hierarchyState, vmSearchQuery, setVmSearchQuery, vmAppTypeFilter, setVmAppTypeFilter,
    redeployAllAppsOnVM, moveAllAppsToVM,
  } = useInfrastructure();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [moveFromVmId, setMoveFromVmId] = useState<string | null>(null);
  const [moveToVmId, setMoveToVmId] = useState('');

  const filteredSourceIds = useMemo(() => new Set(filteredSources.map(s => s.id)), [filteredSources]);

  const scopeDescription = hierarchyState.activeScopePath?.length
    ? `Showing VMs with apps from: ${hierarchyState.activeScopePath.join(' / ')}`
    : 'Showing all virtual machines';

  const handleMoveAll = (fromVmId: string) => {
    if (!moveToVmId) return;
    moveAllAppsToVM(fromVmId, moveToVmId);
    toast.success('Apps Moved', { description: `All apps moved to target VM.` });
    setMoveFromVmId(null);
    setMoveToVmId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Virtual Machines</h1>
          <p className="text-muted-foreground text-sm mt-1">{scopeDescription}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Add VM
        </Button>
      </div>

      {/* VM Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search VMs by name..."
            value={vmSearchQuery}
            onChange={(e) => setVmSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9"
          />
          {vmSearchQuery && (
            <button onClick={() => setVmSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={vmAppTypeFilter || 'all'} onValueChange={(v) => setVmAppTypeFilter(v === 'all' ? null : v as AppType)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {APP_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVMs.map((vm) => {
          const allVmApps = getAppsByVM(vm.id);
          const isScoped = !!hierarchyState.activeScopePath || !!hierarchyState.searchQuery;
          const scopedApps = isScoped ? allVmApps.filter(app => filteredSourceIds.has(app.sourceId)) : allVmApps;
          const hasMatchingApps = scopedApps.length > 0;
          const compatibleVMs = vms.filter(v => v.appType === vm.appType && v.id !== vm.id);

          return (
            <Card key={vm.id} className={`bg-gradient-card border-border/50 animate-fade-in transition-opacity ${isScoped && !hasMatchingApps ? 'opacity-40' : ''}`}>
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
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">App Type</span>
                  <AppTypeBadge type={vm.appType} />
                </div>

                {/* Bulk VM actions */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => { redeployAllAppsOnVM(vm.id); toast.success('All apps restarted on ' + vm.name); }} className="h-7 text-xs flex-1">
                    <RefreshCw className="w-3 h-3 mr-1" />Restart all
                  </Button>
                  {compatibleVMs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMoveFromVmId(moveFromVmId === vm.id ? null : vm.id)}
                      className="h-7 text-xs flex-1"
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />Move all
                    </Button>
                  )}
                </div>

                {/* Move target selector */}
                {moveFromVmId === vm.id && (
                  <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                    <Select value={moveToVmId} onValueChange={setMoveToVmId}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Target VM..." />
                      </SelectTrigger>
                      <SelectContent>
                        {compatibleVMs.map(v => (
                          <SelectItem key={v.id} value={v.id} className="text-xs font-mono">{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleMoveAll(vm.id)} disabled={!moveToVmId} className="h-7 text-xs">
                      Move
                    </Button>
                  </div>
                )}

                {/* App list */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                    {isScoped ? `Matching Apps (${scopedApps.length}/${allVmApps.length})` : `Apps (${allVmApps.length})`}
                  </div>
                  <div className="space-y-2">
                    {(isScoped ? scopedApps : allVmApps).length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center bg-secondary/30 rounded-md">
                        {isScoped ? 'No matching apps' : 'No apps deployed'}
                      </p>
                    ) : (
                      (isScoped ? scopedApps : allVmApps).map(app => {
                        const source = getSourceById(app.sourceId);
                        return (
                          <div key={app.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/50">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate">{source?.name || 'Unknown'}</span>
                              </div>
                              {source?.categoryPath && source.categoryPath.length > 0 && (
                                <div className="flex items-center gap-1 ml-5.5 mt-0.5">
                                  <FolderTree className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">{source.categoryPath.join(' / ')}</span>
                                </div>
                              )}
                            </div>
                            <StatusIndicator status={app.status} />
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

        {filteredVMs.length === 0 && (
          <Card className="border-dashed md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardDrive className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {vmSearchQuery || vmAppTypeFilter ? 'No VMs match your filters.' : 'No virtual machines available.'}
              </p>
              {!vmSearchQuery && !vmAppTypeFilter && (
                <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Add First VM
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AddVMDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
