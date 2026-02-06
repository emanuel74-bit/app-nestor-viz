import { Source } from '@/types/infrastructure';
import { cn } from '@/lib/utils';
import { Globe, MapPin, Users } from 'lucide-react';

interface SourceFieldsDisplayProps {
  source: Source;
  className?: string;
}

const fieldConfig = [
  { key: 'environment' as const, icon: Globe, label: 'Env' },
  { key: 'region' as const, icon: MapPin, label: 'Region' },
  { key: 'team' as const, icon: Users, label: 'Team' },
];

export function SourceFieldsDisplay({ source, className }: SourceFieldsDisplayProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {fieldConfig.map(({ key, icon: Icon, label }) => {
        const value = source[key];
        if (!value) return null;
        return (
          <div
            key={key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary/60 border border-border/50 hover:bg-secondary/80 transition-colors shrink-0"
          >
            <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{label}:</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SourceFieldsCompact({ source, className }: SourceFieldsDisplayProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {fieldConfig.map(({ key }) => {
        const value = source[key];
        if (!value) return null;
        return (
          <span key={key} className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded font-mono" title={`${key}: ${value}`}>
            {value}
          </span>
        );
      })}
    </div>
  );
}
