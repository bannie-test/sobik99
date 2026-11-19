import cases from './data/algorithms.js';
import { lessons, notation } from './data/lessons.js';
import { puzzleTypes } from './data/puzzles.js';
import { caseOf } from './core/cfop.js';
import { caseDiagram } from './components/diagrams.js';
import { mountPlayer, retarget } from './components/player.js';
import { escapeHTML as esc, copy, openModal, toast } from './utils/ui.js';
import { read, write } from './utils/storage.js';

let learned = read('sobik_learned', [], v => Array.isArray(v) && v.every(x => typeof x === 'string'));
const puzzleID = t => (/^\dx\d$/.test(t) ? `${t[0]}x${t[0]}x${t[0]}` : t.toLowerCase());
const PAGE = 12;
const SOURCE_NOTE = { modern: 'Công thức phổ biến hiện nay', coach: 'Từ Cube Coach (MIT)', sobik: 'Từ thư viện SOBIK' };

/**
 * Plays one of a case's algorithms from the state it solves, held yellow-up / white-down, ending
 * fully solved. The select lists every algorithm of the case, starting on `pick`; switching it
 * re-targets the player and reports the choice through `onPick` (to keep the card in sync).
 */
export function playCase(c, pick = 0, onPick) {
  const maskLastLayer = c.type === 'f2l';
  const algOf = i => c.algs[i].alg;
  const setupOf = i => `z2 ${caseOf(c.type, algOf(i)).setup}`;
  openModal(`<small>THẤY TỪNG CHUYỂN ĐỘNG</small><h2>${esc(c.name)}</h2>
   <p>Cầm <b>vàng trên, trắng dưới, xanh lá trước</b>. Mô hình bắt đầu từ trạng thái của case và kết thúc khi cube được giải hoàn toàn.</p>
   <label class="variant-select">Cách xoay<select id="variant-select">${c.algs.map((a, i) => `<option value="${i}"${i === pick ? ' selected' : ''}>${i + 1} · ${esc(a.label)} — ${esc(a.alg)}</option>`).join('')}</select></label>
   <div id="player-mount" class="player-box"></div><code class="alg-large" id="player-alg">${esc(algOf(pick))}</code>
   <button class="button secondary" id="copy-player">Sao chép</button>`, el => {
    let player = null, shown = pick;
    const select = el.querySelector('#variant-select');
    el.querySelector('#copy-player').onclick = () => copy(algOf(pick));
    select.onchange = () => {
      pick = +select.value;
      el.querySelector('#player-alg').textContent = algOf(pick);
      onPick?.(pick);
      if (player) { retarget(player, { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }); shown = pick; }
    };
    mountPlayer(el.querySelector('#player-mount'), { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }).then(p => {
      player = p;
      if (p && shown !== pick) { retarget(p, { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }); shown = pick; }
    });
  });
}

export function playAlgorithm(alg, puzzle = '3x3', title = 'Công thức') {
  openModal(`<small>THẤY TỪNG CHUYỂN ĐỘNG</small><h2>${esc(title)}</h2><p>Trạng thái đầu được dựng từ nghịch đảo công thức, vì vậy chạy hết công thức là khối trở về đã giải.</p><div id="player-mount" class="player-box"></div><code class="alg-large">${esc(alg)}</code><button class="button secondary" id="copy-player">Sao chép</button>`, el => {
    el.querySelector('#copy-player').onclick = () => copy(alg);
    (async () => {
      let setup = '';
      try { const { Alg } = await import('cubing/alg'); setup = new Alg(alg).invert().toString(); } catch { /* play from solved */ }
      if (el.isConnected) mountPlayer(el.querySelector('#player-mount'), { setup, alg, puzzle: puzzleID(puzzle) });
    })();
  });
}

function crossPanel() {
  return `<div class="cross-workshop"><div class="cross-shape"><i></i><i></i><i></i><i></i><i></i></div><div>
   <h3>Cross là bài toán lập kế hoạch.</h3>
   <p>Cross không có danh sách công thức cố định: mỗi scramble cần một đường đi riêng (tối đa 8 bước). Cầm trắng ở dưới để không phải lật khối khi chuyển sang F2L.</p>
   <ol><li>Tìm cả bốn cạnh trắng trong lúc quan sát.</li><li>Định trước thứ tự chèn, tính cả việc khớp màu bên với tâm.</li><li>Thực hiện liền mạch, rồi so với lời giải tối ưu.</li></ol>
   <p>Bài luyện dùng scramble ngẫu nhiên: trình giải làm Cross tối ưu, rồi bạn bấm <b>Giải tiếp</b> để đi trọn F2L → OLL → PLL cho đến khi cube được giải.</p>
   <div class="row-buttons"><a class="button primary" href="#/solve?random=1&goal=cross">Luyện Cross với scramble mới ↗</a><a class="button secondary" href="#/solve?random=1">Xem một lần giải trọn vẹn ↗</a></div></div></div>`;
}

