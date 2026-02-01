import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSourceDialog({ open, onOpenChange }: CreateSourceDialogProps) {
  const [name, setName] = useState('');
  const { createSource } = useInfrastructure();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const result = createSource(name.trim());
    
    let message = `Source "${result.source.name}" created with ${result.apps.length} apps.`;
    if (result.newVms.length > 0) {
      message += ` ${result.newVms.length} new VM(s) were provisioned.`;
    }
    
    toast.success('Source Created', {
      description: message,
    });

    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                placeholder="e.g., Acme Corporation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Creating a source will automatically deploy all required app types (ingest, processor, api, storage, analytics).
              Apps will be placed on existing compatible VMs, or new VMs will be provisioned.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Source
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
