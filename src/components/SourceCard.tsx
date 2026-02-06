import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { SourceFieldsDisplay } from '@/components/SourceFieldsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Source, App } from '@/types/infrastructure';
import { Server, Trash2, RefreshCw, Database, FolderTree, Clock, Rocket, Copy } from 'lucide-react';

interface SourceCardProps {
  source: Source;
  onDeployApp: (source: Source) => void;
  onCloneSource: (source: Source) => void;
  onRedeployApp: (app: App) => void;
}

export function SourceCard({ source, onDeployApp, onCloneSource, onRedeployApp }: SourceCardProps) {
  const { getAppsBySource, getVMById, removeApp } = useInfrastructure();
  const apps = getAppsBySource(source.id);

  const handleRemoveApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      removeApp(appId);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{source.name}</CardTitle>
              {source.categoryPath.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <FolderTree className="w-3 h-3 shrink-0" />
                  <span className="truncate">{source.categoryPath.join(' / ')}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onCloneSource(source)} className="h-8 w-8 p-0" title="Clone source">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDeployApp(source)} className="h-8 gap-1.5">
              <Rocket className="w-3.5 h-3.5" />
              Deploy
            </Button>
          </div>
        </div>

        {/* Source fields */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <SourceFieldsDisplay source={source} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
          Deployed Apps ({apps.length})
        </div>
        <div className="grid gap-2">
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No apps deployed for this source</p>
          ) : (
            apps.map((app) => {
              const vm = app.vmId ? getVMById(app.vmId) : null;
              const isPending = app.status === 'pending' || !app.vmId;
              return (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <AppTypeBadge type={app.type} />
                    <StatusIndicator status={app.status} />
                    {vm ? (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" />
                        <span className="font-mono">{vm.name}</span>
                      </span>
                    ) : isPending && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="italic">Awaiting placement</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onRedeployApp(app)} className="h-8 w-8 p-0">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveApp(app.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
}
