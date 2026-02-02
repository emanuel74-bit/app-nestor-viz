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
  defaultCategoryPath?: string[];
}

export function CreateSourceDialog({ open, onOpenChange, defaultCategoryPath = [] }: CreateSourceDialogProps) {
  const [name, setName] = useState('');
  const [categoryPath, setCategoryPath] = useState(defaultCategoryPath.join('/'));
  const [properties, setProperties] = useState('');
  const { createSource } = useInfrastructure();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pathArray = categoryPath.trim() ? categoryPath.trim().split('/').map(s => s.trim()).filter(Boolean) : [];
    
    // Parse properties from "key:value, key:value" format
    const propsObj: Record<string, string> = {};
    if (properties.trim()) {
      properties.split(',').forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          propsObj[key] = value;
        }
      });
    }

    const result = createSource(name.trim(), pathArray, propsObj);
    
    let message = `Source "${result.source.name}" created with ${result.apps.length} apps.`;
    if (result.newVms.length > 0) {
      message += ` ${result.newVms.length} new VM(s) were provisioned.`;
    }
    
    toast.success('Source Created', {
      description: message,
    });

    setName('');
    setCategoryPath('');
    setProperties('');
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
            <div className="space-y-2">
              <Label htmlFor="category-path">Category Path</Label>
              <Input
                id="category-path"
                placeholder="e.g., enterprise/us-east/production"
                value={categoryPath}
                onChange={(e) => setCategoryPath(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use forward slashes to separate hierarchy levels
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="properties">Properties (optional)</Label>
              <Input
                id="properties"
                placeholder="e.g., environment:prod, region:us-east-1"
                value={properties}
                onChange={(e) => setProperties(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Key-value pairs separated by commas
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Creating a source will automatically deploy all required app types (ingest, processor, api, storage, analytics).
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
