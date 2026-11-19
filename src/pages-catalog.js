// "Kệ Rubik": a showcase without prices. Products come from public/catalog/brands/<brand>/<category>/<model>/
// through the paged manifest made by scripts/build-catalog.mjs; pages and images load while scrolling.
import { brands } from './data/brands.js';
import { CATEGORIES, categoryOf, brandFamily } from './data/catalog-schema.js';
import { mechanisms, initMechanisms } from './components/mechanisms.js';
import { escapeHTML as esc } from './utils/ui.js';

const BASE = import.meta.env.BASE_URL;
const cache = new Map();
export async function getJSON(path) {
  if (!cache.has(path)) cache.set(path, fetch(BASE + path).then(r => { if (!r.ok) throw new Error(r.status + ' ' + path); return r.json(); }).catch(e => { cache.delete(path); throw e; }));
  return cache.get(path);
}
export const catalogIndex = () => getJSON('catalog/index.json');
const brandById = id => brands.find(b => b.id === id);
const imageURL = src => (/^https?:\/\//.test(src) ? src : BASE + src);
const TYPE_ALIASES = { Megaminx: 'megaminx', Pyraminx: 'pyraminx', Skewb: 'skewb', 'Square-1': 'square-1', Clock: 'clock' };

const logoPlaceholder = (b, cls) => `<span class="${cls} logo-ph" role="img" aria-label="${esc(b.name)}"><span>${esc(b.name)}</span></span>`;
/** Brand logo image from `b.logo` (path under public/ or https URL); grey placeholder when unset or broken. */
export function brandLogo(b, cls = 'brand-logo') {
  if (!b) return '';
  if (!b.logo) return logoPlaceholder(b, cls);
  return `<img class="${cls}" src="${esc(imageURL(b.logo))}" alt="${esc(b.name)}" loading="lazy" decoding="async" data-logo="${esc(b.id)}">`;
}

/** 4:3 placeholder in the style of placehold.co, drawn locally so it never depends on another site. */
export const placeholder = (name, big = false) => `<div class="ph${big ? ' big' : ''}" role="img" aria-label="Chưa có ảnh ${esc(name)}"><span>${esc(name)}</span><small>800 × 600</small></div>`;

function productImage(p, big = false) {
  if (!p.image) return placeholder(p.name, big);
  return `<img src="${esc(imageURL(p.image))}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="600" data-fallback="${esc(p.name)}"${big ? ' data-big' : ''}>`;
}
function wireFallbacks(el) {
  const onBroken = (img, swap) => { if (img.complete && img.naturalWidth === 0 && img.src) swap(); else img.addEventListener('error', swap, { once: true }); };
  el.querySelectorAll('img[data-fallback]').forEach(img => onBroken(img, () => { const d = document.createElement('div'); d.innerHTML = placeholder(img.dataset.fallback, img.hasAttribute('data-big')); img.replaceWith(d.firstChild); }));
  el.querySelectorAll('img[data-logo]').forEach(img => onBroken(img, () => { const d = document.createElement('div'); d.innerHTML = logoPlaceholder(brandById(img.dataset.logo), img.className); img.replaceWith(d.firstChild); }));
}

function cardHTML(p) {
  const b = brandById(p.brand), cat = categoryOf(p.category);
  return `<a class="product-card" href="#/cube/${p.brand}/${p.id}"><div class="product-image">${productImage(p)}</div>
   <div class="product-meta">${brandLogo(b)}<strong>${esc(p.name)}</strong><span class="product-sub">${esc(cat?.label || p.category)}${b ? ' · ' + esc(b.name) : ''}</span>
   ${p.tags.length ? `<span class="product-tags">${p.tags.slice(0, 2).map(t => `<i>${esc(t)}</i>`).join('')}</span>` : ''}</div></a>`;
}

export function catalog(root, params) {
  let brand = brandById(params.get('brand'))?.id || '';
  const t = params.get('cat') || TYPE_ALIASES[params.get('type')] || params.get('type') || '';
  let cat = categoryOf(t) ? t : '';
  let term = params.get('q') || '';
  let session = 0, io = null, timer;
  const ordered = [...brands.filter(b => !b.parent), ...brands.filter(b => b.parent)];

  root.innerHTML = `<section class="page-shell catalog-page"><div class="page-heading"><div><small>KỆ RUBIK / BỘ SƯU TẬP</small><h1>Một kệ trưng bày.<br><em>Không có giá.</em></h1></div>
   <p>Chọn hãng hoặc loại để xem. Ảnh và thông tin tải dần khi bạn cuộn. Đây là kệ tham khảo, không bán hàng.</p></div>
   <div class="brand-strip" role="group" aria-label="Lọc theo hãng"><button data-brand="" class="brand-chip all"><b>Tất cả</b><span class="chip-count"></span></button>${ordered.map(b => `<button data-brand="${b.id}" class="brand-chip" title="${esc(b.name)}${b.parent ? ' · thuộc ' + esc(brandById(b.parent)?.name || '') : ''}">${brandLogo(b)}<span class="chip-count"></span></button>`).join('')}</div>
   <div class="catalog-tools"><div class="cat-chips" role="group" aria-label="Lọc theo loại"><button data-cat="">Tất cả loại</button>${CATEGORIES.map(c => `<button data-cat="${c.folder}">${c.label} <span></span></button>`).join('')}</div>
   <label class="catalog-search">Tìm mẫu<input type="search" id="q" placeholder="WRM V11, Tornado, MGC…" value="${esc(term)}"></label></div>
   <div id="brand-info"></div><p class="case-count" id="count" aria-live="polite"></p>
   <div id="grid" class="product-grid"></div><div id="more" class="load-more"><span>Đang tải thêm…</span></div>
   <p class="muted catalog-note">Ảnh thuộc về chủ sở hữu (ghi công ở trang chi tiết). Mẫu chưa có ảnh hiển thị ảnh chờ. Logo hãng chưa có ảnh hiển thị ô chờ. <a href="#/sources">Nguồn dữ liệu ↗</a></p></section>`;

  const $ = s => root.querySelector(s);
  const grid = $('#grid'), more = $('#more'), count = $('#count');
  wireFallbacks(root.querySelector('.brand-strip'));

  function syncURL() {
    const q = new URLSearchParams();
    if (brand) q.set('brand', brand);
    if (cat) q.set('cat', cat);
    if (term.trim()) q.set('q', term.trim());
    const h = '#/catalog' + (q.toString() ? '?' + q : '');
    if (location.hash !== h) history.replaceState(null, '', h);
  }
  function append(items) {
    const tmp = document.createElement('div');
    tmp.innerHTML = items.map(cardHTML).join('');
    wireFallbacks(tmp);
    grid.append(...tmp.children);
  }

  async function load() {
    const my = ++session;
    io?.disconnect();
    grid.innerHTML = ''; more.hidden = false;
    root.querySelectorAll('[data-brand]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.brand === brand)));
    const chip = root.querySelector(`[data-brand="${brand}"]`), strip = chip?.parentElement;
    if (chip && strip) strip.scrollTo({ left: chip.offsetLeft - strip.offsetLeft - 16, behavior: 'smooth' });
    root.querySelectorAll('[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    syncURL();
    let index;
    try { index = await catalogIndex(); } catch { count.textContent = 'Chưa tải được danh mục. Hãy chạy “npm run catalog” rồi tải lại trang.'; more.hidden = true; return; }
    if (my !== session) return;
    root.querySelectorAll('[data-brand]').forEach(b => { b.querySelector('.chip-count').textContent = b.dataset.brand ? index.brandCounts[b.dataset.brand] || 0 : index.total; });
    root.querySelectorAll('[data-cat]').forEach(b => { const c = index.categories.find(x => x.folder === b.dataset.cat); if (c) b.querySelector('span').textContent = c.count; });
    const b = brandById(brand);
    const family = b ? [...brandFamily(brands, b.id)].filter(id => id !== b.id) : [];
    $('#brand-info').innerHTML = b ? `<div class="brand-panel" style="--brand:${b.color}">${brandLogo(b, 'brand-logo big')}<div><h2>${esc(b.name)}</h2><p>${esc(b.summary || '')}${b.country ? ` <span class="muted">· ${esc(b.country)}</span>` : ''}</p>
      ${family.length ? `<p class="muted">Gồm cả: ${family.map(id => esc(brandById(id).name)).join(', ')}.</p>` : ''}${b.parent ? `<p class="muted">Thương hiệu thuộc ${esc(brandById(b.parent).name)}.</p>` : ''}</div></div>` : '';
    wireFallbacks($('#brand-info'));

    if (term.trim()) {
      // Search uses the light index, still rendered page by page.
      const rows = await getJSON('catalog/search.json');
      if (my !== session) return;
      const fam = brand ? brandFamily(brands, brand) : null;
      const q = term.trim().toLowerCase();
      const hits = rows.filter(r => (!fam || fam.has(r.brand)) && (!cat || r.category === cat) && `${r.name} ${r.id} ${r.tags.join(' ')} ${brandById(r.brand)?.name}`.toLowerCase().includes(q));
      count.textContent = `${hits.length} mẫu khớp “${term.trim()}”`;
      let shown = 0;
      const step = () => { append(hits.slice(shown, shown + index.pageSize)); shown = Math.min(hits.length, shown + index.pageSize); more.hidden = shown >= hits.length; };
      step();
      if (!hits.length) grid.innerHTML = '<p class="empty-state">Không có mẫu phù hợp. Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>';
      io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting) && shown < hits.length) step(); }, { rootMargin: '800px' });
      io.observe(more);
      return;
    }
    const viewKey = brand ? `brand-${brand}` : cat ? `cat-${cat}` : 'all';
    const view = index.views[viewKey];
    if (!view) {
      count.textContent = '0 mẫu'; more.hidden = true;
      grid.innerHTML = `<p class="empty-state">Chưa có mẫu nào. Thêm thư mục vào <code>public/catalog/brands/${esc(brand || '…')}/</code> để mẫu xuất hiện ở đây.</p>`;
      return;
    }
    const filterCat = !!(brand && cat);
    count.textContent = filterCat ? `Đang tìm ${categoryOf(cat).label} của ${b.name}…` : `${view.total} mẫu`;
    let page = 0, busy = false, shownCount = 0;
    async function next() {
      if (busy || page >= view.pages || my !== session) return;
      busy = true;
      try {
        const items = await getJSON(`catalog/pages/${viewKey}/${page}.json`);
        if (my !== session) return;
        page++;
        const part = filterCat ? items.filter(p => p.category === cat) : items;
        shownCount += part.length;
        append(part);
        if (filterCat) count.textContent = `${shownCount} mẫu ${categoryOf(cat).label} của ${b.name}${page < view.pages ? '…' : ''}`;
      } catch {
        count.textContent = 'Lỗi tải trang danh mục. Kéo xuống để thử lại.';
      } finally {
        busy = false;
        if (my === session) {
          more.hidden = page >= view.pages;
          if (page >= view.pages && !grid.children.length) grid.innerHTML = '<p class="empty-state">Không có mẫu phù hợp bộ lọc.</p>';
          // A sparse filtered page may leave the sentinel on screen: keep filling.
          else if (page < view.pages && more.getBoundingClientRect().top < innerHeight + 800) setTimeout(next, 0);
        }
      }
    }
    io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) next(); }, { rootMargin: '800px' });
    io.observe(more);
    next();
  }

  root.querySelectorAll('[data-brand]').forEach(b => b.addEventListener('click', () => { brand = b.dataset.brand; load(); }));
  root.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.cat; load(); }));
  $('#q').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { term = e.target.value; load(); }, 200); });
  load();
  return () => { session++; io?.disconnect(); clearTimeout(timer); };
}

