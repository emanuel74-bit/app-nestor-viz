import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppType, APP_TYPES } from '@/types/infrastructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddVMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVMDialog({ open, onOpenChange }: AddVMDialogProps) {
  const [name, setName] = useState('');
  const [appType, setAppType] = useState<AppType | ''>('');
  const { addVM } = useInfrastructure();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !appType) return;

    const vm = addVM(name.trim(), appType);
    
    toast.success('VM Added', {
      description: `Virtual machine "${vm.name}" is now online and ready to host ${appType} apps.`,
    });

    setName('');
    setAppType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Virtual Machine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vm-name">VM Name</Label>
              <Input
                id="vm-name"
                placeholder="e.g., ingest-node-02"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-type">App Type</Label>
              <Select value={appType} onValueChange={(v) => setAppType(v as AppType)}>
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
              <p className="text-xs text-muted-foreground">
                This VM will only host apps of the selected type.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !appType}>
              Add VM
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
