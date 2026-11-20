import { t as tr } from './utils/i18n.js';
import cases from './data/algorithms.js';
import { algorithmLabel, caseGroup, caseRecognition } from './data/algorithm-text.js';
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
const SOURCE_NOTE = { modern: tr('Công thức phổ biến hiện nay', "Commonly used algorithm"), coach: tr('Từ Cube Coach (MIT)', "From Cube Coach (MIT)"), sobik: tr('Từ thư viện SOBIK', "From the SOBIK library") };

function playbackModal(title, alg, options, neighbors) {
  return `<section class="algorithm-playback" aria-label="${esc(title)}">
    <div class="playback-heading">
      <h2 aria-live="polite">${esc(title)}</h2>
      ${neighbors ? `<div class="playback-nav" role="group" aria-label="${tr('Chuyển công thức', 'Browse algorithms')}">
        <button type="button" class="small-button" data-adjacent="-1" aria-label="${tr('Công thức trước', 'Previous algorithm')}" ${neighbors.previous ? '' : 'disabled'}>←</button>
        <button type="button" class="small-button" data-adjacent="1" aria-label="${tr('Công thức tiếp theo', 'Next algorithm')}" ${neighbors.next ? '' : 'disabled'}>→</button>
      </div>` : ''}
    </div>
    ${options}
    <div id="player-mount" class="player-box"></div>
    <details class="playback-formula">
      <summary>${tr('Công thức', 'Algorithm')}</summary>
      <div class="formula-row">
        <code id="player-alg" tabindex="0">${esc(alg)}</code>
        <button class="small-button" id="copy-player">${tr('Sao chép', 'Copy')}</button>
      </div>
    </details>
  </section>`;
}

function wirePlaybackNavigation(el, neighbors) {
  if (!neighbors) return;
  el.querySelectorAll('[data-adjacent]').forEach(button => {
    button.onclick = () => {
      const direction = Number(button.dataset.adjacent);
      (direction < 0 ? neighbors.previous : neighbors.next)();
      const target = el.querySelector(`[data-adjacent="${direction}"]:enabled`) || el.querySelector('[data-adjacent]:enabled');
      target?.focus();
    };
  });
}

function adjacent(items, index, open) {
  if (items.length < 2) return undefined;
  return {
    previous: index > 0 ? () => open(index - 1) : null,
    next: index < items.length - 1 ? () => open(index + 1) : null,
  };
}

/**
 * Plays one of a case's algorithms from the state it solves, held yellow-up / white-down, ending
 * fully solved. The select lists every algorithm of the case, starting on `pick`; switching it
 * re-targets the player and reports the choice through `onPick` (to keep the card in sync).
 */
export function playCase(c, pick = 0, onPick, neighbors) {
  const maskLastLayer = c.type === 'f2l';
  const algOf = i => c.algs[i].alg;
  const setupOf = i => `z2 ${caseOf(c.type, algOf(i)).setup}`;
  const options = `<div class="playback-variant">
    <label class="variant-select">${tr('Cách xoay', 'Variant')}
      <select id="variant-select">${c.algs.map((a, i) => `<option value="${i}"${i === pick ? ' selected' : ''}>${i + 1} · ${esc(algorithmLabel(a))}</option>`).join('')}</select>
    </label>
    <p>${tr('Vàng trên, trắng dưới, xanh lá trước.', 'Yellow on top, white below, green in front.')}</p>
  </div>`;
  const navigation = c.algs.length > 1 || neighbors ? {
    previous: pick > 0 || Boolean(neighbors?.previous),
    next: pick < c.algs.length - 1 || Boolean(neighbors?.next),
  } : undefined;
  openModal(playbackModal(c.name, algOf(pick), options, navigation), el => {
    let player = null, shown = pick, closed = false;
    const select = el.querySelector('#variant-select');
    el.querySelector('#copy-player').onclick = () => copy(algOf(pick));
    const previous = el.querySelector('[data-adjacent="-1"]');
    const next = el.querySelector('[data-adjacent="1"]');
    function choose(index) {
      pick = index;
      select.value = String(pick);
      if (previous) previous.disabled = pick === 0 && !neighbors?.previous;
      if (next) next.disabled = pick === c.algs.length - 1 && !neighbors?.next;
      el.querySelector('#player-alg').textContent = algOf(pick);
      onPick?.(pick);
      if (player) { retarget(player, { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }); shown = pick; }
    }
    select.onchange = () => choose(Number(select.value));
    wirePlaybackNavigation(el, navigation && {
      previous: () => { if (pick > 0) choose(pick - 1); else neighbors?.previous?.(); },
      next: () => { if (pick < c.algs.length - 1) choose(pick + 1); else neighbors?.next?.(); },
    });
    mountPlayer(el.querySelector('#player-mount'), { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }).then(p => {
      if (closed) { p?.destroy(); return; }
      player = p;
      if (p && shown !== pick) { retarget(p, { setup: setupOf(pick), alg: algOf(pick), maskLastLayer }); shown = pick; }
    });
    return () => { closed = true; player?.destroy(); };
  });
}

