import { useInfrastructure } from '@/context/InfrastructureContext';
import { CategoryNode, Source } from '@/types/infrastructure';
import { pathToKey, sourceMatchesSearch, getSourceCount, hasMatchingDescendant } from '@/lib/hierarchy';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Database, Search, X, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryTreeProps {
  onSourceSelect?: (source: Source) => void;
}

function CategoryNodeItem({ 
  node, 
  depth = 0,
  onSourceSelect,
}: { 
  node: CategoryNode; 
  depth?: number;
  onSourceSelect?: (source: Source) => void;
}) {
  const { isPathExpanded, toggleExpanded, hierarchyState, setActiveScopePath } = useInfrastructure();

  const pathKey = pathToKey(node.path);
  const isExpanded = isPathExpanded(node.path);
  const isActiveScope = hierarchyState.activeScopePath && pathToKey(hierarchyState.activeScopePath) === pathKey;
  const hasChildren = node.children.size > 0 || node.sources.length > 0;
  const sourceCount = getSourceCount(node);

  const matchesSearch = hierarchyState.searchQuery ? hasMatchingDescendant(node, hierarchyState.searchQuery) : true;
  if (!matchesSearch && hierarchyState.searchQuery) return null;

  const sortedChildren = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));
  const sortedSources = [...node.sources].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors group",
          isActiveScope ? "bg-primary/20 text-primary" : "hover:bg-secondary/50"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button onClick={(e) => { e.stopPropagation(); toggleExpanded(node.path); }} className="p-0.5 hover:bg-secondary rounded">
          {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />) : <div className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setActiveScopePath(node.path)}>
          {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" /> : <Folder className="w-4 h-4 text-amber-500 shrink-0" />}
          <span className="truncate font-medium text-sm">{node.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">({sourceCount})</span>
        </div>
      </div>
      {isExpanded && (
        <>
          {sortedChildren.map(child => (
            <CategoryNodeItem key={pathToKey(child.path)} node={child} depth={depth + 1} onSourceSelect={onSourceSelect} />
          ))}
          {sortedSources.map(source => (
            <SourceNodeItem key={source.id} source={source} depth={depth + 1} onSelect={onSourceSelect} />
          ))}
        </>
      )}
    </div>
  );
}

function SourceNodeItem({ source, depth, onSelect }: { source: Source; depth: number; onSelect?: (source: Source) => void }) {
  const { hierarchyState } = useInfrastructure();
  const matchesSearch = sourceMatchesSearch(source, hierarchyState.searchQuery);
  if (!matchesSearch && hierarchyState.searchQuery) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
        matchesSearch && hierarchyState.searchQuery ? "bg-accent/30 ring-1 ring-accent" : "hover:bg-secondary/50"
      )}
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      onClick={() => onSelect?.(source)}
    >
      <Database className="w-4 h-4 text-primary shrink-0" />
      <span className="truncate text-sm">{source.name}</span>
    </div>
  );
}

export function CategoryTree({ onSourceSelect }: CategoryTreeProps) {
  const { categoryTree, hierarchyState, setSearchQuery, setActiveScopePath, expandAll, collapseAll } = useInfrastructure();
  const sortedRootChildren = Array.from(categoryTree.children.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-full">
      {/* Search - Name only */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={hierarchyState.searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-8 h-9" />
          {hierarchyState.searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 px-2 text-xs">
            <ChevronsUpDown className="w-3.5 h-3.5 mr-1" />Expand
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 px-2 text-xs">
            <ChevronsDownUp className="w-3.5 h-3.5 mr-1" />Collapse
          </Button>
        </div>
        {hierarchyState.activeScopePath && (
          <Button variant="ghost" size="sm" onClick={() => setActiveScopePath(null)} className="h-7 px-2 text-xs text-muted-foreground">
            Clear scope
          </Button>
        )}
      </div>

      {/* Breadcrumbs */}
      {hierarchyState.activeScopePath && hierarchyState.activeScopePath.length > 0 && (
        <div className="px-3 py-2 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => setActiveScopePath(null)} className="text-muted-foreground hover:text-foreground">All</button>
            {hierarchyState.activeScopePath.map((segment, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => setActiveScopePath(hierarchyState.activeScopePath!.slice(0, i + 1))}
                  className={cn(i === hierarchyState.activeScopePath!.length - 1 ? "text-primary font-medium" : "text-muted-foreground", "hover:text-foreground")}
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedRootChildren.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No categories found</div>
        ) : (
          sortedRootChildren.map(child => (
            <CategoryNodeItem key={pathToKey(child.path)} node={child} onSourceSelect={onSourceSelect} />
          ))
        )}
        {categoryTree.sources.map(source => (
          <SourceNodeItem key={source.id} source={source} depth={0} onSelect={onSourceSelect} />
        ))}
      </div>
    </div>
  );
}
