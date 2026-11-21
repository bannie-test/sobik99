import { useMemo, useState } from 'react';
import { cubes, puzzleTypes } from '../../data/cubes';
import { EMPTY_FILTERS, filterCubes, type CatalogFilters, type SortOrder } from './filterCubes';
import { ProductCard } from './ProductCard';

const BRANDS = [...new Set(cubes.map((c) => c.brand))];
const SORT_OPTIONS: [SortOrder, string][] = [
  ['featured', 'Nổi bật'],
  ['asc', 'Giá demo tăng dần'],
  ['desc', 'Giá demo giảm dần'],
];

/** Giá trị từ URL chỉ được nhận nếu có trong danh sách lựa chọn. */
const pick = (value: string | null, allowed: readonly string[]) => (value && allowed.includes(value) ? value : '');

export function CatalogPage({ query }: { query: URLSearchParams }) {
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...EMPTY_FILTERS,
    brand: pick(query.get('brand'), BRANDS),
    type: pick(query.get('type'), puzzleTypes),
  }));
  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const list = useMemo(() => filterCubes(cubes, filters), [filters]);

  return (
    <section className="page-shell">
      <div className="page-heading">
        <div>
          <small>THE CUBE CLUB / BỘ SƯU TẬP</small>
          <h1>
            Đúng gu.
            <br />
            <em>Đúng vòng xoay.</em>
          </h1>
        </div>
        <p>
          Tìm hiểu, đặt cạnh nhau và chọn cá tính của bạn.
          <br />
          Toàn bộ giá và đặt hàng trên website là mô phỏng.
        </p>
      </div>
      <div className="filter-bar">
        <label>
          Tìm Rubik
          <input
            type="search"
            id="cube-search"
            placeholder="Tên mẫu hoặc thương hiệu…"
            value={filters.query}
            onChange={(e) => update('query', e.target.value)}
          />
        </label>
        <label>
          Thương hiệu
          <select id="brand-filter" value={filters.brand} onChange={(e) => update('brand', e.target.value)}>
            <option value="">Tất cả hãng</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label>
          Loại
          <select id="type-filter" value={filters.type} onChange={(e) => update('type', e.target.value)}>
            <option value="">Tất cả hình khối</option>
            {puzzleTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sắp xếp
          <select id="sort-filter" value={filters.sort} onChange={(e) => update('sort', e.target.value as SortOrder)}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="results-line">
        <span id="result-count" role="status">
          {list.length} Rubik để khám phá
        </span>
        <button id="clear-filters" className="text-button" onClick={() => setFilters(EMPTY_FILTERS)}>
          Xóa bộ lọc
        </button>
      </div>
      <div className="product-grid" id="cube-grid">
        {list.length ? (
          list.map((c) => <ProductCard key={c.id} cube={c} />)
        ) : (
          <div className="empty-state">
            <h2>Chưa tìm thấy khối Rubik này.</h2>
            <p>Thử tên khác hoặc xóa bộ lọc.</p>
          </div>
        )}
      </div>
    </section>
  );
}
