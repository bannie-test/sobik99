export type PuzzleType = '2x2' | '3x3' | '4x4' | '5x5' | '6x6' | '7x7' | 'Megaminx' | 'Pyraminx';

export interface CubeSpecs {
  size_mm: number | null;
  weight_g: number | null;
  magnetic: boolean | null;
  maglev: boolean | null;
  core_magnets: boolean | null;
  magnet_count: number | null;
  auto_homing_angle: string | null;
  adjustability: string | null;
  corner_cutting: string | null;
  release_year: number | null;
}

export interface Source {
  name: string;
  url: string;
}

export interface Cube {
  id: string;
  name: string;
  brand: string;
  type: PuzzleType;
  /** Giá demo tự đặt (VND), không phải giá bán thật. */
  price_fake: number;
  currency: 'VND';
  price_note: string;
  specs: CubeSpecs;
  summary: string;
  manufacturer_info: string;
  reviews_summary: { average_rating: number | null; pros: string[]; cons: string[]; source: string };
  sources: [Source, ...Source[]];
  checked: string;
}

export interface Brand {
  name: string;
  tag: string;
  /** Màu nền thẻ */
  bg: string;
  /** Màu nền sân khấu carousel */
  stage: string;
  ids: string[];
}

export interface Lesson {
  title: string;
  intro: string;
  source: string;
  /** [tiêu đề, nội dung] */
  steps: [string, string][];
  /** [tên, công thức] */
  algs: [string, string][];
}

export type CasePhase = 'f2l' | 'oll' | 'pll';

export interface CaseVariant {
  alg: string;
  setup: string;
  image: string;
  label: string;
}

export interface AlgorithmCase {
  id: string;
  name: number | string;
  type: CasePhase;
  group: string;
  group_vi: string;
  moves: string[];
  source: string;
  rotatedAlternative?: boolean;
  variants: CaseVariant[];
}
