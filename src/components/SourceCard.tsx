import { useState, useCallback } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Source, App, SOURCE_EDITABLE_FIELDS } from '@/types/infrastructure';
import { Server, Trash2, RefreshCw, Database, FolderTree, Clock, Rocket, Copy, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface SourceCardProps {
  source: Source;
  onDeployApp: (source: Source) => void;
  onCloneSource: (source: Source) => void;
  onRedeployApp: (app: App) => void;
}

export function SourceCard({ source, onDeployApp, onCloneSource, onRedeployApp }: SourceCardProps) {
  const { getAppsBySource, getVMById, removeApp, updateSource } = useInfrastructure();
  const apps = getAppsBySource(source.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const startEditing = useCallback(() => {
    setDraft({
      name: source.name,
      categoryPath: source.categoryPath.join('/'),
      environment: source.environment,
      region: source.region,
      team: source.team,
    });
    setEditing(true);
  }, [source]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setDraft({});
  }, []);

  const saveEditing = useCallback(() => {
    const name = draft.name?.trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    updateSource(source.id, {
      name,
      categoryPath: (draft.categoryPath || '').split('/').map(s => s.trim()).filter(Boolean),
      environment: draft.environment || '',
      region: draft.region || '',
      team: draft.team || '',
    });
    setEditing(false);
    setDraft({});
    toast.success('Source updated');
  }, [draft, source.id, updateSource]);

  const handleRemoveApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      removeApp(appId);
    }
  };

  const editableFields = SOURCE_EDITABLE_FIELDS.filter(f => f.key !== 'id' && f.key !== 'createdAt');

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <Input
                  value={draft.name || ''}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="h-8 text-lg font-semibold"
                  autoFocus
                />
              ) : (
                <CardTitle className="text-lg truncate">{source.name}</CardTitle>
              )}
              {!editing && source.categoryPath.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <FolderTree className="w-3 h-3 shrink-0" />
                  <span className="truncate">{source.categoryPath.join(' / ')}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-8 w-8 p-0" title="Cancel">
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="default" size="sm" onClick={saveEditing} className="h-8 gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={startEditing} className="h-8 w-8 p-0" title="Edit source">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onCloneSource(source)} className="h-8 w-8 p-0" title="Clone source">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDeployApp(source)} className="h-8 gap-1.5">
                  <Rocket className="w-3.5 h-3.5" />
                  Deploy
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Source fields - inline editable */}
        <div className="mt-3 pt-3 border-t border-border/30">
          {editing ? (
            <div className="grid grid-cols-2 gap-2">
              {editableFields.filter(f => f.key !== 'name').map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                  <Input
                    value={draft[field.key] || ''}
                    onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'environment', label: 'Env', value: source.environment },
                { key: 'region', label: 'Region', value: source.region },
                { key: 'team', label: 'Team', value: source.team },
              ].map(({ key, label, value }) =>
                value ? (
                  <div key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary/60 border border-border/50">
                    <span className="font-medium text-foreground">{label}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ) : null
              )}
            </div>
          )}
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
