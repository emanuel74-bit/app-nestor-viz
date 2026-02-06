import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { CreateSourceInput, SOURCE_EDITABLE_FIELDS } from '@/types/infrastructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface BulkEntry {
  name: string;
  categoryPath: string;
  environment: string;
  region: string;
  team: string;
  error?: string;
}

const emptyEntry = (): BulkEntry => ({ name: '', categoryPath: '', environment: '', region: '', team: '' });

export function BulkCreateSourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { createSources, sources } = useInfrastructure();
  const [entries, setEntries] = useState<BulkEntry[]>([emptyEntry()]);

  const updateEntry = (index: number, field: string, value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value, error: undefined } : e));
  };

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const cloneEntry = (index: number) => {
    const src = entries[index];
    setEntries(prev => [...prev, { ...src, name: '', error: undefined }]);
  };

  const cloneFromExisting = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;
    setEntries(prev => [...prev, {
      name: '',
      categoryPath: source.categoryPath.join('/'),
      environment: source.environment,
      region: source.region,
      team: source.team,
    }]);
  };

  const validate = (): boolean => {
    let valid = true;
    const updated = entries.map(e => {
      if (!e.name.trim() || !e.environment.trim() || !e.region.trim() || !e.team.trim()) {
        valid = false;
        return { ...e, error: 'All required fields must be filled' };
      }
      return { ...e, error: undefined };
    });
    setEntries(updated);
    return valid;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const inputs: CreateSourceInput[] = entries.map(e => ({
      name: e.name.trim(),
      categoryPath: e.categoryPath.trim() ? e.categoryPath.trim().split('/').map(s => s.trim()).filter(Boolean) : [],
      environment: e.environment.trim(),
      region: e.region.trim(),
      team: e.team.trim(),
    }));

    const result = createSources(inputs);
    toast.success('Bulk Create', {
      description: `${result.sources.length} sources created with ${result.apps.length} apps. ${result.newVms.length} new VM(s) provisioned.`,
    });

    setEntries([emptyEntry()]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Bulk Create Sources</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={addEntry}>
            <Plus className="w-3 h-3 mr-1" /> Add empty
          </Button>
          {sources.length > 0 && (
            <Select onValueChange={cloneFromExisting}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue placeholder="Clone from existing..." />
              </SelectTrigger>
              <SelectContent>
                {sources.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-3 pr-3">
            {entries.map((entry, i) => (
              <div key={i} className="bg-secondary/30 border border-border/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Source {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => cloneEntry(i)} className="h-6 w-6 p-0" title="Clone this entry">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(i)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" disabled={entries.length <= 1}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SOURCE_EDITABLE_FIELDS.map(field => (
                    <div key={field.key} className={field.key === 'name' ? 'col-span-2' : ''}>
                      <Input
                        placeholder={field.placeholder}
                        value={(entry as any)[field.key] || ''}
                        onChange={(e) => updateEntry(i, field.key, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>

                {entry.error && (
                  <p className="text-xs text-destructive">{entry.error}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create {entries.length} Source{entries.length > 1 ? 's' : ''}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
