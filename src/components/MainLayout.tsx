import { ReactNode } from 'react';
import { Database, HardDrive, Server } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

interface MainLayoutProps {
  children: ReactNode;
  currentView: 'sources' | 'vms';
  onViewChange: (view: 'sources' | 'vms') => void;
}

export function MainLayout({ children, currentView, onViewChange }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">InfraManager</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Infrastructure Deployment</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => onViewChange('sources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'sources'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Database className="w-4 h-4" />
              Sources
            </button>
            <button
              onClick={() => onViewChange('vms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'vms'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Virtual Machines
            </button>
          </nav>

          <div className="w-[200px]" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
