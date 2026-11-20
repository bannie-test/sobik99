// Imports speed cubes from Shopify shops (SpeedCubeShop, The Cubicle) into the folder-driven catalog.
//
//   npm run import:cubicle                     # every page of the default collections
//   npm run import:cubicle -- <collection url>  # other collections (all pages are followed)
//   npm run import:cubicle -- --refresh         # ignore the download cache
//   npm run import:cubicle -- --verbose         # list skipped products
//
// 1. Every product of the 3x3 collections becomes catalog-source/brands/<brand>/3x3/<handle>/info.json
//    (unless the same cube is already on the shelf: then that folder is enriched instead).
// 2. Every hand-written model without a photo (any category) is matched by name against all the
//    shops' products (the `all` collections) and gains the missing image, description and source.
// No prices are copied. Images stay on the shops' CDN and are credited per product.
// Re-running is safe: imported folders are refreshed; hand-written text is never overwritten.
// Pages are cached in node_modules/.cache/shop-import for a day, so re-runs do not hit rate limits.
import fs from 'node:fs';
import path from 'node:path';
import { brands, brandAliases, catalogBrands } from '../src/data/brands.js';
import { CATEGORIES, brandFamily } from '../src/data/catalog-schema.js';

// Collections whose products are added to the shelf (3x3 only).
const DEFAULT = ['https://speedcubeshop.com/collections/3x3-speed-cubes/products.json', 'https://www.thecubicle.com/collections/3x3-speed-cubes/products.json'];
// Collections only used to find photos for models already on the shelf.
const LOOKUP = ['https://speedcubeshop.com/collections/all/products.json', 'https://www.thecubicle.com/collections/all/products.json'];
const SHOP_NAMES = { 'speedcubeshop.com': 'SpeedCubeShop', 'www.thecubicle.com': 'The Cubicle', 'thecubicle.com': 'The Cubicle' };
const ROOT = new URL('../catalog-source/brands/', import.meta.url).pathname;
const CACHE = new URL('../node_modules/.cache/shop-import/', import.meta.url).pathname;
const CACHE_MS = 24 * 3600 * 1000;

