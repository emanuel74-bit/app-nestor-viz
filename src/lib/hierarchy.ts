import { Source, CategoryNode } from '@/types/infrastructure';

/**
 * Convert a path array to a string key for Set/Map operations
 */
export function pathToKey(path: string[]): string {
  return path.join('/');
}

/**
 * Convert a path key back to array
 */
export function keyToPath(key: string): string[] {
  return key === '' ? [] : key.split('/');
}

/**
 * Build a virtual category tree from all source paths
 */
export function buildCategoryTree(sources: Source[]): CategoryNode {
  const root: CategoryNode = {
    name: 'Root',
    path: [],
    children: new Map(),
    sources: [],
  };

  for (const source of sources) {
    let currentNode = root;

    // Traverse/create path segments
    for (let i = 0; i < source.categoryPath.length; i++) {
      const segment = source.categoryPath[i];
      const currentPath = source.categoryPath.slice(0, i + 1);

      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, {
          name: segment,
          path: currentPath,
          children: new Map(),
          sources: [],
        });
      }

      currentNode = currentNode.children.get(segment)!;
    }

    // Attach source as leaf
    currentNode.sources.push(source);
  }

  return root;
}

/**
 * Check if a source is within a given scope path
 */
export function isSourceInScope(source: Source, scopePath: string[] | null): boolean {
  if (!scopePath || scopePath.length === 0) {
    return true;
  }

  if (source.categoryPath.length < scopePath.length) {
    return false;
  }

  for (let i = 0; i < scopePath.length; i++) {
    if (source.categoryPath[i] !== scopePath[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a source matches the search query (name only)
 */
export function sourceMatchesSearch(source: Source, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const lowerQuery = query.toLowerCase().trim();

  // Match source name only
  return source.name.toLowerCase().includes(lowerQuery);
}

/**
 * Filter sources by scope and search query
 */
export function filterSources(
  sources: Source[],
  scopePath: string[] | null,
  searchQuery: string
): Source[] {
  return sources.filter(source => 
    isSourceInScope(source, scopePath) && sourceMatchesSearch(source, searchQuery)
  );
}

/**
 * Get all descendant sources from a category node
 */
export function getDescendantSources(node: CategoryNode): Source[] {
  const sources: Source[] = [...node.sources];

  for (const child of node.children.values()) {
    sources.push(...getDescendantSources(child));
  }

  return sources;
}

/**
 * Find a category node by path
 */
export function findNodeByPath(root: CategoryNode, path: string[]): CategoryNode | null {
  let current = root;

  for (const segment of path) {
    const child = current.children.get(segment);
    if (!child) {
      return null;
    }
    current = child;
  }

  return current;
}

/**
 * Get source count for a category (including descendants)
 */
export function getSourceCount(node: CategoryNode): number {
  let count = node.sources.length;

  for (const child of node.children.values()) {
    count += getSourceCount(child);
  }

  return count;
}

/**
 * Check if any descendant source matches the search
 */
export function hasMatchingDescendant(node: CategoryNode, searchQuery: string): boolean {
  // Check direct sources
  if (node.sources.some(source => sourceMatchesSearch(source, searchQuery))) {
    return true;
  }

  // Check children
  for (const child of node.children.values()) {
    if (hasMatchingDescendant(child, searchQuery)) {
      return true;
    }
  }

  return false;
}
