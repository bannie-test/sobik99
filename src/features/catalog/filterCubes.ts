import type { Cube } from '../../data/types';

export type SortOrder = 'featured' | 'asc' | 'desc';

export interface CatalogFilters {
  query: string;
  brand: string;
  type: string;
  sort: SortOrder;
}

export const EMPTY_FILTERS: CatalogFilters = { query: '', brand: '', type: '', sort: 'featured' };

/** Lọc theo hãng/loại/từ khóa (không phân biệt hoa thường, locale vi) rồi sắp xếp theo giá demo. */
export function filterCubes(list: readonly Cube[], { query, brand, type, sort }: CatalogFilters): Cube[] {
  const term = query.toLocaleLowerCase('vi');
  const result = list.filter(
    (c) =>
      (!brand || c.brand === brand) &&
      (!type || c.type === type) &&
      `${c.name} ${c.brand}`.toLocaleLowerCase('vi').includes(term),
  );
  if (sort !== 'featured') result.sort((a, b) => (a.price_fake - b.price_fake) * (sort === 'asc' ? 1 : -1));
  return result;
}