// Shop handle -> existing folder (brand/<folder>, 3x3) describing the same cube.
const MATCH = {
  'dayan-tengyun-m-3x3': 'dayan/dayan-tengyun-m',
  'gan15-maglev-uv-3x3': 'gan/gan-15-maglev',
  'gan12-m-maglev-uv-3x3': 'gan/gan-12-maglev',
  'moyu-weilong-wrm-v10-3x3-20-core-magnetic-ball-core-uv': 'moyu/moyu-weilong-wrm-v10',
  'moyu-rs3-m-v5-3x3-maglev-robot-cube-stand': 'moyu/moyu-rs3m-v5',
  'swift-block-super-maglev-uv-3x3': 'swift-block/swift-super-maglev',
  'yj-yulong-v2-m': 'yj/yj-yulong-v2m',
};
// Not a 3x3 even though shops file it under 3x3 / shape mods.
const SKIP = /\b(FTO|Bundle|Gift Card|Stand|Timer|Lube|Mat)\b/i;

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const sources = args.filter(a => !a.startsWith('--'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- download (all pages, cached, polite on 429) ---------- */
async function fetchJSON(url) {
  const file = path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]+/gi, '_') + '.json');
  if (!refresh && fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < CACHE_MS) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (catalog import)', Accept: 'application/json' } });
    if (r.status === 429 || r.status >= 500) {
      const wait = (+r.headers.get('retry-after') || 15 * 2 ** attempt) * 1000;
      console.log(`  … ${r.status} ${new URL(url).host}, chờ ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      continue;
    }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const data = await r.json();
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data));
    await sleep(1500);
    return data;
  }
  throw new Error(`Bị giới hạn tốc độ quá lâu: ${url}`);
}

/** Every product of a collection, following ?page= until an empty page. */
async function collection(src) {
  if (!/^https?:\/\//.test(src)) return JSON.parse(fs.readFileSync(src, 'utf8')).products || [];
  const base = new URL(src);
  base.searchParams.delete('page');
  base.searchParams.set('limit', '250');
  const shop = base.host;
  const out = [];
  for (let page = 1; page < 200; page++) {
    base.searchParams.set('page', String(page));
    const { products = [] } = await fetchJSON(base.toString());
    if (!products.length) break;
    out.push(...products.map(p => ({ ...p, shop })));
    process.stdout.write(`\r  ${shop}${base.pathname.replace('/products.json', '')}: ${out.length} sản phẩm (trang ${page})`);
  }
  process.stdout.write('\n');
  return out;
}

/* ---------- product -> info.json ---------- */
const byId = new Map(brands.map(b => [b.id, b]));
function brandOf(p) {
  const names = [p.vendor, ...p.tags.filter(t => /^(Manufacturer|Brand)_/i.test(t)).map(t => t.replace(/^[^_]+_/, ''))];
  for (const raw of names) {
    const k = String(raw || '').trim().toLowerCase();
    const id = brandAliases[k] || brands.find(b => b.id === k || b.name.toLowerCase() === k)?.id || brandAliases[k.replace(/\s+/g, '')];
    if (id && byId.has(id)) return id;
  }
  // Fall back to a brand named at the start of the title ("MoYu WeiLong …").
  const t = p.title.toLowerCase();
  return [...brands].sort((a, b) => b.name.length - a.name.length).find(b => t.startsWith(b.name.toLowerCase() + ' '))?.id || null;
}

/** Catalog category of a product, from its title and product type. */
function categoryOf(p) {
  const s = `${p.title} ${p.product_type || ''}`.toLowerCase();
  if (/pyraminx/.test(s)) return 'pyraminx';
  if (/megaminx/.test(s)) return 'megaminx';
  if (/skewb/.test(s)) return 'skewb';
  if (/square[- ]?1|\bsq-?1\b/.test(s)) return 'square-1';
  if (/\bclock\b/.test(s)) return 'clock';
  const m = s.match(/\b([2-7])x\1\b/);
  return m ? `${m[1]}x${m[1]}` : null;
}

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&ndash;|&mdash;/g, '–').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/ ([,.;:!?)])/g, '$1').replace(/\( /g, '(').trim();
function describe(html = '') {
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => text(m[1])).filter(t => t.length > 40);
  let d = paras[0] || text(html);
  if (d.length > 420) d = d.slice(0, 420).replace(/[^.!?]*$/, '') || d.slice(0, 420) + '…';
  return d;
}
const bullets = html => [...(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => text(m[1])).filter(t => t && t.length < 160).slice(0, 6);
const dimension = p => { const d = p.tags.find(x => x.startsWith('Dimensions_')); return d ? +d.slice(11) : null; };

function tagsOf(p) {
  const t = new Set();
  const title = p.title;
  if (/maglev/i.test(title)) t.add('MagLev');
  if (/ball-core|ball core/i.test(title)) t.add('Ball-core');
  if (/\bUV\b/.test(title)) t.add('UV');
  if (p.tags.includes('Magnets_Magnetic') || /magnetic|\bM\b/.test(title)) t.add('Nam châm');
  if (/\bi Carry\b|smart/i.test(title)) t.add('Thông minh');
  if (p.tags.includes('Type_Shape Mods')) t.add('Biến thể');
  if (p.tags.includes('limitededition') || /edition|\bLE\b/i.test(title)) t.add('Bản đặc biệt');
  if (dimension(p)) t.add(`${dimension(p)} mm`);
  return [...t];
}

const shopName = p => SHOP_NAMES[p.shop] || p.shop;
const productURL = p => `https://${p.shop}/products/${p.handle}`;
function imageOf(p) {
  const src = p.images?.[0]?.src || p.variants?.find(v => v.featured_image)?.featured_image?.src;
  return src ? src + (src.includes('?') ? '&' : '?') + 'width=800' : null;
}
function infoOf(p) {
  const url = productURL(p), img = imageOf(p);
  const features = bullets(p.body_html);
  if (dimension(p) && !features.some(f => /mm\b/.test(f))) features.unshift(`Kích thước ${dimension(p)} mm`);
  return {
    name: p.title,
    tags: tagsOf(p),
    description: describe(p.body_html),
    features,
    ...(img ? { image: img, imageCredit: { name: shopName(p), url } } : {}),
    sources: [{ name: shopName(p), url }],
    importedFrom: { shop: p.shop, handle: p.handle, updated: p.updated_at?.slice(0, 10) },
  };
}

/**
 * Adds to a hand-written info.json only what it lacks; never overwrites its own text. Everything
 * added is recorded in `imported` so the next run can undo it first (see `handWritten`).
 */
function merge(old, add) {
  const out = { ...old };
  const rec = { fields: [], tags: [], sources: [], ...(old.imported || {}) };
  for (const k of ['description', 'image', 'imageCredit']) if (!out[k] && add[k]) { out[k] = add[k]; rec.fields.push(k); }
  const tags = [...(out.tags || [])];
  for (const t of add.tags || []) if (!tags.some(x => x.toLowerCase() === t.toLowerCase())) { tags.push(t); rec.tags.push(t); }
  out.tags = tags;
  const sources = [...(out.sources || [])];
  for (const s of add.sources) if (!sources.some(x => x.url === s.url)) { sources.push(s); rec.sources.push(s.url); }
  out.sources = sources;
  out.imported = rec;
  return out;
}
/** A hand-written info.json without what earlier imports added to it. */
function handWritten(info) {
  const rec = info.imported || { fields: info.importedFields || [] };
  const out = { ...info };
  for (const k of rec.fields || []) delete out[k];
  if (out.tags) out.tags = out.tags.filter(t => !(rec.tags || []).includes(t));
  if (out.sources) out.sources = out.sources.filter(s => !(rec.sources || []).includes(s.url));
  delete out.imported; delete out.importedFields;
  return out;
}

/* ---------- name matching ---------- */
const NOISE = new Set(['cube', 'cubes', 'speed', 'speedcube', 'magnetic', 'uv', 'coated', 'the', 'and', 'with', 'version', 'stickerless', 'new', 'by', 'enhanced', 'standard', 'puzzle']);
const familyWords = id => new Set([...brandFamily(brands, id), brands.find(b => b.id === id)?.parent].filter(Boolean)
  .flatMap(x => [x, byId.get(x)?.name || '']).flatMap(s => s.toLowerCase().split(/[^a-z0-9]+/)));
/** Comparable words of a model name: "GAN12 M MagLev UV 3x3" -> {12, m, maglev}. */
function words(name, brandId) {
  const skip = familyWords(brandId);
  const s = name.toLowerCase().replace(/×/g, 'x').replace(/\+/g, ' plus ').replace(/\b(\d)x\1(x\1)?\b/g, ' ').replace(/(\d+)\s*mm\b/g, ' $1mm ')
    .replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])(?!m\b)/g, '$1 $2');
  return new Set(s.split(/[^a-z0-9]+/).filter(w => w && !NOISE.has(w) && !skip.has(w)));
}
const related = (a, b) => brandFamily(brands, a).has(b) || brandFamily(brands, b).has(a);
/** Name words without the shop's bracketed notes: "(Magnetic, MagLev, Core Magnets)" etc. */
const coreWords = (title, brand) => words(title.replace(/\([^)]*\)/g, ' '), brand);
const sameWords = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
/** A product may lend its photo to a model of the same brand or one of its sub-brands; a model of a
 *  sub-brand only takes a parent-brand product whose title names the sub-brand ("YJ MGC …"). */
