import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSourceDialog } from '@/components/dialogs/CreateSourceDialog';
import { DeployAppDialog } from '@/components/dialogs/DeployAppDialog';
import { RedeployAppDialog } from '@/components/dialogs/RedeployAppDialog';
import { Plus, Server, Trash2, RefreshCw, Database, FolderTree } from 'lucide-react';
import { App } from '@/types/infrastructure';
import { pathToKey } from '@/lib/hierarchy';

export function SourcesView() {
  const { 
    filteredSources, 
    getAppsBySource, 
    getVMById, 
    removeApp,
    hierarchyState,
  } = useInfrastructure();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [redeployApp, setRedeployApp] = useState<App | null>(null);

  const handleRemoveApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      removeApp(appId);
    }
  };

  const scopeDescription = hierarchyState.activeScopePath?.length 
    ? `Showing sources in: ${hierarchyState.activeScopePath.join(' / ')}`
    : 'Showing all sources';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopeDescription}
            {hierarchyState.searchQuery && ` • Searching: "${hierarchyState.searchQuery}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeployDialogOpen(true)}>
            <Server className="w-4 h-4 mr-2" />
            Deploy App
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Source
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSources.map((source) => {
          const apps = getAppsBySource(source.id);
          
          return (
            <Card key={source.id} className="bg-gradient-card border-border/50 animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        {source.categoryPath.length > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FolderTree className="w-3 h-3" />
                            {source.categoryPath.join(' / ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Created {source.createdAt.toLocaleDateString()}
                    </div>
                    {Object.keys(source.properties).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-end">
                        {Object.entries(source.properties).slice(0, 3).map(([key, value]) => (
                          <span 
                            key={key} 
                            className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded font-mono"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                  Deployed Apps ({apps.length})
                </div>
                <div className="grid gap-2">
                  {apps.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No apps deployed for this source
                    </p>
                  ) : (
                    apps.map((app) => {
                      const vm = app.vmId ? getVMById(app.vmId) : null;
                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div className="flex items-center gap-4">
                            <AppTypeBadge type={app.type} />
                            <StatusIndicator status={app.status} />
                            {vm && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5" />
                                <span className="font-mono">{vm.name}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRedeployApp(app)}
                              className="h-8 w-8 p-0"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveApp(app.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredSources.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {hierarchyState.searchQuery || hierarchyState.activeScopePath 
                  ? 'No sources match your current filters.'
                  : 'No sources created yet.'}
                <br />
                {!hierarchyState.searchQuery && !hierarchyState.activeScopePath && 
                  'Create a source to start deploying applications.'}
              </p>
              {!hierarchyState.searchQuery && !hierarchyState.activeScopePath && (
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Source
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateSourceDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        defaultCategoryPath={hierarchyState.activeScopePath || []}
      />
      <DeployAppDialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen} />
      {redeployApp && (
        <RedeployAppDialog
          open={!!redeployApp}
          onOpenChange={(open) => !open && setRedeployApp(null)}
          app={redeployApp}
        />
      )}
    </div>
  );
}
