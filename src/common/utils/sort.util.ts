import { asc, desc, SQL, Column } from 'drizzle-orm';
import { SortOrder } from '@/common';

/**
 * Generic utility to get sort column from a sort field map
 * @param sortBy - The sort field enum value
 * @param sortColumnMap - Map of sort field enum values to database columns
 * @param defaultColumn - Default column to use if sortBy is not found in map
 * @returns The database column to sort by
 */
export function getSortColumn<T extends string | number | symbol>(
  sortBy: T,
  sortColumnMap: Record<T, Column | SQL | SQL.Aliased>,
  defaultColumn: Column | SQL | SQL.Aliased,
): Column | SQL | SQL.Aliased {
  return sortColumnMap[sortBy] ?? defaultColumn;
}

/**
 * Generic utility to create orderBy clause from sort field and sort order
 * @param sortBy - The sort field enum value
 * @param sortColumnMap - Map of sort field enum values to database columns
 * @param defaultColumn - Default column to use if sortBy is not found in map
 * @param sortOrder - Sort order ('asc' or 'desc')
 * @returns The orderBy clause for drizzle query
 */
export function createOrderBy<T extends string | number | symbol>(
  sortBy: T,
  sortColumnMap: Record<T, Column | SQL | SQL.Aliased>,
  defaultColumn: Column | SQL | SQL.Aliased,
  sortOrder: SortOrder = 'desc',
): SQL | SQL.Aliased {
  const sortColumn = getSortColumn(sortBy, sortColumnMap, defaultColumn);
  return sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
}