const canDress = (p, m) => p.brand === m.brand || brandFamily(brands, m.brand).has(p.brand) ||
  (byId.get(m.brand)?.parent === p.brand && p.title.toLowerCase().includes(byId.get(m.brand).name.toLowerCase().replace(/^the /, '')));
/** Best product whose name contains every word of the model's name (fewest extra words wins). */
function bestMatch(model, products) {
  // A lone size digit means the category ("MeiLong 4 M" in 4x4), unlike "V3" or "i3".
  const size = model.category.match(/^(\d)x\1$/)?.[1];
  const want = words(size ? model.name.replace(new RegExp(`(^|\\s)${size}(?=\\s|$)`, 'g'), ' ') : model.name, model.brand);
  // Short names ("YJ MGC 4x4", "GAN 356 X V2") only take an almost exact title.
  const specific = [...want].some(w => /[a-z]/.test(w) && w.length > 1);
  let best = null;
  for (const p of products) {
    if (p.category !== model.category || !p.brand || !canDress(p, model) || SKIP.test(p.title)) continue;
    const have = matchWords(p);
    if (![...want].every(w => have.has(w))) continue;
    // A one-letter model mark the name does not have ("WR S" for "WR M") is another cube.
    if ([...p.words].some(w => /^[a-z]$/.test(w) && w !== 'v' && w !== 'm' && !want.has(w))) continue;
    const extra = p.words.size - want.size + (imageOf(p) ? 0 : 100);
    if (!specific && extra > 2) continue;
    if (!best || extra < best.extra) best = { p, extra };
  }
  return best && imageOf(best.p) ? best.p : null;
}
/** Product words plus joined neighbours ("wr m" also gives "wrm") and "m" for magnetic cubes. */
function matchWords(p) {
  if (p.matchWords) return p.matchWords;
  const list = [...p.words];
  const out = new Set(list);
  for (let i = 1; i < list.length; i++) out.add(list[i - 1] + list[i]);
  if (/magnetic/i.test(p.title) || p.tags.includes('Magnets_Magnetic')) out.add('m');
  return (p.matchWords = out);
}