export function playAlgorithm(alg, puzzle = '3x3', title = tr('Công thức', "Algorithm"), neighbors) {
  openModal(playbackModal(title, alg, '', neighbors), el => {
    wirePlaybackNavigation(el, neighbors);
    const mount = el.querySelector('#player-mount');
    let player, closed = false;
    el.querySelector('#copy-player').onclick = () => copy(alg);
    (async () => {
      let setup = '';
      try { const { Alg } = await import('cubing/alg'); setup = new Alg(alg).invert().toString(); } catch { /* play from solved */ }
      if (closed || !mount.isConnected) return;
      player = await mountPlayer(mount, { setup, alg, puzzle: puzzleID(puzzle) });
      if (closed) player?.destroy();
    })();
    return () => { closed = true; player?.destroy(); };
  });
}

function crossPanel() {
  return `<div class="cross-workshop"><div class="cross-shape"><i></i><i></i><i></i><i></i><i></i></div><div>
   <h3>${tr("Cross là bài toán lập kế hoạch.", "Plan your cross before turning.")}</h3>
   <p>${tr("Cross không có danh sách công thức cố định: mỗi scramble cần một đường đi riêng (tối đa 8 bước). Cầm trắng ở dưới để không phải lật khối khi chuyển sang F2L.", "Each scramble needs its own cross solution, up to eight moves. Hold white on the bottom so you can move straight into F2L.")}</p>
   <ol><li>${tr("Tìm cả bốn cạnh trắng trong lúc quan sát.", "Find all four white edges during inspection.")}</li><li>${tr("Định trước thứ tự chèn, tính cả việc khớp màu bên với tâm.", "Plan your insertions and match each side color to its center.")}</li><li>${tr("Thực hiện liền mạch, rồi so với lời giải tối ưu.", "Execute the plan in one go and compare it with the optimal solution.")}</li></ol>
   <p>${tr("Bài luyện dùng scramble ngẫu nhiên: trình giải làm Cross tối ưu, rồi bạn bấm", "The drill generates a random scramble and finds an optimal cross. Select")} <b>${tr("Giải tiếp", "Continue solving")}</b> ${tr("để đi trọn F2L → OLL → PLL cho đến khi cube được giải.", "to finish with F2L → OLL → PLL.")}</p>
   <div class="row-buttons"><a class="button primary" href="#/solve?random=1&goal=cross">${tr("Luyện Cross với scramble mới ↗", "Practice cross with a new scramble ↗")}</a><a class="button secondary" href="#/solve?random=1">${tr("Xem một lần giải trọn vẹn ↗", "Watch a full solve ↗")}</a></div></div></div>`;
}

