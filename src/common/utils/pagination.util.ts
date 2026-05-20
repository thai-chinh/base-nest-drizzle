/**
 * Creates pagination meta information
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param total - Total number of items
 * @returns Pagination meta object
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
