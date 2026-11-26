// Scans catalog-source/brands/<brand>/<category>/<model>/ (info.json + optional image.*) and writes
// the paged manifest the catalog page loads while scrolling:
//   public/catalog/index.json            brands, categories, views and their page counts
//   public/catalog/pages/<view>/<n>.json 24 products per page
//   public/catalog/search.json           light rows for search and image credits
// Runs automatically before `npm run dev` and `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { brands, catalogBrands } from '../src/cube-tools/data/brands.js';
import { CATEGORIES, PAGE_SIZE, brandFamily, titleFromFolder } from '../src/cube-tools/data/catalog-schema.js';

const PUBLIC = new URL('../public/', import.meta.url).pathname;
const ROOT = new URL('../catalog-source/brands/', import.meta.url).pathname;
const OUT = path.join(PUBLIC, 'catalog');
const IMAGE = /\.(webp|avif|png|jpe?g)$/i;
const hidden = n => n.startsWith('.') || n.endsWith('.md');
const dirs = p => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory() && !hidden(d.name)).map(d => d.name).sort() : []);
const warnings = [];

const known = new Set(brands.map(b => b.id));
for (const folder of dirs(ROOT)) if (!known.has(folder)) warnings.push(`Thư mục hãng "${folder}" chưa có trong src/cube-tools/data/brands.js — bị bỏ qua.`);

// Only model images are eligible for publication from the authoring tree.
fs.rmSync(path.join(OUT, 'images'), { recursive: true, force: true });

const products = [];
for (const b of catalogBrands) {
  for (const category of dirs(path.join(ROOT, b.id))) {
    const cat = CATEGORIES.find(c => c.folder === category);
    if (!cat) { warnings.push(`${b.id}/${category}: loại không hợp lệ (dùng ${CATEGORIES.map(c => c.folder).join(', ')}).`); continue; }
    for (const model of dirs(path.join(ROOT, b.id, category))) {
      const dir = path.join(ROOT, b.id, category, model);
      const rel = `${b.id}/${category}/${model}`;
      let info = {};
      const infoFile = path.join(dir, 'info.json');
      if (fs.existsSync(infoFile)) {
        try { info = JSON.parse(fs.readFileSync(infoFile, 'utf8')); } catch (e) { warnings.push(`${rel}/info.json lỗi JSON: ${e.message}`); }
      }
      const selectedImage = typeof info.image === 'string' && info.image
        ? info.image
        : fs.readdirSync(dir).find(n => /^image\./i.test(n) && IMAGE.test(n));
      let image = null;
      if (selectedImage && /^https?:\/\//.test(selectedImage)) {
        image = selectedImage;
      } else if (selectedImage) {
        const source = path.resolve(dir, selectedImage);
        const relative = path.relative(dir, source);
        if (relative.startsWith('..') || !IMAGE.test(source) || !fs.statSync(source, { throwIfNoEntry: false })?.isFile() ||
            !fs.realpathSync(source).startsWith(fs.realpathSync(dir) + path.sep)) {
          warnings.push(`${rel}: không thấy ảnh hợp lệ ${selectedImage}`);
        } else {
          image = `catalog/images/${rel}/${path.basename(source)}`;
          const target = path.join(PUBLIC, image);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(source, target);
        }
      }
      products.push({
        id: model, brand: b.id, category, name: String(info.name || titleFromFolder(model)),
        tags: Array.isArray(info.tags) ? info.tags.map(String) : [],
        features: Array.isArray(info.features) ? info.features.map(String) : [],
        reviews: Array.isArray(info.reviews) ? info.reviews.map(String) : [],
        audience: String(info.audience || ''), description: String(info.description || ''),
        image, imageCredit: info.imageCredit || null,
        sources: Array.isArray(info.sources) ? info.sources.filter(s => s && s.url) : [],
      });
    }
  }
}
const catIndex = c => CATEGORIES.findIndex(x => x.folder === c);
const brandIndex = id => catalogBrands.findIndex(b => b.id === id);
products.sort((a, b) => catIndex(a.category) - catIndex(b.category) || brandIndex(a.brand) - brandIndex(b.brand) || a.name.localeCompare(b.name));

fs.rmSync(path.join(OUT, 'pages'), { recursive: true, force: true });
const views = {};
function writeView(key, list) {
  if (!list.length) return;
  const pages = Math.ceil(list.length / PAGE_SIZE);
  fs.mkdirSync(path.join(OUT, 'pages', key), { recursive: true });
  for (let i = 0; i < pages; i++) fs.writeFileSync(path.join(OUT, 'pages', key, `${i}.json`), JSON.stringify(list.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE)));
  views[key] = { total: list.length, pages };
}
writeView('all', products);
for (const b of catalogBrands) { const fam = brandFamily(catalogBrands, b.id); writeView(`brand-${b.id}`, products.filter(p => fam.has(p.brand))); }
for (const c of CATEGORIES) writeView(`cat-${c.folder}`, products.filter(p => p.category === c.folder));

const counts = Object.fromEntries(catalogBrands.map(b => [b.id, products.filter(p => brandFamily(catalogBrands, b.id).has(p.brand)).length]));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10), total: products.length, pageSize: PAGE_SIZE, withImage: products.filter(p => p.image).length,
  views, brandCounts: counts, categories: CATEGORIES.map(c => ({ ...c, count: products.filter(p => p.category === c.folder).length })),
}));
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(products.map(({ brand, category, id, name, tags, image, imageCredit }) => ({ brand, category, id, name, tags, image, ...(imageCredit ? { imageCredit } : {}) }))));
console.log(`Catalog: ${products.length} mẫu (${products.filter(p => p.image).length} có ảnh), ${Object.keys(views).length} view.`);
for (const w of warnings) console.warn('  ! ' + w);
