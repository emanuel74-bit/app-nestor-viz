import { useMemo } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { FilterGroup, FilterCondition, getUniqueFieldValues } from '@/types/filters';
import { SOURCE_FILTERABLE_FIELDS } from '@/types/infrastructure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Trash2 } from 'lucide-react';

export function PropertyFilterPanel() {
  const { sources, filterGroups, setFilterGroups } = useInfrastructure();

  const fieldOptions = useMemo(() =>
    SOURCE_FILTERABLE_FIELDS.map(field => ({
      key: field,
      label: field.charAt(0).toUpperCase() + field.slice(1),
      values: getUniqueFieldValues(sources, field),
    })),
    [sources]
  );

  const addGroup = () => {
    setFilterGroups([...filterGroups, { conditions: [{ field: SOURCE_FILTERABLE_FIELDS[0], operator: 'equals', value: '' }] }]);
  };

  const removeGroup = (groupIndex: number) => {
    setFilterGroups(filterGroups.filter((_, i) => i !== groupIndex));
  };

  const addCondition = (groupIndex: number) => {
    const updated = [...filterGroups];
    updated[groupIndex] = {
      ...updated[groupIndex],
      conditions: [...updated[groupIndex].conditions, { field: SOURCE_FILTERABLE_FIELDS[0], operator: 'equals', value: '' }],
    };
    setFilterGroups(updated);
  };

  const removeCondition = (groupIndex: number, condIndex: number) => {
    const updated = [...filterGroups];
    const conditions = updated[groupIndex].conditions.filter((_, i) => i !== condIndex);
    if (conditions.length === 0) {
      setFilterGroups(filterGroups.filter((_, i) => i !== groupIndex));
    } else {
      updated[groupIndex] = { ...updated[groupIndex], conditions };
      setFilterGroups(updated);
    }
  };

  const updateCondition = (groupIndex: number, condIndex: number, updates: Partial<FilterCondition>) => {
    const updated = [...filterGroups];
    updated[groupIndex] = {
      ...updated[groupIndex],
      conditions: updated[groupIndex].conditions.map((c, i) => i === condIndex ? { ...c, ...updates } : c),
    };
    setFilterGroups(updated);
  };

  const clearAll = () => setFilterGroups([]);

  return (
    <div className="p-3 space-y-3">
      {filterGroups.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No filters active. Add a filter group to start filtering sources by properties.
        </p>
      )}

      {filterGroups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-border/50" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">OR</span>
              <div className="flex-1 border-t border-border/50" />
            </div>
          )}
          <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {filterGroups.length > 1 ? `Group ${gi + 1}` : 'Conditions'} <span className="text-primary">(AND)</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => removeGroup(gi)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {group.conditions.map((condition, ci) => (
              <div key={ci} className="space-y-1.5">
                {ci > 0 && <div className="text-[10px] text-muted-foreground font-medium pl-1">AND</div>}
                <div className="flex items-center gap-1.5">
                  <Select value={condition.field} onValueChange={(v) => updateCondition(gi, ci, { field: v })}>
                    <SelectTrigger className="h-7 text-xs w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(f => (
                        <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={condition.operator} onValueChange={(v) => updateCondition(gi, ci, { operator: v as any })}>
                    <SelectTrigger className="h-7 text-xs w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals" className="text-xs">= equals</SelectItem>
                      <SelectItem value="contains" className="text-xs">≈ LIKE</SelectItem>
                      <SelectItem value="not_equals" className="text-xs">≠ not</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value..."
                    value={condition.value}
                    onChange={(e) => updateCondition(gi, ci, { value: e.target.value })}
                    className="h-7 text-xs flex-1"
                    list={`field-values-${gi}-${ci}`}
                  />
                  <datalist id={`field-values-${gi}-${ci}`}>
                    {fieldOptions.find(f => f.key === condition.field)?.values.map(v => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>

                  <Button variant="ghost" size="sm" onClick={() => removeCondition(gi, ci)} className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="ghost" size="sm" onClick={() => addCondition(gi)} className="w-full h-7 text-xs text-muted-foreground">
              <Plus className="w-3 h-3 mr-1" /> Add condition
            </Button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addGroup} className="flex-1 h-8 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add filter group
        </Button>
        {filterGroups.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-muted-foreground hover:text-destructive">
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
