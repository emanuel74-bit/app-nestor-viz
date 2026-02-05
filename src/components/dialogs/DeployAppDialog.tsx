import { useState } from 'react';
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
}

export function DeployAppDialog({ open, onOpenChange }: DeployAppDialogProps) {
  const [sourceId, setSourceId] = useState('');
  const [appType, setAppType] = useState<AppType | ''>('');
  const [vmId, setVmId] = useState('');
  const { filteredSources, sources, deployApp, getVMsByAppType } = useInfrastructure();

  // Show filtered sources in dropdown, but allow deploying to any source
  const displayedSources = filteredSources.length > 0 ? filteredSources : sources;
  const compatibleVMs = appType ? getVMsByAppType(appType) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !appType) return;

    deployApp(sourceId, appType, vmId || null);
    
    const source = sources.find(s => s.id === sourceId);
    const deploymentMessage = vmId 
      ? `${appType} app for "${source?.name}" has been deployed to selected VM.`
      : `${appType} app for "${source?.name}" has been queued for automatic placement.`;
    
    toast.success('App Deployed', {
      description: deploymentMessage,
    });

    setSourceId('');
    setAppType('');
    setVmId('');
    onOpenChange(false);
  };

  const handleAppTypeChange = (type: AppType) => {
    setAppType(type);
    setVmId(''); // Reset VM selection when app type changes
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
              <Label htmlFor="source">Source</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {displayedSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      <div className="flex flex-col">
                        <span>{source.name}</span>
                        {source.categoryPath.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {source.categoryPath.join(' / ')}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-type">App Type</Label>
              <Select value={appType} onValueChange={(v) => handleAppTypeChange(v as AppType)}>
                <SelectTrigger id="app-type">
                  <SelectValue placeholder="Select app type" />
                </SelectTrigger>
                <SelectContent>
                  {APP_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vm">Target VM <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={vmId} onValueChange={setVmId} disabled={!appType}>
                <SelectTrigger id="vm">
                  <SelectValue placeholder={appType ? "Auto-assign (or select VM)" : "Select app type first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-muted-foreground">
                    Auto-assign to available VM
                  </SelectItem>
                  {compatibleVMs.map((vm) => (
                    <SelectItem key={vm.id} value={vm.id} className="font-mono">
                      {vm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appType && compatibleVMs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No VMs available for {appType} apps. App will be queued for placement.
                </p>
              )}
              {vmId === '' && appType && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to queue for automatic VM assignment.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!sourceId || !appType}>
              {vmId && vmId !== 'auto' ? 'Deploy' : 'Queue for Deployment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
