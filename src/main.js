import { language, setLanguage, t as tr } from './utils/i18n.js';
import './styles.css';
import './app.css';
import './mobile.css';
import { landing } from './landing.js';
import { initModal, closeModal } from './utils/ui.js';
import { read, write } from './utils/storage.js';

document.documentElement.lang = language;
document.querySelectorAll('#site-language [data-language]').forEach(button => {
  const option = button.dataset.language;
  button.setAttribute('aria-pressed', String(option === language));
  button.addEventListener('click', () => setLanguage(option));
});
if (language === 'en') {
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = el.dataset.en; });
  document.querySelectorAll('[data-en-label]').forEach(el => el.setAttribute('aria-label', el.dataset.enLabel));
  document.querySelector('meta[name="description"]').content = 'SOBIK99 — browse cubes by brand, learn CFOP algorithms, solve a cube step by step, and time your solves.';
}

document.querySelector('.skip-link').onclick = e => { e.preventDefault(); const main = document.getElementById('main'); main.tabIndex = -1; main.focus(); main.scrollIntoView(); };
initModal();
let cleanup = () => {}, navigation = 0;

const compactToggle = document.getElementById('compact-mode');
const learnMenu = document.querySelector('.site-nav .nav-learn');
const wordmark = document.querySelector('.site-nav .wordmark');
let compactMode = read('sobik_compact_mode', false, value => typeof value === 'boolean');

function updateCompactMode() {
  compactToggle.checked = compactMode;
  document.body.classList.toggle('compact-mode', compactMode);
  wordmark.setAttribute('aria-label', compactMode ? 'SOBIK99' : tr('SOBIK99 Trang chủ', 'SOBIK99 home'));
  if (compactMode) {
    learnMenu.removeAttribute('href');
    wordmark.removeAttribute('href');
  } else {
    learnMenu.setAttribute('href', '#/guide');
    wordmark.setAttribute('href', '#/');
  }
}
compactToggle.addEventListener('change', () => {
  compactMode = compactToggle.checked;
  write('sobik_compact_mode', compactMode);
  updateCompactMode();
  route();
});
updateCompactMode();

const pages = {
  '/workshop': [tr('Xưởng Rubik', 'Cube Workshop'), tr('Đang mở xưởng…', 'Opening the workshop…'), () => import('./pages-workshop.js'), 'workshop'],
  '/catalog': [tr('Thư viện Rubik', 'Cube Library'), tr('Đang mở thư viện…', 'Opening Cube Library…'), () => import('./pages-catalog.js'), 'catalog'],
  '/guide': [tr('Học cách xoay', 'Learn'), tr('Đang mở lớp học…', 'Opening the guide…'), () => import('./pages-guide.js'), 'guide'],
  '/solve': [tr('Giải Rubik', 'Solve'), tr('Đang mở trình giải…', 'Opening the solver…'), () => import('./pages-solve.js'), 'solvePage'],
  '/timer': ['Timer', tr('Đang mở phòng luyện tập…', 'Opening the timer…'), () => import('./pages-timer.js'), 'timerPage'],
  '/sources': [tr('Nguồn hình ảnh', 'Photo credits'), tr('Đang tải…', 'Loading…'), () => import('./pages-sources.js'), 'sourcesPage'],
};

async function route() {
  const ticket = ++navigation;
  cleanup(); cleanup = () => {};
  closeModal();
  const [requestedPath, query = ''] = (location.hash.slice(1) || '/').split('?');
  const path = compactMode ? '/guide' : requestedPath;
  const params = new URLSearchParams(path === requestedPath ? query : '');
  const root = document.getElementById('main');
  window.scrollTo({ top: 0, behavior: 'instant' });
  const navPath = path.startsWith('/cube/') ? '/catalog' : path;
  document.querySelectorAll('.site-nav nav a').forEach(a => {
    if (navPath === (a === learnMenu ? '/guide' : a.hash.slice(1))) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  try {
    if (path === '/') { document.title = 'SOBIK99'; cleanup = landing(root) || (() => {}); return; }
    if (path.startsWith('/cube/')) {
      const [, , brand, id] = path.split('/');
      root.innerHTML = `<section class="page-shell"><p>${tr('Đang mở mẫu…', 'Opening puzzle…')}</p></section>`;
      const { detail } = await import('./pages-catalog.js');
      if (ticket === navigation) await detail(root, decodeURIComponent(brand || ''), decodeURIComponent(id || ''), () => ticket === navigation);
      return;
    }
    const page = pages[path];
    if (!page) {
      document.title = tr('Không tìm thấy trang — SOBIK99', "Page not found — SOBIK99");
      root.innerHTML = tr('<section class="page-shell"><small>404 / LẠC MỘT VÒNG XOAY</small><h1>Trang này chưa tồn tại.</h1><a class="button primary" href="#/">Về trang chủ ↗</a></section>', "<section class=\"page-shell\"><small>404 / PAGE NOT FOUND</small><h1>This page doesn't exist.</h1><a class=\"button primary\" href=\"#/\">Back to home ↗</a></section>");
      return;
    }
    const [title, loading, load, entry] = page;
    document.title = `${title} — SOBIK99`;
    root.innerHTML = `<section class="page-shell"><p>${loading}</p></section>`;
    const module = await load();
    if (ticket !== navigation) return;
    const dispose = await module[entry](root, params, compactMode);
    if (ticket === navigation) cleanup = typeof dispose === 'function' ? dispose : () => {};
    else if (typeof dispose === 'function') dispose();
  } catch (error) {
    if (ticket !== navigation) return;
    console.error(error);
    if (compactMode) {
      root.innerHTML = `<section class="page-shell"><h1>${tr('Chưa mở được bài học.', "Couldn't open the guide.")}</h1></section>`;
      return;
    }
    root.innerHTML = tr('<section class="page-shell"><h1>Chưa mở được trang.</h1><p>Hãy tải lại trang hoặc trở về trang chủ.</p><a href="#/" class="button primary">Về trang chủ</a></section>', "<section class=\"page-shell\"><h1>Couldn't open this page.</h1><p>Reload the page or return home.</p><a href=\"#/\" class=\"button primary\">Back to home</a></section>");
  }
}
window.addEventListener('hashchange', route);
route();