function card(c) {
  const isLearned = learned.includes(c.id);
  return `<article class="algorithm-card alg-card" data-case="${c.id}" id="case-${c.id}">
   <div class="case-heading"><strong>${esc(c.name)}</strong><button class="learn-toggle" data-learn aria-pressed="${isLearned}" aria-label="${tr("Đánh dấu đã học", "Mark as learned:")} ${esc(c.name)}">${isLearned ? '✓' : '○'}</button></div>
   <div class="case-figure">${caseDiagram(c)}</div>
   <small>${esc(caseGroup(c))}</small>
   ${c.recognition ? `<p class="recognition">${esc(caseRecognition(c))}</p>` : ''}
   <div class="variant-chips" role="radiogroup" aria-label="${tr("Các cách giải", "Algorithm variants")}">${c.algs.map((a, i) => `<button type="button" role="radio" data-variant="${i}" aria-checked="${i === 0}" title="${esc(SOURCE_NOTE[a.source])}">${i + 1} · ${esc(algorithmLabel(a))}</button>`).join('')}</div>
   <button type="button" class="algorithm-open" data-open-algorithm aria-label="${tr('Xem cách xoay', 'Watch algorithm')} ${esc(c.name)}"><code>${esc(c.algs[0].alg)}</code></button>
   <div class="actions"><button class="small-button" data-copy>${tr("Sao chép", "Copy")}</button><button class="small-button primary" data-play>${tr("▶ Xem cách xoay", "▶ Watch algorithm")}</button></div>
  </article>`;
}

