import { useState, useMemo } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { PropertyFilter, PropertyMetadata, inferPropertyType, PropertyType, FilterOperator } from '@/types/filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, ChevronDown, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropertyFilterPanel() {
  const { sources, propertyFilters, setPropertyFilters } = useInfrastructure();
  const [isOpen, setIsOpen] = useState(true);
  
  // Analyze all property keys and their types from sources
  const propertyMetadata = useMemo((): PropertyMetadata[] => {
    const propertyValues: Map<string, string[]> = new Map();
    
    for (const source of sources) {
      for (const [key, value] of Object.entries(source.properties)) {
        if (!propertyValues.has(key)) {
          propertyValues.set(key, []);
        }
        propertyValues.get(key)!.push(value);
      }
    }
    
    return Array.from(propertyValues.entries()).map(([key, values]) => ({
      key,
      type: inferPropertyType(values),
      uniqueValues: [...new Set(values)].sort(),
    }));
  }, [sources]);

  const addFilter = (key: string) => {
    const metadata = propertyMetadata.find(m => m.key === key);
    if (!metadata) return;
    
    const defaultOperator = getDefaultOperator(metadata.type);
    const defaultValue = metadata.type === 'enum' ? [] : '';
    
    setPropertyFilters([
      ...propertyFilters,
      { key, operator: defaultOperator, value: defaultValue }
    ]);
  };

  const updateFilter = (index: number, updates: Partial<PropertyFilter>) => {
    const newFilters = [...propertyFilters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setPropertyFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setPropertyFilters(propertyFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setPropertyFilters([]);
  };

  const activeFilterCount = propertyFilters.length;
  const availableProperties = propertyMetadata.filter(
    m => !propertyFilters.some(f => f.key === m.key)
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between px-3 py-2 h-auto",
            activeFilterCount > 0 && "bg-primary/10"
          )}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Property Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="animate-accordion-down">
        <div className="px-3 py-3 space-y-3 border-t border-border/50">
          {/* Active Filters */}
          {propertyFilters.length > 0 && (
            <div className="space-y-2">
              {propertyFilters.map((filter, index) => {
                const metadata = propertyMetadata.find(m => m.key === filter.key);
                if (!metadata) return null;
                
                return (
                  <FilterRow
                    key={`${filter.key}-${index}`}
                    filter={filter}
                    metadata={metadata}
                    onUpdate={(updates) => updateFilter(index, updates)}
                    onRemove={() => removeFilter(index)}
                  />
                );
              })}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="w-full text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all filters
              </Button>
            </div>
          )}
          
          {/* Add Filter */}
          {availableProperties.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Add filter</Label>
              <Select onValueChange={addFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map(prop => (
                    <SelectItem key={prop.key} value={prop.key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{prop.key}</span>
                        <span className="text-muted-foreground capitalize">
                          ({prop.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {propertyFilters.length === 0 && availableProperties.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No properties available to filter
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterRow({
  filter,
  metadata,
  onUpdate,
  onRemove,
}: {
  filter: PropertyFilter;
  metadata: PropertyMetadata;
  onUpdate: (updates: Partial<PropertyFilter>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-secondary/30 rounded-lg p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{filter.key}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <FilterValueInput
        filter={filter}
        metadata={metadata}
        onUpdate={onUpdate}
      />
    </div>
  );
}

function FilterValueInput({
  filter,
  metadata,
  onUpdate,
}: {
  filter: PropertyFilter;
  metadata: PropertyMetadata;
  onUpdate: (updates: Partial<PropertyFilter>) => void;
}) {
  const { type, uniqueValues } = metadata;
  
  switch (type) {
    case 'boolean':
      return (
        <div className="flex gap-2">
          <Button
            variant={filter.operator === 'is_true' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onUpdate({ operator: 'is_true' })}
            className="flex-1 h-7 text-xs"
          >
            True
          </Button>
          <Button
            variant={filter.operator === 'is_false' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onUpdate({ operator: 'is_false' })}
            className="flex-1 h-7 text-xs"
          >
            False
          </Button>
        </div>
      );
    
    case 'enum':
      return (
        <ScrollArea className="max-h-32">
          <div className="space-y-1">
            {uniqueValues.map(value => {
              const selectedValues = Array.isArray(filter.value) ? filter.value : [];
              const isChecked = selectedValues.includes(value);
              
              return (
                <label
                  key={value}
                  className="flex items-center gap-2 py-1 px-1 rounded hover:bg-secondary/50 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, value]
                        : selectedValues.filter(v => v !== value);
                      onUpdate({ operator: 'in', value: newValues });
                    }}
                  />
                  <span className="text-xs">{value}</span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
      );
    
    case 'number':
      return (
        <div className="space-y-2">
          <Select
            value={filter.operator}
            onValueChange={(op: FilterOperator) => onUpdate({ operator: op })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals" className="text-xs">Equals</SelectItem>
              <SelectItem value="gt" className="text-xs">Greater than</SelectItem>
              <SelectItem value="lt" className="text-xs">Less than</SelectItem>
              <SelectItem value="gte" className="text-xs">≥ (Greater or equal)</SelectItem>
              <SelectItem value="lte" className="text-xs">≤ (Less or equal)</SelectItem>
              <SelectItem value="between" className="text-xs">Between</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Value"
              value={String(filter.value || '')}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="h-7 text-xs"
            />
            {filter.operator === 'between' && (
              <Input
                type="number"
                placeholder="Max"
                value={String(filter.secondValue || '')}
                onChange={(e) => onUpdate({ secondValue: e.target.value })}
                className="h-7 text-xs"
              />
            )}
          </div>
        </div>
      );
    
    case 'date':
      return (
        <div className="space-y-2">
          <Select
            value={filter.operator}
            onValueChange={(op: FilterOperator) => onUpdate({ operator: op })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals" className="text-xs">On date</SelectItem>
              <SelectItem value="before" className="text-xs">Before</SelectItem>
              <SelectItem value="after" className="text-xs">After</SelectItem>
              <SelectItem value="between" className="text-xs">Between</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Input
              type="date"
              value={String(filter.value || '')}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="h-7 text-xs"
            />
            {filter.operator === 'between' && (
              <Input
                type="date"
                value={String(filter.secondValue || '')}
                onChange={(e) => onUpdate({ secondValue: e.target.value })}
                className="h-7 text-xs"
              />
            )}
          </div>
        </div>
      );
    
    case 'string':
    default:
      return (
        <div className="space-y-2">
          <Select
            value={filter.operator}
            onValueChange={(op: FilterOperator) => onUpdate({ operator: op })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains" className="text-xs">Contains</SelectItem>
              <SelectItem value="equals" className="text-xs">Exact match</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Filter value..."
            value={String(filter.value || '')}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      );
  }
}

function getDefaultOperator(type: PropertyType): FilterOperator {
  switch (type) {
    case 'boolean':
      return 'is_true';
    case 'enum':
      return 'in';
    case 'number':
      return 'equals';
    case 'date':
      return 'after';
    default:
      return 'contains';
  }
}
