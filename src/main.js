import './styles.css';
import './app.css';
import { landing } from './landing.js';
import { initModal, closeModal } from './utils/ui.js';

document.querySelector('.skip-link').onclick = e => { e.preventDefault(); const main = document.getElementById('main'); main.tabIndex = -1; main.focus(); main.scrollIntoView(); };
initModal();
let cleanup = () => {}, navigation = 0;

const pages = {
  '/catalog': ['Kệ Rubik', 'Đang mở kệ…', async (root, params) => (await import('./pages-catalog.js')).catalog(root, params)],
  '/guide': ['Học cách xoay', 'Đang mở lớp học…', async (root, params) => (await import('./pages-guide.js')).guide(root, params)],
  '/solve': ['Giải Rubik', 'Đang mở trình giải…', async (root, params) => (await import('./pages-solve.js')).solvePage(root, params)],
  '/blindfold': ['Rubik bịt mắt', 'Đang mở bài học…', async root => (await import('./pages-blindfold.js')).blindfoldPage(root)],
  '/timer': ['Timer', 'Đang mở phòng luyện tập…', async root => (await import('./pages-timer.js')).timerPage(root)],
  '/sources': ['Nguồn dữ liệu', 'Đang tải…', async root => (await import('./pages-sources.js')).sourcesPage(root)],
};

async function route() {
  const ticket = ++navigation;
  cleanup(); cleanup = () => {};
  closeModal();
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const root = document.getElementById('main');
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelectorAll('.site-nav nav a').forEach(a => { if (path.startsWith(a.hash.slice(1))) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  try {
    if (path === '/') { document.title = 'SOBIK99 — Cube Club'; cleanup = landing(root) || (() => {}); return; }
    if (path.startsWith('/cube/')) {
      const [, , brand, id] = path.split('/');
      root.innerHTML = '<section class="page-shell"><p>Đang mở mẫu…</p></section>';
      const { detail } = await import('./pages-catalog.js');
      if (ticket === navigation) await detail(root, decodeURIComponent(brand || ''), decodeURIComponent(id || ''));
      return;
    }
    const page = pages[path];
    if (!page) {
      document.title = 'Không tìm thấy trang — SOBIK99';
      root.innerHTML = '<section class="page-shell"><small>404 / LẠC MỘT VÒNG XOAY</small><h1>Trang này chưa tồn tại.</h1><a class="button primary" href="#/">Về trang chủ ↗</a></section>';
      return;
    }
    const [title, loading, open] = page;
    document.title = `${title} — SOBIK99`;
    root.innerHTML = `<section class="page-shell"><p>${loading}</p></section>`;
    if (ticket !== navigation) return;
    const dispose = await open(root, params);
    if (ticket === navigation) cleanup = typeof dispose === 'function' ? dispose : () => {};
    else if (typeof dispose === 'function') dispose();
  } catch (error) {
    console.error(error);
    root.innerHTML = '<section class="page-shell"><h1>Chưa mở được trang.</h1><p>Hãy tải lại trang hoặc trở về trang chủ.</p><a href="#/" class="button primary">Về trang chủ</a></section>';
  }
}
window.addEventListener('hashchange', route);
route();