export function guide(root, params) {
  let puzzle = params.get('puzzle') || '3x3';
  if (!lessons[puzzle]) puzzle = '3x3';
  const focus = cases.find(c => c.id === params.get('case'));
  let phase = focus ? focus.type : ['cross', 'f2l', 'oll', 'pll'].includes(params.get('phase')) ? params.get('phase') : 'f2l';
  const lesson = lessons[puzzle];
  const counts = t => cases.filter(c => c.type === t).length;
  const compact = matchMedia('(max-width: 760px)').matches;
  const totalAlgs = cases.reduce((n, c) => n + c.algs.length, 0);
  root.innerHTML = `<section class="page-shell guide-page"><div class="page-heading"><div><small>CUBE SCHOOL / ${puzzle}</small><h1>${lesson.title.replace('. ', '.<br><em>')}${lesson.title.includes('. ') ? '</em>' : ''}</h1></div><p>${lesson.intro}</p></div>
  <div class="guide-layout"><aside class="guide-sidebar"><small>${tr("CHỌN HÌNH KHỐI", "CHOOSE A PUZZLE")}</small><nav aria-label="${tr("Loại Rubik", "Puzzle types")}">${puzzleTypes.map(t => `<a href="#/guide?puzzle=${t}" ${t === puzzle ? 'aria-current="page"' : ''}>${t}<span>↗</span></a>`).join('')}</nav>
  <details class="notation"${compact ? '' : ' open'}><summary>${tr("Bảng ký hiệu", "Move notation")}</summary><dl>${notation.map(([n, d]) => `<dt>${esc(n)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></details></aside>
  <div class="guide-main"><details class="learning-intro guide-roadmap"${compact ? '' : ' open'}><summary>${tr('Lộ trình học', 'Learning path')}</summary>${lesson.steps.map(([title, text], i) => `<details class="lesson" ${i === 0 ? 'open' : ''}><summary><span>0${i + 1}</span>${esc(title)}</summary><p>${esc(text)}</p></details>`).join('')}<a href="${lesson.source}" target="_blank" rel="noopener" class="source-link">${tr("Tài liệu tham khảo thêm ↗", "Further reading ↗")}</a></details>
  ${puzzle === '3x3' ? `<section class="algorithm-library"><div class="section-heading"><div><small>${tr("CFOP / THƯ VIỆN THẾ GIẢI", "CFOP / ALGORITHM LIBRARY")}</small><h2>${tr("Nhìn thế. Chọn cách.", "Recognize the case. Pick an algorithm.")}</h2></div><span class="chip">${cases.length} CASE · ${totalAlgs} ${tr("CÔNG THỨC", "ALGORITHMS")}</span></div>
   <div class="hold-banner"><span class="hold-cube" aria-hidden="true"><i></i><i></i><i></i></span><p><b>${tr("Mặt vàng là mặt cuối.", "Yellow is the last layer.")}</b> ${tr("Mọi hình và mô hình đều cầm trắng ở dưới, vàng ở trên, xanh lá phía trước — đúng tư thế khi bạn giải CFOP.", "All diagrams and models show white on the bottom, yellow on top, and green in front for CFOP.")}</p></div>
   <div class="phase-tabs" role="group" aria-label="${tr("Giai đoạn CFOP", "CFOP stage")}">${[['cross', 'Cross'], ['f2l', `F2L · ${counts('f2l')}`], ['oll', `OLL · ${counts('oll')}`], ['pll', `PLL · ${counts('pll')}`]].map(([id, label]) => `<button data-phase="${id}" aria-pressed="${id === phase}">${label}</button>`).join('')}</div>
   <div id="case-tools"><label>${tr("Tìm case", "Find a case")}<input id="case-search" placeholder="Sune, OLL 27, T, R U R'…" type="search"></label><label>${tr("Nhóm", "Group")}<select id="case-group"></select></label><label class="checkbox-label"><input type="checkbox" id="unlearned"> ${tr("Chưa đánh dấu đã học", "Unlearned only")}</label></div>
   <p class="case-count" aria-live="polite"></p><div id="case-grid"></div><div id="case-more" class="load-more" aria-hidden="true"></div>
   <p class="muted">${tr("Mỗi case có nhiều cách giải. “Khuyên dùng” là lựa chọn mặc định của trình giải; “Hiện đại” là những công thức phổ biến hiện nay trong cộng đồng speedcubing. Mọi công thức được kiểm chứng tự động trên mô hình cube. Hình minh họa đổi theo công thức bạn chọn, vì một số công thức cần chỉnh U trước khác nhau.", "Each case has several algorithms. The solver uses the recommended one by default. Modern algorithms are popular in the speedcubing community. Every algorithm is checked against the cube model. The diagram changes with your selection because the initial U adjustment can vary.")}</p>
   </section>`
    : `<section class="algorithm-library"><small>${tr("LUYỆN BẰNG MÔ HÌNH", "PRACTICE WITH A MODEL")}</small><h2>${lesson.algs.length ? tr('Một vài chuyển động để bắt đầu.', "A few moves to get started.") : tr('Từ ý tưởng đến luyện tập.', "Put it into practice.")}</h2>${lesson.algs.length ? lesson.algs.map(([name, alg], i) => `<article class="tutorial-alg"><h3>${esc(name)}</h3><button type="button" class="algorithm-open" data-tutorial="${i}" aria-label="${tr('Xem chuyển động', 'Watch the moves')} ${esc(name)}"><code>${esc(alg)}</code></button><button class="button secondary" data-tutorial="${i}">${tr("Xem chuyển động ↗", "Watch the moves ↗")}</button></article>`).join('') : `<p>${tr("Với", "For")} ${puzzle}${tr(", ưu tiên nhận diện tâm, cạnh và quỹ đạo trước khi áp dụng công thức. Theo lộ trình bên trên, luyện từng bước trên khối thật.", ", learn to recognize centers, edges, and piece orbits before applying algorithms. Practice each step above on a real puzzle.")}</p><a class="button primary" href="${lesson.source}" target="_blank" rel="noopener">${tr("Mở tài liệu", "Open the guide for")} ${puzzle} ↗</a>`}</section>`}
  </div></div></section>`;
  function openTutorial(index) {
    const [title, alg] = lesson.algs[index];
    playAlgorithm(alg, puzzle, title, adjacent(lesson.algs, index, openTutorial));
  }
  root.querySelectorAll('[data-tutorial]').forEach(b => { b.onclick = () => openTutorial(Number(b.dataset.tutorial)); });
  if (puzzle !== '3x3') return () => {};

  const grid = root.querySelector('#case-grid'), search = root.querySelector('#case-search'), group = root.querySelector('#case-group');
  const onlyNew = root.querySelector('#unlearned'), more = root.querySelector('#case-more'), tools = root.querySelector('#case-tools');
  let list = [], shown = 0;
  const find = id => cases.find(c => c.id === id);

  const picks = new Map();

  function choose(c, pick, el = document.getElementById(`case-${c.id}`)) {
    picks.set(c.id, pick);
    if (!el) return;
    el.querySelectorAll('[data-variant]').forEach(x => x.setAttribute('aria-checked', String(+x.dataset.variant === pick)));
    const alg = c.algs[pick].alg;
    el.querySelector('code').textContent = alg;
    el.querySelector('.case-figure').innerHTML = caseDiagram(c, caseOf(c.type, alg).setup);
  }

  function openCase(index, variant = picks.get(list[index].id) ?? 0) {
    const c = list[index];
    const neighbors = {
      previous: index > 0 ? () => openCase(index - 1, list[index - 1].algs.length - 1) : null,
      next: index < list.length - 1 ? () => openCase(index + 1, 0) : null,
    };
    playCase(c, variant, pick => choose(c, pick), neighbors.previous || neighbors.next ? neighbors : undefined);
  }

  function wire(el) {
    const c = find(el.dataset.case);
    if (picks.has(c.id)) choose(c, picks.get(c.id), el);
    el.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => choose(c, +b.dataset.variant, el)));
    el.querySelector('[data-copy]').onclick = () => copy(c.algs[picks.get(c.id) ?? 0].alg);
    el.querySelectorAll('[data-play], [data-open-algorithm]').forEach(button => {
      button.onclick = () => openCase(list.indexOf(c));
    });
    el.querySelector('[data-learn]').onclick = e => {
      learned = learned.includes(c.id) ? learned.filter(x => x !== c.id) : [...learned, c.id];
      if (!write('sobik_learned', learned)) toast(tr('Không lưu được tiến độ vào trình duyệt.', "Couldn't save your progress in this browser."));
      const on = learned.includes(c.id);
      e.currentTarget.setAttribute('aria-pressed', String(on));
      e.currentTarget.textContent = on ? '✓' : '○';
      counter();
    };
  }
  function counter() {
    root.querySelector('.case-count').textContent = phase === 'cross' ? tr('Cross không cần học thuộc công thức — hãy luyện lập kế hoạch.', "Practice planning your cross during inspection.") : `${list.length} case · ${cases.filter(c => c.type === phase && learned.includes(c.id)).length} ${tr("đã đánh dấu học", "marked as learned")}`;
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
      `${c.name} ${c.short} ${c.group} ${c.group_vi} ${caseRecognition(c)} ${c.algs.map(a => a.alg).join(' ')}`.toLowerCase().includes(term));
    grid.className = 'case-grid';
    grid.innerHTML = list.length ? '' : tr('<p class="empty-state">Không có case phù hợp. Thử xóa tìm kiếm hoặc đổi nhóm.</p>', "<p class=\"empty-state\">No matching cases. Try clearing the search or changing groups.</p>");
    shown = 0;
    appendPage();
    counter();
  }
  function groups() {
    group.innerHTML = tr('<option value="">Tất cả nhóm</option>', "<option value=\"\">All groups</option>") + [...new Set(cases.filter(c => c.type === phase).map(c => c.group))].map(g => `<option value="${esc(g)}">${esc(caseGroup(cases.find(c => c.group === g)))}</option>`).join('');
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
