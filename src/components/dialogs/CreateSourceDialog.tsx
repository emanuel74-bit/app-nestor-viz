import { useState, useEffect } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Source, SOURCE_EDITABLE_FIELDS, SOURCE_CLONE_EXCLUDE } from '@/types/infrastructure';
import { toast } from 'sonner';

interface CreateSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategoryPath?: string[];
  cloneFrom?: Source | null;
}

export function CreateSourceDialog({ open, onOpenChange, defaultCategoryPath = [], cloneFrom }: CreateSourceDialogProps) {
  const { createSource } = useInfrastructure();

  const [formData, setFormData] = useState({
    name: '',
    categoryPath: defaultCategoryPath.join('/'),
    environment: '',
    region: '',
    team: '',
  });

  // Prefill from clone source
  useEffect(() => {
    if (cloneFrom) {
      setFormData({
        name: '', // Excluded from clone
        categoryPath: cloneFrom.categoryPath.join('/'),
        environment: cloneFrom.environment,
        region: cloneFrom.region,
        team: cloneFrom.team,
      });
    } else {
      setFormData({
        name: '',
        categoryPath: defaultCategoryPath.join('/'),
        environment: '',
        region: '',
        team: '',
      });
    }
  }, [cloneFrom, defaultCategoryPath, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const pathArray = formData.categoryPath.trim() ? formData.categoryPath.trim().split('/').map(s => s.trim()).filter(Boolean) : [];

    const result = createSource({
      name: formData.name.trim(),
      categoryPath: pathArray,
      environment: formData.environment.trim(),
      region: formData.region.trim(),
      team: formData.team.trim(),
    });

    let message = `Source "${result.source.name}" created with ${result.apps.length} apps.`;
    if (result.newVms.length > 0) message += ` ${result.newVms.length} new VM(s) were provisioned.`;

    toast.success('Source Created', { description: message });
    onOpenChange(false);
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isValid = formData.name.trim() && formData.environment.trim() && formData.region.trim() && formData.team.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cloneFrom ? `Clone from "${cloneFrom.name}"` : 'Create New Source'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {SOURCE_EDITABLE_FIELDS.map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`field-${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={`field-${field.key}`}
                  placeholder={field.placeholder}
                  value={(formData as any)[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  autoFocus={field.key === 'name'}
                />
                {field.key === 'categoryPath' && (
                  <p className="text-xs text-muted-foreground">Use forward slashes to separate hierarchy levels</p>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Creating a source will automatically deploy all required app types (ingest, processor, api, storage, analytics).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!isValid}>Create Source</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
