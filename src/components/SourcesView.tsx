import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSourceDialog } from '@/components/dialogs/CreateSourceDialog';
import { DeployAppDialog } from '@/components/dialogs/DeployAppDialog';
import { RedeployAppDialog } from '@/components/dialogs/RedeployAppDialog';
import { Plus, Server, Trash2, RefreshCw, Database } from 'lucide-react';
import { App } from '@/types/infrastructure';

export function SourcesView() {
  const { sources, getAppsBySource, getVMById, removeApp } = useInfrastructure();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [redeployApp, setRedeployApp] = useState<App | null>(null);

  const handleRemoveApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      removeApp(appId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage data sources and their deployed applications
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
        {sources.map((source) => {
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
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        ID: {source.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {source.createdAt.toLocaleDateString()}
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

        {sources.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No sources created yet.
                <br />
                Create a source to start deploying applications.
              </p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Source
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateSourceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
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
