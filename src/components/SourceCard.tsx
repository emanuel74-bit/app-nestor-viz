import { useState, useCallback, useMemo } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Source, App, CreateSourceInput } from '@/types/infrastructure';
import { Server, Trash2, RefreshCw, Database, FolderTree, Clock, Rocket, Copy, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SourceCardProps {
  source: Source;
  onDeployApp: (source: Source) => void;
  onCloneSource: (source: Source) => void;
  onRedeployApp: (app: App) => void;
}

/** Dynamically derive displayable fields from a Source object */
function getSourceFields(source: Source) {
  const exclude = new Set(['id']);
  return Object.entries(source)
    .filter(([key]) => !exclude.has(key))
    .map(([key, value]) => ({
      key,
      label: key === 'categoryPath' ? 'Category' : key === 'createdAt' ? 'Created' : key.charAt(0).toUpperCase() + key.slice(1),
      value,
      editable: key !== 'createdAt',
    }));
}

function formatFieldValue(key: string, value: unknown): string {
  if (value instanceof Date) return value.toLocaleDateString();
  if (Array.isArray(value)) return value.join(' / ');
  return String(value ?? '');
}

function fieldToDraftValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.join('/');
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value ?? '');
}

export function SourceCard({ source, onDeployApp, onCloneSource, onRedeployApp }: SourceCardProps) {
  const { getAppsBySource, getVMById, removeApp, updateSource } = useInfrastructure();
  const apps = getAppsBySource(source.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const fields = useMemo(() => getSourceFields(source), [source]);

  const startEditing = useCallback(() => {
    const d: Record<string, string> = {};
    for (const f of fields) {
      if (f.editable) d[f.key] = fieldToDraftValue(f.key, f.value);
    }
    setDraft(d);
    setEditing(true);
  }, [fields]);

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
    const updates: Partial<CreateSourceInput> = {
      name,
      categoryPath: (draft.categoryPath || '').split('/').map(s => s.trim()).filter(Boolean),
      environment: draft.environment || '',
      region: draft.region || '',
      team: draft.team || '',
    };
    updateSource(source.id, updates);
    setEditing(false);
    setDraft({});
    toast.success('Source updated');
  }, [draft, source.id, updateSource]);

  const handleRemoveApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this app?')) {
      removeApp(appId);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Database className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">{source.name}</h3>
              {source.categoryPath.length > 0 && (
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
      </CardHeader>

      {/* Body: Apps (left) + Attributes Panel (right) */}
      <CardContent className="pt-0">
        <div className="flex gap-4 min-h-[120px]">
          {/* Left — Apps section */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
              Deployed Apps ({apps.length})
            </div>
            <div className="grid gap-2">
              {apps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/40 rounded-lg">
                  No apps deployed
                </p>
              ) : (
                apps.map((app) => {
                  const vm = app.vmId ? getVMById(app.vmId) : null;
                  const isPending = app.status === 'pending' || !app.vmId;
                  return (
                    <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <AppTypeBadge type={app.type} />
                        <StatusIndicator status={app.status} />
                        {vm ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Server className="w-3 h-3" />
                            <span className="font-mono">{vm.name}</span>
                          </span>
                        ) : isPending && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span className="italic">Awaiting placement</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => onRedeployApp(app)} className="h-7 w-7 p-0">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveApp(app.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — Attributes Panel */}
          <div className="w-56 shrink-0 border-l border-border/40 pl-4">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
              Attributes
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-0">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-start justify-between gap-2 py-1.5 border-b border-border/20 last:border-0"
                  >
                    {editing && field.editable ? (
                      <div className="w-full space-y-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground">{field.label}</span>
                        <Input
                          value={draft[field.key] || ''}
                          onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{field.label}</span>
                        <span className="text-xs text-foreground text-right truncate max-w-[120px]" title={formatFieldValue(field.key, field.value)}>
                          {formatFieldValue(field.key, field.value)}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
