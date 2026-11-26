// Shared by the catalog page and scripts/build-catalog.mjs.
export const PAGE_SIZE = 24;
export const CATEGORIES = [
  { folder: '3x3', label: '3×3', shape: 'cube', size: 3 },
  { folder: '2x2', label: '2×2', shape: 'cube', size: 2 },
  { folder: '4x4', label: '4×4', shape: 'cube', size: 4 },
  { folder: '5x5', label: '5×5', shape: 'cube', size: 5 },
  { folder: '6x6', label: '6×6', shape: 'cube', size: 6 },
  { folder: '7x7', label: '7×7', shape: 'cube', size: 7 },
  { folder: 'pyraminx', label: 'Pyraminx', shape: 'pyraminx' },
  { folder: 'megaminx', label: 'Megaminx', shape: 'megaminx' },
  { folder: 'skewb', label: 'Skewb', shape: 'skewb' },
  { folder: 'square-1', label: 'Square-1', shape: 'square1' },
  { folder: 'clock', label: 'Clock', shape: 'clock' },
];
export const categoryOf = folder => CATEGORIES.find(c => c.folder === folder);

/** A brand plus every brand below it (filtering by MoYu also shows PBCube, GuoGuan, ...). */
export function brandFamily(brands, id) {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const b of brands) if (b.parent && out.has(b.parent) && !out.has(b.id)) { out.add(b.id); grew = true; }
  }
  return out;
}

const UPPER = new Set(['gan', 'yj', 'mgc', 'qj', 'mf8', 'wr', 'wrm', 'rs', 'rs2', 'rs3', 'rs3m', 'rs4', 'rs5', 'ui', 'uv', 'sq1', 'ms', 'pb', 'm', 'v2', 'v3', 'v4', 'v5', 'v9', 'v10', 'v11', 'x', 'xs']);
export const titleFromFolder = folder => folder.split('-').map(w => (UPPER.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