const MECH_IDS = { 'gan-17-magdrive': 'gan17', 'gan-16-maglev': 'gan16' };

/** Finds a product by brand + folder name through the brand's paged view. */
async function findProduct(brandId, id) {
  try {
    const view = (await catalogIndex()).views[`brand-${brandId}`];
    if (!view) return null;
    for (let i = 0; i < view.pages; i++) {
      const hit = (await getJSON(`catalog/pages/brand-${brandId}/${i}.json`)).find(p => p.id === id && p.brand === brandId);
      if (hit) return hit;
    }
  } catch { /* not found */ }
  return null;
}

export async function detail(root, brandId, id) {
  root.innerHTML = '<section class="page-shell"><p>Đang mở mẫu…</p></section>';
  const b = brandById(brandId);
  const p = b ? await findProduct(brandId, id) : null;
  if (!p) {
    root.innerHTML = '<section class="page-shell"><small>404 / KHÔNG TÌM THẤY</small><h1>Mẫu này chưa có trên kệ.</h1><a class="button primary" href="#/catalog">Về Kệ Rubik ↗</a></section>';
    return;
  }
  document.title = `${p.name} — SOBIK99`;
  const c = categoryOf(p.category);
  const credit = p.imageCredit ? `<p class="credit">Ảnh: ${p.imageCredit.url ? `<a href="${esc(p.imageCredit.url)}" target="_blank" rel="noopener">${esc(p.imageCredit.name || p.imageCredit.url)}</a>` : esc(p.imageCredit.name || '')}</p>` : '';
  root.innerHTML = `<section class="page-shell product-page"><a class="source-link" href="#/catalog?brand=${b.id}">← Kệ ${esc(b.name)}</a>
   <div class="product-layout"><div class="product-hero">${productImage(p, true)}${credit}</div>
   <div class="product-info">${brandLogo(b, 'brand-logo big')}<small>${esc(c?.label || p.category)} · ${esc(b.name)}</small><h1>${esc(p.name)}</h1>
   ${p.tags.length ? `<div class="product-tags">${p.tags.map(t => `<i>${esc(t)}</i>`).join('')}</div>` : ''}
   ${p.description ? `<p>${esc(p.description)}</p>` : ''}
   ${p.features.length ? `<h3>Đặc điểm nổi bật</h3><ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
   ${p.reviews.length ? `<h3>Nhận xét phổ biến</h3><ul>${p.reviews.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
   ${p.audience ? `<p><b>Phù hợp:</b> ${esc(p.audience)}</p>` : ''}
   ${!p.features.length && !p.reviews.length && !p.description ? '<p class="muted">Thông tin chi tiết đang được cập nhật.</p>' : ''}
   ${p.sources.length ? `<h3>Nguồn</h3><ul>${p.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || s.url)} ↗</a></li>`).join('')}</ul>` : ''}
   <div class="brand-panel small" style="--brand:${b.color}"><div><b>${esc(b.name)}</b><p>${esc(b.summary || '')}</p></div></div>
   <p class="muted">Kệ trưng bày tham khảo — không bán hàng, không có giá.</p></div></div>
   ${c?.shape === 'cube' ? mechanisms({ name: p.name, brand: b.id === 'gan' ? 'GAN' : b.name, id: MECH_IDS[p.id] || p.id }) : ''}</section>`;
  wireFallbacks(root);
  initMechanisms(root);
}