function card(c) {
  const isLearned = learned.includes(c.id);
  return `<article class="algorithm-card alg-card" data-case="${c.id}" id="case-${c.id}">
   <div class="case-heading"><strong>${esc(c.name)}</strong><button class="learn-toggle" data-learn aria-pressed="${isLearned}" aria-label="Đánh dấu đã học ${esc(c.name)}">${isLearned ? '✓' : '○'}</button></div>
   <div class="case-figure">${caseDiagram(c)}</div>
   <small>${esc(c.group_vi)}</small>
   ${c.recognition ? `<p class="recognition">${esc(c.recognition)}</p>` : ''}
   <div class="variant-chips" role="radiogroup" aria-label="Các cách giải">${c.algs.map((a, i) => `<button type="button" role="radio" data-variant="${i}" aria-checked="${i === 0}" title="${esc(SOURCE_NOTE[a.source])}">${i + 1} · ${esc(a.label)}</button>`).join('')}</div>
   <code>${esc(c.algs[0].alg)}</code>
   <div class="actions"><button class="small-button" data-copy>Sao chép</button><button class="small-button primary" data-play>▶ Xem cách xoay</button></div>
  </article>`;
}

export function guide(root, params) {
  let puzzle = params.get('puzzle') || '3x3';
  if (!lessons[puzzle]) puzzle = '3x3';
  const focus = cases.find(c => c.id === params.get('case'));
  let phase = focus ? focus.type : ['cross', 'f2l', 'oll', 'pll'].includes(params.get('phase')) ? params.get('phase') : 'f2l';
  const lesson = lessons[puzzle];
  const counts = t => cases.filter(c => c.type === t).length;
  const totalAlgs = cases.reduce((n, c) => n + c.algs.length, 0);
  root.innerHTML = `<section class="page-shell guide-page"><div class="page-heading"><div><small>CUBE SCHOOL / ${puzzle}</small><h1>${lesson.title.replace('. ', '.<br><em>')}${lesson.title.includes('. ') ? '</em>' : ''}</h1></div><p>${lesson.intro}</p></div>
  <div class="guide-layout"><aside class="guide-sidebar"><small>CHỌN HÌNH KHỐI</small><nav aria-label="Loại Rubik">${puzzleTypes.map(t => `<a href="#/guide?puzzle=${t}" ${t === puzzle ? 'aria-current="page"' : ''}>${t}<span>↗</span></a>`).join('')}</nav>
  <details class="notation" open><summary>Bảng ký hiệu</summary><dl>${notation.map(([n, d]) => `<dt>${esc(n)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></details></aside>
  <div class="guide-main"><div class="learning-intro"><small>HIỂU TRƯỚC. XOAY SAU.</small><h2>Lộ trình của bạn.</h2>${lesson.steps.map(([title, text], i) => `<details class="lesson" ${i === 0 ? 'open' : ''}><summary><span>0${i + 1}</span>${esc(title)}</summary><p>${esc(text)}</p></details>`).join('')}<a href="${lesson.source}" target="_blank" rel="noopener" class="source-link">Tài liệu tham khảo thêm ↗</a></div>
  ${puzzle === '3x3' ? `<section class="algorithm-library"><div class="section-heading"><div><small>CFOP / THƯ VIỆN THẾ GIẢI</small><h2>Nhìn thế. Chọn cách.</h2></div><span class="chip">${cases.length} CASE · ${totalAlgs} CÔNG THỨC</span></div>
   <div class="hold-banner"><span class="hold-cube" aria-hidden="true"><i></i><i></i><i></i></span><p><b>Mặt vàng là mặt cuối.</b> Mọi hình và mô hình đều cầm trắng ở dưới, vàng ở trên, xanh lá phía trước — đúng tư thế khi bạn giải CFOP.</p></div>
   <div class="phase-tabs" role="group" aria-label="Giai đoạn CFOP">${[['cross', 'Cross'], ['f2l', `F2L · ${counts('f2l')}`], ['oll', `OLL · ${counts('oll')}`], ['pll', `PLL · ${counts('pll')}`]].map(([id, label]) => `<button data-phase="${id}" aria-pressed="${id === phase}">${label}</button>`).join('')}</div>
   <div id="case-tools"><label>Tìm case<input id="case-search" placeholder="Sune, OLL 27, T, R U R'…" type="search"></label><label>Nhóm<select id="case-group"></select></label><label class="checkbox-label"><input type="checkbox" id="unlearned"> Chưa đánh dấu đã học</label></div>
   <p class="case-count" aria-live="polite"></p><div id="case-grid"></div><div id="case-more" class="load-more" aria-hidden="true"></div>
   <p class="muted">Mỗi case có nhiều cách giải. “Khuyên dùng” là lựa chọn mặc định của trình giải; “Hiện đại” là những công thức phổ biến hiện nay trong cộng đồng speedcubing. Mọi công thức được kiểm chứng tự động trên mô hình cube. Hình minh họa đổi theo công thức bạn chọn, vì một số công thức cần chỉnh U trước khác nhau.</p>
   <a class="source-link" href="#/sources">Nguồn công thức và giấy phép ↗</a></section>`
    : `<section class="algorithm-library"><small>LUYỆN BẰNG MÔ HÌNH</small><h2>${lesson.algs.length ? 'Một vài chuyển động để bắt đầu.' : 'Từ ý tưởng đến luyện tập.'}</h2>${lesson.algs.length ? lesson.algs.map(([name, alg], i) => `<article class="tutorial-alg"><h3>${esc(name)}</h3><code>${esc(alg)}</code><button class="button secondary" data-tutorial="${i}">Xem chuyển động ↗</button></article>`).join('') : `<p>Với ${puzzle}, ưu tiên nhận diện tâm, cạnh và quỹ đạo trước khi áp dụng công thức. Theo lộ trình bên trên, luyện từng bước trên khối thật.</p><a class="button primary" href="${lesson.source}" target="_blank" rel="noopener">Mở tài liệu ${puzzle} ↗</a>`}</section>`}
  </div></div></section>`;
  root.querySelectorAll('[data-tutorial]').forEach(b => { b.onclick = () => { const [title, alg] = lesson.algs[+b.dataset.tutorial]; playAlgorithm(alg, puzzle, title); }; });
  if (puzzle !== '3x3') return () => {};

  const grid = root.querySelector('#case-grid'), search = root.querySelector('#case-search'), group = root.querySelector('#case-group');
  const onlyNew = root.querySelector('#unlearned'), more = root.querySelector('#case-more'), tools = root.querySelector('#case-tools');
  let list = [], shown = 0;
  const find = id => cases.find(c => c.id === id);

  function wire(el) {
    const c = find(el.dataset.case);
    let pick = 0;
    const choose = i => {
      pick = i;
      el.querySelectorAll('[data-variant]').forEach(x => x.setAttribute('aria-checked', String(+x.dataset.variant === i)));
      const alg = c.algs[pick].alg;
      el.querySelector('code').textContent = alg;
      el.querySelector('.case-figure').innerHTML = caseDiagram(c, caseOf(c.type, alg).setup);
    };
    el.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => choose(+b.dataset.variant)));
    el.querySelector('[data-copy]').onclick = () => copy(c.algs[pick].alg);
    el.querySelector('[data-play]').onclick = () => playCase(c, pick, choose);
    el.querySelector('[data-learn]').onclick = e => {
      learned = learned.includes(c.id) ? learned.filter(x => x !== c.id) : [...learned, c.id];
      if (!write('sobik_learned', learned)) toast('Không lưu được tiến độ vào trình duyệt.');
      const on = learned.includes(c.id);
      e.currentTarget.setAttribute('aria-pressed', String(on));
      e.currentTarget.textContent = on ? '✓' : '○';
      counter();
    };
  }
  function counter() {
    root.querySelector('.case-count').textContent = phase === 'cross' ? 'Cross không cần học thuộc công thức — hãy luyện lập kế hoạch.' : `${list.length} case · ${cases.filter(c => c.type === phase && learned.includes(c.id)).length} đã đánh dấu học`;
  }
  function appendPage() {
    const next = list.slice(shown, shown + PAGE);
    if (!next.length) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = next.map(card).join('');
    [...tmp.children].forEach(el => { wire(el); grid.append(el); });
    shown += next.length;
  }
  function render() {
    root.querySelectorAll('[data-phase]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.phase === phase)));
    tools.hidden = phase === 'cross';
    if (phase === 'cross') { list = []; shown = 0; grid.className = ''; grid.innerHTML = crossPanel(); counter(); return; }
    const term = search.value.trim().toLowerCase();
    list = cases.filter(c => c.type === phase && (!group.value || c.group === group.value) && (!onlyNew.checked || !learned.includes(c.id)) &&
      `${c.name} ${c.short} ${c.group} ${c.group_vi} ${c.recognition} ${c.algs.map(a => a.alg).join(' ')}`.toLowerCase().includes(term));
    grid.className = 'case-grid';
    grid.innerHTML = list.length ? '' : '<p class="empty-state">Không có case phù hợp. Thử xóa tìm kiếm hoặc đổi nhóm.</p>';
    shown = 0;
    appendPage();
    counter();
  }
  function groups() {
    group.innerHTML = '<option value="">Tất cả nhóm</option>' + [...new Set(cases.filter(c => c.type === phase).map(c => c.group))].map(g => `<option value="${esc(g)}">${esc(cases.find(c => c.group === g).group_vi)}</option>`).join('');
  }
  root.querySelectorAll('[data-phase]').forEach(b => { b.onclick = () => { phase = b.dataset.phase; search.value = ''; groups(); render(); }; });
  [search, group, onlyNew].forEach(el => el.addEventListener('input', render));
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) appendPage(); }, { rootMargin: '600px' });
  io.observe(more);
  groups();
  render();
  if (focus) {
    while (shown < list.length && !root.querySelector(`#case-${CSS.escape(focus.id)}`)) appendPage();
    const el = root.querySelector(`#case-${CSS.escape(focus.id)}`);
    el?.classList.add('focused');
    setTimeout(() => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }
  return () => io.disconnect();
}
