import type { Cube, CubeSpecs } from '../../data/types';
import { money } from '../../shared/lib/format';

export interface SpecField {
  label: string;
  get: (c: Cube) => string | number;
}

const yesNo = (key: keyof CubeSpecs) => (c: Cube) => {
  const v = c.specs[key];
  return v === true ? 'Có' : v === false ? 'Không' : (v ?? '');
};

const OPTIONAL_SPECS: [keyof CubeSpecs, string][] = [
  ['magnetic', 'Nam châm'],
  ['maglev', 'MagLev'],
  ['core_magnets', 'Nam châm lõi'],
  ['magnet_count', 'Số nam châm'],
  ['auto_homing_angle', 'Auto-homing'],
  ['adjustability', 'Điều chỉnh'],
  ['corner_cutting', 'Corner cutting'],
  ['release_year', 'Năm ra mắt'],
];

/** Các dòng thông số dùng chung cho trang chi tiết và bảng so sánh. Ô trống = chưa xác minh. */
export const SPEC_FIELDS: SpecField[] = [
  { label: 'Loại', get: (c) => c.type },
  { label: 'Giá demo', get: (c) => money(c.price_fake) },
  { label: 'Kích thước', get: (c) => (c.specs.size_mm == null ? '' : `${c.specs.size_mm} mm`) },
  { label: 'Trọng lượng', get: (c) => (c.specs.weight_g == null ? '' : `${c.specs.weight_g} g`) },
  ...OPTIONAL_SPECS.map(([key, label]) => ({ label, get: yesNo(key) })),
  { label: 'Rating', get: (c) => c.reviews_summary.average_rating ?? '' },
];