/* ---------- run ---------- */
const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const shelf = new Map(); // folder path -> { brand, category, folder, info, name, shop?, dirty }
const generated = new Set(); // folders written by an earlier run
for (const { id: b } of catalogBrands) for (const c of fs.existsSync(path.join(ROOT, b)) ? fs.readdirSync(path.join(ROOT, b)) : []) {
  if (!CATEGORIES.some(x => x.folder === c)) continue;
  for (const m of fs.readdirSync(path.join(ROOT, b, c))) {
    const dir = path.join(ROOT, b, c, m);
    if (!fs.statSync(dir).isDirectory()) continue;
    const raw = readJSON(path.join(dir, 'info.json')) || {};
    const info = raw.importedFrom ? raw : handWritten(raw);
    const files = fs.readdirSync(dir);
    const hasPhoto = files.some(n => /^image\./i.test(n));
    // Folders this script made are rebuilt from the shops each run (unless you added files to them).
    if (info.importedFrom && files.every(n => n === 'info.json')) { generated.add(dir); continue; }
    shelf.set(dir, { brand: b, category: c, folder: m, info, hasPhoto, dirty: JSON.stringify(info) !== JSON.stringify(raw), name: info.name || m.replace(/-/g, ' ') });
  }
}
const prepare = list => list.map(p => {
  const brand = brandOf(p);
  return { ...p, brand, category: categoryOf(p), words: words(p.title, brand || '') };
});

