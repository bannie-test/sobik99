import { language, setLanguage, t as tr } from './utils/i18n.js';
import './styles.css';
import './app.css';
import './mobile.css';
import { landing } from './landing.js';
import { initModal, closeModal } from './utils/ui.js';

document.documentElement.lang = language;
const languagePicker = document.getElementById('site-language');
languagePicker.value = language;
languagePicker.addEventListener('change', () => setLanguage(languagePicker.value));
if (language === 'en') {
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = el.dataset.en; });
  document.querySelectorAll('[data-en-label]').forEach(el => el.setAttribute('aria-label', el.dataset.enLabel));
  document.querySelector('meta[name="description"]').content = 'SOBIK99 — browse cubes by brand, learn CFOP algorithms, solve a cube step by step, and time your solves.';
}

document.querySelector('.skip-link').onclick = e => { e.preventDefault(); const main = document.getElementById('main'); main.tabIndex = -1; main.focus(); main.scrollIntoView(); };
initModal();
let cleanup = () => {}, navigation = 0;

const pages = {
  '/catalog': [tr('Thư viện Rubik', "Cube Library"), tr('Đang mở thư viện…', "Opening Cube Library…"), async (root, params) => (await import('./pages-catalog.js')).catalog(root, params)],
  '/guide': [tr('Học cách xoay', "Learn"), tr('Đang mở lớp học…', "Opening the guide…"), async (root, params) => (await import('./pages-guide.js')).guide(root, params)],
  '/solve': [tr('Giải Rubik', "Solve"), tr('Đang mở trình giải…', "Opening the solver…"), async (root, params) => (await import('./pages-solve.js')).solvePage(root, params)],
  // '/blindfold': [tr('Rubik bịt mắt', "Blindfold Solving"), tr('Đang mở bài học…', "Opening the lesson…"), async root => (await import('./pages-blindfold.js')).blindfoldPage(root)],
  '/timer': ['Timer', tr('Đang mở phòng luyện tập…', "Opening the timer…"), async root => (await import('./pages-timer.js')).timerPage(root)],
  '/sources': [tr('Nguồn hình ảnh', "Photo credits"), tr('Đang tải…', "Loading…"), async root => (await import('./pages-sources.js')).sourcesPage(root)],
};

async function route() {
  const ticket = ++navigation;
  cleanup(); cleanup = () => {};
  closeModal();
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const root = document.getElementById('main');
  window.scrollTo({ top: 0, behavior: 'instant' });
  const navPath = path.startsWith('/cube/') ? '/catalog' : path;
  document.querySelectorAll('.site-nav nav a').forEach(a => {
    if (navPath === a.hash.slice(1)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  try {
    if (path === '/') { document.title = 'SOBIK99 — Cube Club'; cleanup = landing(root) || (() => {}); return; }
    if (path.startsWith('/cube/')) {
      const [, , brand, id] = path.split('/');
      root.innerHTML = `<section class="page-shell"><p>${tr('Đang mở mẫu…', 'Opening puzzle…')}</p></section>`;
      const { detail } = await import('./pages-catalog.js');
      if (ticket === navigation) await detail(root, decodeURIComponent(brand || ''), decodeURIComponent(id || ''));
      return;
    }
    const page = pages[path];
    if (!page) {
      document.title = tr('Không tìm thấy trang — SOBIK99', "Page not found — SOBIK99");
      root.innerHTML = tr('<section class="page-shell"><small>404 / LẠC MỘT VÒNG XOAY</small><h1>Trang này chưa tồn tại.</h1><a class="button primary" href="#/">Về trang chủ ↗</a></section>', "<section class=\"page-shell\"><small>404 / PAGE NOT FOUND</small><h1>This page doesn't exist.</h1><a class=\"button primary\" href=\"#/\">Back to home ↗</a></section>");
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
    root.innerHTML = tr('<section class="page-shell"><h1>Chưa mở được trang.</h1><p>Hãy tải lại trang hoặc trở về trang chủ.</p><a href="#/" class="button primary">Về trang chủ</a></section>', "<section class=\"page-shell\"><h1>Couldn't open this page.</h1><p>Reload the page or return home.</p><a href=\"#/\" class=\"button primary\">Back to home</a></section>");
  }
}
window.addEventListener('hashchange', route);
route();
