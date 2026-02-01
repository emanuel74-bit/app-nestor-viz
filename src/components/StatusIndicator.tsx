import { cn } from '@/lib/utils';

type Status = 'running' | 'stopped' | 'pending' | 'online' | 'offline';

interface StatusIndicatorProps {
  status: Status;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<Status, { label: string; dotClass: string; textClass: string }> = {
  running: { label: 'Running', dotClass: 'bg-status-running', textClass: 'text-status-running' },
  stopped: { label: 'Stopped', dotClass: 'bg-status-stopped', textClass: 'text-status-stopped' },
  pending: { label: 'Pending', dotClass: 'bg-status-pending animate-pulse-glow', textClass: 'text-status-pending' },
  online: { label: 'Online', dotClass: 'bg-status-online', textClass: 'text-status-online' },
  offline: { label: 'Offline', dotClass: 'bg-status-offline', textClass: 'text-status-offline' },
};

export function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dotClass)} />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.textClass)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
