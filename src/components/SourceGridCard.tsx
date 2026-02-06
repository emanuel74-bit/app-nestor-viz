import { Source } from '@/types/infrastructure';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SourceFieldsCompact } from '@/components/SourceFieldsDisplay';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceGridCardProps {
  source: Source;
}

export function SourceGridCard({ source }: SourceGridCardProps) {
  const { selectedSourceIds, toggleSourceSelection, getAppsBySource } = useInfrastructure();
  const isSelected = selectedSourceIds.has(source.id);
  const appCount = getAppsBySource(source.id).length;

  return (
    <Card
      className={cn(
        "bg-gradient-card border-border/50 p-3 cursor-pointer transition-all hover:border-primary/30",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}
      onClick={() => toggleSourceSelection(source.id)}
    >
      <div className="flex items-start gap-2">
        <Checkbox checked={isSelected} onCheckedChange={() => toggleSourceSelection(source.id)} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">{source.name}</span>
          </div>
          <SourceFieldsCompact source={source} className="mt-1.5" />
          <div className="text-xs text-muted-foreground mt-1">
            {appCount} app{appCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </Card>
  );
}
