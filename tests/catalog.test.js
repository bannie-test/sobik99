import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { brands, catalogBrands } from '../src/data/brands.js';
import { CATEGORIES, brandFamily, titleFromFolder } from '../src/data/catalog-schema.js';

const root = new URL('../public/catalog/', import.meta.url);
const source = new URL('../catalog-source/brands/', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root)));

test('every brand has a folder and every folder is a known brand and category', () => {
  const folders = fs.readdirSync(source).filter(n => !n.startsWith('.'));
  assert.deepEqual(new Set(folders), new Set(brands.map(b => b.id)));
  const cats = new Set(CATEGORIES.map(c => c.folder));
  for (const b of folders) for (const c of fs.readdirSync(new URL(`${b}/`, source)).filter(n => !n.startsWith('.'))) assert.ok(cats.has(c), `${b}/${c}`);
});

test('manifest pages cover every model exactly once and brand views include sub-brands', () => {
  const index = read('index.json');
  const all = [];
  for (let i = 0; i < index.views.all.pages; i++) all.push(...read(`pages/all/${i}.json`));
  assert.equal(all.length, index.total);
  assert.ok(all.every(p => !Object.hasOwn(p, 'path')));
  assert.ok(!fs.existsSync(new URL('brands/', root)));
  assert.equal(new Set(all.map(p => `${p.brand}/${p.category}/${p.id}`)).size, all.length);
  assert.ok(all.every(p => p.name && CATEGORIES.some(c => c.folder === p.category)));
  assert.deepEqual(new Set(Object.keys(index.brandCounts)), new Set(catalogBrands.map(b => b.id)));
  assert.ok(all.every(p => catalogBrands.some(b => b.id === p.brand)));
  assert.ok(brandFamily(catalogBrands, 'moyu').has('cubing-classroom'));
  const moyu = [];
  for (let i = 0; i < index.views['brand-moyu'].pages; i++) moyu.push(...read(`pages/brand-moyu/${i}.json`));
  assert.ok(moyu.some(p => p.brand === 'cubing-classroom') && moyu.some(p => p.brand === 'moyu'));
  assert.ok(index.views.all.pages > 1, 'catalog is paged');
});

test('folder names become readable titles when info.json has no name', () => {
  assert.equal(titleFromFolder('moyu-wrm-v11'), 'Moyu WRM V11');
  assert.equal(titleFromFolder('gan-356-m'), 'GAN 356 M');
});
