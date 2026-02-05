import { useState } from 'react';
import { SourceProperties } from '@/types/infrastructure';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourcePropertiesDisplayProps {
  properties: SourceProperties;
  className?: string;
  maxVisible?: number;
}

export function SourcePropertiesDisplay({ 
  properties, 
  className,
  maxVisible = 4,
}: SourcePropertiesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const entries = Object.entries(properties);
  const hasOverflow = entries.length > maxVisible;
  const visibleEntries = isExpanded ? entries : entries.slice(0, maxVisible);
  
  if (entries.length === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground italic", className)}>
        No properties
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Property Tags - Scrollable strip */}
      <div className="relative">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-1">
            {visibleEntries.map(([key, value]) => (
              <PropertyTag key={key} propertyKey={key} value={value} />
            ))}
            {!isExpanded && hasOverflow && (
              <button
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary/50 hover:bg-secondary text-muted-foreground rounded-md transition-colors shrink-0"
              >
                +{entries.length - maxVisible} more
              </button>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>
      
      {/* Expanded view toggle */}
      {isExpanded && hasOverflow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-6 px-2 text-xs text-muted-foreground"
        >
          <ChevronUp className="w-3 h-3 mr-1" />
          Show less
        </Button>
      )}
    </div>
  );
}

function PropertyTag({ 
  propertyKey, 
  value 
}: { 
  propertyKey: string; 
  value: string;
}) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs",
        "bg-secondary/60 border border-border/50",
        "hover:bg-secondary/80 transition-colors",
        "shrink-0"
      )}
    >
      <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="font-medium text-foreground">{propertyKey}:</span>
      <span className="text-muted-foreground truncate max-w-[120px]" title={value}>
        {value}
      </span>
    </div>
  );
}

// Compact version for smaller spaces
export function SourcePropertiesCompact({ 
  properties, 
  className,
}: { 
  properties: SourceProperties;
  className?: string;
}) {
  const entries = Object.entries(properties);
  
  if (entries.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {entries.slice(0, 3).map(([key, value]) => (
        <span 
          key={key} 
          className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded font-mono"
          title={`${key}: ${value}`}
        >
          {key}: {value}
        </span>
      ))}
      {entries.length > 3 && (
        <span className="text-xs text-muted-foreground">
          +{entries.length - 3}
        </span>
      )}
    </div>
  );
}
