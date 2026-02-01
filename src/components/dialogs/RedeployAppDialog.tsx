import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { App } from '@/types/infrastructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { toast } from 'sonner';

interface RedeployAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: App;
}

export function RedeployAppDialog({ open, onOpenChange, app }: RedeployAppDialogProps) {
  const [vmId, setVmId] = useState(app.vmId || '');
  const { redeployApp, getVMsByAppType, getSourceById, getVMById } = useInfrastructure();

  const compatibleVMs = getVMsByAppType(app.type);
  const source = getSourceById(app.sourceId);
  const currentVM = app.vmId ? getVMById(app.vmId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmId || vmId === app.vmId) return;

    redeployApp(app.id, vmId);
    
    const newVM = getVMById(vmId);
    toast.success('App Redeployed', {
      description: `${app.type} app moved from "${currentVM?.name}" to "${newVM?.name}".`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeploy App</DialogTitle>
          <DialogDescription>
            Move this app to a different compatible VM
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium">{source?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">App Type</span>
                <AppTypeBadge type={app.type} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current VM</span>
                <span className="text-sm font-mono">{currentVM?.name || 'None'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-vm">New Target VM</Label>
              <Select value={vmId} onValueChange={setVmId}>
                <SelectTrigger id="new-vm">
                  <SelectValue placeholder="Select VM" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleVMs.map((vm) => (
                    <SelectItem 
                      key={vm.id} 
                      value={vm.id} 
                      className="font-mono"
                      disabled={vm.id === app.vmId}
                    >
                      {vm.name} {vm.id === app.vmId && '(current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!vmId || vmId === app.vmId}>
              Redeploy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
