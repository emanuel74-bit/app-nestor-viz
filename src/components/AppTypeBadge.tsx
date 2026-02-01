import { AppType } from '@/types/infrastructure';
import { cn } from '@/lib/utils';

interface AppTypeBadgeProps {
  type: AppType;
  className?: string;
}

const typeConfig: Record<AppType, { label: string; className: string }> = {
  ingest: { label: 'Ingest', className: 'bg-app-ingest/15 text-app-ingest border-app-ingest/30' },
  processor: { label: 'Processor', className: 'bg-app-processor/15 text-app-processor border-app-processor/30' },
  api: { label: 'API', className: 'bg-app-api/15 text-app-api border-app-api/30' },
  storage: { label: 'Storage', className: 'bg-app-storage/15 text-app-storage border-app-storage/30' },
  analytics: { label: 'Analytics', className: 'bg-app-analytics/15 text-app-analytics border-app-analytics/30' },
};

export function AppTypeBadge({ type, className }: AppTypeBadgeProps) {
  const config = typeConfig[type];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
