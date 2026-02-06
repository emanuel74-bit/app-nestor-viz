import { ReactNode, useState } from 'react';
import { Database, HardDrive, Server, SlidersHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { CategoryTree } from '@/components/CategoryTree';
import { PropertyFilterPanel } from '@/components/PropertyFilterPanel';
import { Button } from '@/components/ui/button';
import { useInfrastructure } from '@/context/InfrastructureContext';

interface MainLayoutProps {
  children: ReactNode;
  currentView: 'sources' | 'vms';
  onViewChange: (view: 'sources' | 'vms') => void;
}

export function MainLayout({ children, currentView, onViewChange }: MainLayoutProps) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { filterGroups } = useInfrastructure();
  const activeFilterCount = filterGroups.filter(g => g.conditions.some(c => c.value.trim())).length;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            <Button
              variant={filterPanelOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className="relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 bg-primary-foreground text-primary text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Category Tree */}
        <aside className="w-72 border-r border-border/50 bg-card/30 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Hierarchy
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <CategoryTree />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Right Panel - Filter Panel */}
        {filterPanelOpen && (
          <aside className="w-80 border-l border-border/50 bg-card/30 flex-shrink-0 overflow-hidden flex flex-col animate-fade-in">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Property Filters
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterPanelOpen(false)}
                className="h-7 w-7 p-0"
              >
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PropertyFilterPanel />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
