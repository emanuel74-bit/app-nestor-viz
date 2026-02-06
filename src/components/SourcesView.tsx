import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { SourceCard } from '@/components/SourceCard';
import { SourceGridCard } from '@/components/SourceGridCard';
import { Button } from '@/components/ui/button';
import { CreateSourceDialog } from '@/components/dialogs/CreateSourceDialog';
import { DeployAppDialog } from '@/components/dialogs/DeployAppDialog';
import { RedeployAppDialog } from '@/components/dialogs/RedeployAppDialog';
import { BulkCreateSourceDialog } from '@/components/dialogs/BulkCreateSourceDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Database, LayoutGrid, LayoutList, Rocket, CheckSquare, XSquare, Layers } from 'lucide-react';
import { App, AppType, APP_TYPES, Source } from '@/types/infrastructure';
import { toast } from 'sonner';

export function SourcesView() {
  const {
    filteredSources, hierarchyState, filterGroups,
    selectedSourceIds, selectAllFilteredSources, clearSourceSelection,
    bulkDeployApp, getVMsByAppType,
  } = useInfrastructure();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployLockedSourceId, setDeployLockedSourceId] = useState<string | null>(null);
  const [redeployApp, setRedeployApp] = useState<App | null>(null);
  const [cloneSource, setCloneSource] = useState<Source | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Bulk action state
  const [bulkAppType, setBulkAppType] = useState<AppType | ''>('');

  const hasSelection = selectedSourceIds.size > 0;
  const activeFilterCount = filterGroups.filter(g => g.conditions.some(c => c.value.trim())).length;

  const scopeDescription = hierarchyState.activeScopePath?.length
    ? `Showing sources in: ${hierarchyState.activeScopePath.join(' / ')}`
    : 'Showing all sources';
  const filterDescription = activeFilterCount > 0 ? ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : '';

  const handlePerSourceDeploy = (source: Source) => {
    setDeployLockedSourceId(source.id);
    setDeployDialogOpen(true);
  };

  const handleCloneSource = (source: Source) => {
    setCloneSource(source);
    setCreateDialogOpen(true);
  };

  const handleBulkDeploy = () => {
    if (!bulkAppType || selectedSourceIds.size === 0) return;
    bulkDeployApp(Array.from(selectedSourceIds), bulkAppType, null);
    toast.success('Bulk Deploy', { description: `Deployed ${bulkAppType} app to ${selectedSourceIds.size} sources.` });
    setBulkAppType('');
    clearSourceSelection();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopeDescription}{filterDescription}
            {hierarchyState.searchQuery && ` • Searching: "${hierarchyState.searchQuery}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-secondary/50 p-0.5 rounded-md">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 px-2">
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 px-2">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setBulkCreateDialogOpen(true)}>
            <Layers className="w-4 h-4 mr-2" />Bulk Create
          </Button>
          <Button onClick={() => { setCloneSource(null); setCreateDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />New Source
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {viewMode === 'grid' && (
        <div className="flex items-center gap-3 bg-secondary/30 border border-border/50 rounded-lg px-4 py-2">
          <Button variant="ghost" size="sm" onClick={selectAllFilteredSources} className="h-7 text-xs">
            <CheckSquare className="w-3.5 h-3.5 mr-1" />Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSourceSelection} className="h-7 text-xs" disabled={!hasSelection}>
            <XSquare className="w-3.5 h-3.5 mr-1" />Clear
          </Button>
          {hasSelection && (
            <>
              <span className="text-xs text-muted-foreground">{selectedSourceIds.size} selected</span>
              <div className="flex-1" />
              <Select value={bulkAppType} onValueChange={(v) => setBulkAppType(v as AppType)}>
                <SelectTrigger className="h-7 w-[120px] text-xs">
                  <SelectValue placeholder="App type..." />
                </SelectTrigger>
                <SelectContent>
                  {APP_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkDeploy} disabled={!bulkAppType} className="h-7 text-xs">
                <Rocket className="w-3 h-3 mr-1" />Deploy to selected
              </Button>
            </>
          )}
        </div>
      )}

      {/* Source list/grid */}
      {viewMode === 'list' ? (
        <div className="grid gap-4">
          {filteredSources.map(source => (
            <SourceCard
              key={source.id}
              source={source}
              onDeployApp={handlePerSourceDeploy}
              onCloneSource={handleCloneSource}
              onRedeployApp={setRedeployApp}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSources.map(source => (
            <SourceGridCard key={source.id} source={source} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredSources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/50 rounded-lg">
          <Database className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {hierarchyState.searchQuery || hierarchyState.activeScopePath || activeFilterCount > 0
              ? 'No sources match your current filters.'
              : 'No sources created yet. Create a source to start deploying applications.'}
          </p>
          {!hierarchyState.searchQuery && !hierarchyState.activeScopePath && activeFilterCount === 0 && (
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Create First Source
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateSourceDialog
        open={createDialogOpen}
        onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) setCloneSource(null); }}
        defaultCategoryPath={hierarchyState.activeScopePath || []}
        cloneFrom={cloneSource}
      />
      <DeployAppDialog
        open={deployDialogOpen}
        onOpenChange={(open) => { setDeployDialogOpen(open); if (!open) setDeployLockedSourceId(null); }}
        lockedSourceId={deployLockedSourceId}
      />
      {redeployApp && (
        <RedeployAppDialog
          open={!!redeployApp}
          onOpenChange={(open) => !open && setRedeployApp(null)}
          app={redeployApp}
        />
      )}
      <BulkCreateSourceDialog
        open={bulkCreateDialogOpen}
        onOpenChange={setBulkCreateDialogOpen}
      />
    </div>
  );
}
