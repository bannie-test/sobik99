import { t as tr } from './utils/i18n.js';
import { webURL } from './utils/web-url.js';
import { escapeHTML as esc } from './utils/ui.js';
import { getJSON } from './pages-catalog.js';

export async function sourcesPage(root) {
  root.innerHTML = `<section class="page-shell source-page">
    <h1>${tr('Nguồn hình ảnh', 'Photo credits')}</h1>
    <div id="credits" aria-live="polite"><p class="muted">${tr('Đang tải…', 'Loading…')}</p></div>
  </section>`;
  const credits = root.querySelector('#credits');
  try {
    const rows = await getJSON('catalog/search.json');
    const credited = rows.flatMap(row => {
      const url = webURL(row.imageCredit?.url);
      const name = esc(row.imageCredit?.name || url);
      if (!name) return [];
      const attribution = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${name} ↗</a>` : name;
      return [`<li>${esc(row.name)} — ${attribution}</li>`];
    });
    credits.innerHTML = `<ul><li>${tr('Logo thương hiệu', 'Brand logos')} — <a href="https://www.thecubicle.com/en-asia/pages/collections/top-brands" target="_blank" rel="noopener">TheCubicle ↗</a></li>
      ${credited.join('')}</ul>`;
  } catch {
    credits.textContent = tr('Chưa tải được nguồn hình ảnh.', 'Could not load the photo credits.');
  }
}
