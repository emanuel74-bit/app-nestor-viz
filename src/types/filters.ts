import { Source, SOURCE_FILTERABLE_FIELDS } from './infrastructure';

export type FilterOperator = 'equals' | 'contains' | 'not_equals';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  conditions: FilterCondition[];
}

/** Groups are OR'd together; conditions within a group are AND'd */
export type FilterExpression = FilterGroup[];

export function getSourceFieldValue(source: Source, field: string): string {
  switch (field) {
    case 'environment': return source.environment;
    case 'region': return source.region;
    case 'team': return source.team;
    case 'categoryPath': return source.categoryPath.join('/');
    default: return '';
  }
}

export function matchesCondition(fieldValue: string, condition: FilterCondition): boolean {
  const v = fieldValue.toLowerCase();
  const cv = condition.value.toLowerCase();

  switch (condition.operator) {
    case 'equals': return v === cv;
    case 'contains': return v.includes(cv);
    case 'not_equals': return v !== cv;
    default: return true;
  }
}

export function sourceMatchesFilterExpression(source: Source, groups: FilterGroup[]): boolean {
  if (groups.length === 0) return true;

  const nonEmpty = groups.filter(g => g.conditions.length > 0 && g.conditions.some(c => c.value.trim() !== ''));
  if (nonEmpty.length === 0) return true;

  return nonEmpty.some(group =>
    group.conditions.every(condition => {
      if (!condition.value.trim()) return true;
      const value = getSourceFieldValue(source, condition.field);
      return matchesCondition(value, condition);
    })
  );
}

/**
 * Get unique values for a given source field across all sources
 */
export function getUniqueFieldValues(sources: Source[], field: string): string[] {
  const values = new Set<string>();
  for (const source of sources) {
    const v = getSourceFieldValue(source, field);
    if (v) values.add(v);
  }
  return Array.from(values).sort();
}