const stats = { created: 0, updated: 0, merged: 0, photos: 0, skipped: [] };
const added = prepare((await Promise.all((sources.length ? sources : DEFAULT).map(collection))).flat());
const seen = new Set();
for (const p of added) {
  const key = `${p.shop}/${p.handle}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (p.category !== '3x3' || SKIP.test(p.title)) { stats.skipped.push(`${p.title} (không phải khối 3x3)`); continue; }
  if (!p.brand) { stats.skipped.push(`${p.title} (chưa có hãng "${p.vendor}" trong brands.js)`); continue; }
  const match = MATCH[p.handle];
  if (!byId.get(p.brand)?.logo || (match && !byId.get(match.split('/')[0])?.logo)) {
    stats.skipped.push(`${p.title} (hãng chưa có logo)`);
    continue;
  }
  const info = infoOf(p);
  // Same cube already on the shelf? explicit MATCH, the same handle, or the same name (bracketed
  // notes ignored) from a hand-written model or the other shop. A shop's own variants stay separate.
  const core = coreWords(p.title, p.brand);
  let dir = match ? path.join(ROOT, match.replace('/', '/3x3/')) : null;
  dir ||= [...shelf.keys()].find(d => shelf.get(d).folder === p.handle && shelf.get(d).shop !== p.shop);
  dir ||= [...shelf.entries()].find(([, m]) => m.category === '3x3' && m.shop !== p.shop && related(m.brand, p.brand) && sameWords(coreWords(m.name, m.brand), core))?.[0];
  if (!dir || !shelf.has(dir)) {
    dir ||= path.join(ROOT, p.brand, '3x3', p.handle);
    shelf.set(dir, { brand: p.brand, category: '3x3', folder: path.basename(dir), info, name: p.title, shop: p.shop, dirty: true });
    stats.created++;
    continue;
  }
  const m = shelf.get(dir);
  m.info = merge(m.info, info);
  m.dirty = true;
  stats.merged++;
}

// Photos for models that still have none, matched against everything the shops sell.
const missing = [...shelf.values()].filter(m => !m.hasPhoto && !m.info.image);
if (missing.length) {
  console.log(`Tìm ảnh cho ${missing.length} mẫu chưa có ảnh…`);
  const pool = [...added, ...prepare((await Promise.all(LOOKUP.map(collection))).flat())];
  for (const m of missing) {
    const p = bestMatch(m, pool);
    if (!p) continue;
    const match = MATCH[p.handle];
  if (!byId.get(p.brand)?.logo || (match && !byId.get(match.split('/')[0])?.logo)) {
    stats.skipped.push(`${p.title} (hãng chưa có logo)`);
    continue;
  }
  const info = infoOf(p);
    m.info = merge(m.info, { tags: [], description: info.description, image: info.image, imageCredit: info.imageCredit, sources: info.sources });
    m.dirty = true;
    stats.photos++;
    console.log(`  + ${m.brand}/${m.category}/${m.folder}  ←  ${p.title} (${shopName(p)})`);
  }
}

let removed = 0;
for (const dir of generated) if (!shelf.has(dir)) { fs.rmSync(dir, { recursive: true }); removed++; }
for (const [dir, m] of shelf) {
  if (!m.dirty && !generated.has(dir)) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify(m.info, null, 2) + '\n');
}
const still = [...shelf.values()].filter(m => !m.hasPhoto && !m.info.image);
console.log(`\nMẫu từ shop: ${stats.created} · gộp vào mẫu có sẵn/shop kia: ${stats.merged} · thêm ảnh cho mẫu viết tay: ${stats.photos} · xoá mẫu nhập cũ không còn dùng: ${removed}`);
console.log(`Còn ${still.length} mẫu chưa có ảnh${still.length ? ':' : '.'}`);
for (const m of still) console.log(`  · ${m.brand}/${m.category}/${m.folder}`);
const skipped = [...new Set(stats.skipped)];
if (skipped.length) console.log(`Bỏ qua ${skipped.length} sản phẩm (không phải 3x3 hoặc hãng chưa có).`);
if (args.includes('--verbose')) for (const s of skipped) console.log('  - ' + s);
console.log('Chạy "npm run catalog" (tự chạy cùng dev/build/test) để cập nhật danh mục.');
