// Property filter types

export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'gt' 
  | 'lt' 
  | 'gte' 
  | 'lte' 
  | 'between'
  | 'before'
  | 'after'
  | 'is_true'
  | 'is_false'
  | 'in';

export type PropertyType = 'string' | 'number' | 'date' | 'boolean' | 'enum';

export interface PropertyFilter {
  key: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
  secondValue?: string | number; // For range/between operations
}

export interface PropertyMetadata {
  key: string;
  type: PropertyType;
  uniqueValues: string[];
}

/**
 * Infer the type of a property value
 */
export function inferPropertyType(values: string[]): PropertyType {
  if (values.length === 0) return 'string';
  
  // Check for boolean
  const booleanValues = new Set(['true', 'false', 'yes', 'no', '1', '0']);
  if (values.every(v => booleanValues.has(v.toLowerCase()))) {
    return 'boolean';
  }
  
  // Check for number
  if (values.every(v => !isNaN(Number(v)) && v.trim() !== '')) {
    return 'number';
  }
  
  // Check for date (ISO format)
  const dateRegex = /^\d{4}-\d{2}-\d{2}/;
  if (values.every(v => dateRegex.test(v))) {
    return 'date';
  }
  
  // Check for enum-like (limited unique values)
  const uniqueValues = new Set(values);
  if (uniqueValues.size <= 10 && uniqueValues.size >= 2) {
    return 'enum';
  }
  
  return 'string';
}

/**
 * Check if a value matches a filter
 */
export function matchesFilter(value: string | undefined, filter: PropertyFilter): boolean {
  if (value === undefined) return false;
  
  const { operator, value: filterValue, secondValue } = filter;
  
  switch (operator) {
    case 'equals':
      return value.toLowerCase() === String(filterValue).toLowerCase();
    
    case 'contains':
      return value.toLowerCase().includes(String(filterValue).toLowerCase());
    
    case 'gt':
      return Number(value) > Number(filterValue);
    
    case 'lt':
      return Number(value) < Number(filterValue);
    
    case 'gte':
      return Number(value) >= Number(filterValue);
    
    case 'lte':
      return Number(value) <= Number(filterValue);
    
    case 'between':
      const numVal = Number(value);
      return numVal >= Number(filterValue) && numVal <= Number(secondValue);
    
    case 'before':
      return new Date(value) < new Date(String(filterValue));
    
    case 'after':
      return new Date(value) > new Date(String(filterValue));
    
    case 'is_true':
      return ['true', 'yes', '1'].includes(value.toLowerCase());
    
    case 'is_false':
      return ['false', 'no', '0'].includes(value.toLowerCase());
    
    case 'in':
      const allowedValues = Array.isArray(filterValue) ? filterValue : [filterValue];
      return allowedValues.some(v => 
        String(v).toLowerCase() === value.toLowerCase()
      );
    
    default:
      return true;
  }
}

/**
 * Check if a source matches all property filters
 */
export function sourceMatchesPropertyFilters(
  properties: Record<string, string>,
  filters: PropertyFilter[]
): boolean {
  if (filters.length === 0) return true;
  
  return filters.every(filter => 
    matchesFilter(properties[filter.key], filter)
  );
}
