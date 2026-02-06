import { useState, useEffect } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppType, APP_TYPES } from '@/types/infrastructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface DeployAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockedSourceId?: string | null;
}

export function DeployAppDialog({ open, onOpenChange, lockedSourceId }: DeployAppDialogProps) {
  const [sourceId, setSourceId] = useState('');
  const [appType, setAppType] = useState<AppType | ''>('');
  const [vmId, setVmId] = useState('');
  const { filteredSources, sources, deployApp, getVMsByAppType, getSourceById } = useInfrastructure();

  useEffect(() => {
    if (lockedSourceId) setSourceId(lockedSourceId);
  }, [lockedSourceId, open]);

  const displayedSources = filteredSources.length > 0 ? filteredSources : sources;
  const compatibleVMs = appType ? getVMsByAppType(appType) : [];
  const isSourceLocked = !!lockedSourceId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !appType) return;

    deployApp(sourceId, appType, vmId || null);

    const source = getSourceById(sourceId);
    const msg = vmId
      ? `${appType} app for "${source?.name}" deployed to selected VM.`
      : `${appType} app for "${source?.name}" queued for automatic placement.`;

    toast.success('App Deployed', { description: msg });
    setSourceId('');
    setAppType('');
    setVmId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy App</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Source</Label>
              {isSourceLocked ? (
                <div className="px-3 py-2 rounded-md bg-secondary/30 border border-border/50 text-sm font-medium">
                  {getSourceById(sourceId)?.name || sourceId}
                </div>
              ) : (
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {displayedSources.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <span>{s.name}</span>
                        {s.categoryPath.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">{s.categoryPath.join(' / ')}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>App Type</Label>
              <Select value={appType} onValueChange={(v) => { setAppType(v as AppType); setVmId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select app type" /></SelectTrigger>
                <SelectContent>
                  {APP_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target VM <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={vmId} onValueChange={setVmId} disabled={!appType}>
                <SelectTrigger>
                  <SelectValue placeholder={appType ? "Auto-assign (or select VM)" : "Select app type first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-muted-foreground">Auto-assign</SelectItem>
                  {compatibleVMs.map(vm => (
                    <SelectItem key={vm.id} value={vm.id} className="font-mono">{vm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vmId === '' && appType && (
                <p className="text-xs text-muted-foreground">Leave empty for automatic VM assignment.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!sourceId || !appType}>
              {vmId && vmId !== 'auto' ? 'Deploy' : 'Queue for Deployment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
