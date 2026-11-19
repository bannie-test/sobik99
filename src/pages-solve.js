import { apply, solvedFacelets, parse } from './core/cube.js';
import { validate } from './core/cubie.js';
import { GOALS } from './core/cfop.js';
import { cfop, readScramble, setupFor, withSetups, shortSolution, moveCount } from './core/solve-service.js';
import { netEditor, heldSolved } from './components/net-editor.js';
import { cubeView } from './components/diagrams.js';
import { mountPlayer, retarget } from './components/player.js';
import { escapeHTML as esc, copy, toast } from './utils/ui.js';

const STAGES = [['cross', 'Cross'], ['f2l', 'F2L'], ['oll', 'OLL'], ['pll', 'PLL']];

export function solvePage(root, params) {
  let mode = params.get('paint') ? 'paint' : 'scramble';
  let goal = GOALS[params.get('goal')] ? params.get('goal') : 'all';
  let method = 'cfop';
  let result = null; // { setup, steps, solved, remaining, endState, method }
  let player = null, mountingPlayer = null, editor = null, dead = false, ticket = 0;

  root.innerHTML = `<section class="page-shell solve-page">
  <div class="page-heading"><div><small>CUBE LAB / TRÌNH GIẢI 3×3</small><h1>Xáo bất kỳ.<br><em>Giải đến cùng.</em></h1></div>
  <p>Nhập scramble hoặc tô màu khối của bạn. Trình giải đi trọn Cross → F2L → OLL → PLL, cầm mặt trắng ở dưới và lấy mặt vàng làm mặt cuối.</p></div>
  <div class="solve-layout">
   <div class="solve-input">
    <div class="phase-tabs" role="group" aria-label="Cách nhập">
     <button data-mode="scramble">Scramble</button><button data-mode="paint">Tô màu</button></div>
    <div data-panel="scramble">
     <label>Scramble (cầm trắng trên, xanh lá trước khi xáo — chuẩn WCA)<textarea id="scramble" rows="3" spellcheck="false" placeholder="R U R' U' …"></textarea></label>
     <div class="row-buttons"><button class="button secondary" id="random">Scramble ngẫu nhiên</button></div>
    </div>
    <div data-panel="paint" hidden>
     <p class="muted">Cầm khối: <b>vàng ở trên, xanh lá phía trước, trắng ở dưới</b>. Chọn màu rồi chạm (hoặc kéo) lên ô. Ô tâm cố định.</p>
     <div id="net"></div>
     <div class="row-buttons"><button class="small-button" id="net-reset">Về trạng thái đã giải</button><button class="small-button" id="net-from-scramble">Lấy màu từ scramble</button></div>
    </div>
    <fieldset class="goal-picker"><legend>Mục tiêu</legend>${Object.entries(GOALS).map(([k, v]) => `<label><input type="radio" name="goal" value="${k}" ${k === goal ? 'checked' : ''}> ${v}</label>`).join('')}</fieldset>
    <fieldset class="goal-picker"><legend>Cách giải</legend>
     <label><input type="radio" name="method" value="cfop" checked> CFOP từng bước (dễ học)</label>
     <label><input type="radio" name="method" value="short"> Ngắn nhất (thuật toán hai pha)</label></fieldset>
    <button class="button primary" id="solve">Giải ↗</button>
    <div id="messages" aria-live="polite"></div>
   </div>
   <div class="solve-output">
    <div id="player" class="player-box"><div class="player-empty">${cubeView(apply(solvedFacelets(), 'z2'), 'Cube đã giải')}<p>Lời giải sẽ hiện ở đây.</p></div></div>
    <div id="summary"></div>
    <ol id="steps" class="solution-steps"></ol>
   </div>
  </div></section>`;

  const $ = s => root.querySelector(s);
  const scrambleInput = $('#scramble');
  const messages = $('#messages');
  const playerBox = $('#player');

  async function showCube(config) {
    if (!player) {
      mountingPlayer ??= mountPlayer(playerBox);
      player = await mountingPlayer;
      mountingPlayer = null;
    }
    if (!dead) retarget(player, config);
    return player;
  }

  function setMode(m) {
    mode = m;
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    root.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== m; });
    if (m === 'paint' && !editor) editor = netEditor($('#net'), { onChange: () => { messages.innerHTML = ''; } });
  }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  root.querySelectorAll('input[name=goal]').forEach(i => i.addEventListener('change', () => { goal = i.value; }));
  root.querySelectorAll('input[name=method]').forEach(i => i.addEventListener('change', () => {
    method = i.value;
    root.querySelector('.goal-picker').disabled = method === 'short';
  }));

  async function randomScramble() {
    $('#random').disabled = true;
    try {
      const { randomScrambleForEvent } = await import('cubing/scramble');
      const s = (await randomScrambleForEvent('333')).toString();
      if (dead) return '';
      scrambleInput.value = s;
      if (mode === 'scramble') {
        const previewTicket = ++ticket;
        result = null;
        messages.replaceChildren();
        $('#summary').replaceChildren();
        $('#steps').replaceChildren();
        const preview = await showCube({ setup: s });
        if (!preview && !dead && previewTicket === ticket) {
          playerBox.innerHTML = `<div class="player-empty">${cubeView(apply(solvedFacelets(), s), 'Cube đã xáo trộn')}<p>Đã xáo theo scramble.</p></div>`;
        }
      }
      return s;
    } catch {
      toast('Không tạo được scramble ngẫu nhiên. Hãy thử lại.');
      return '';
    } finally { if (!dead) $('#random').disabled = false; }
  }
  $('#random').addEventListener('click', randomScramble);
  $('#net-reset').addEventListener('click', () => editor.setState(heldSolved()));
  $('#net-from-scramble').addEventListener('click', () => {
    const r = readScramble(scrambleInput.value);
    if (r.error) return showError(r.error);
    editor.setState(apply(apply(solvedFacelets(), r.moves), 'z2'));
  });

  function showError(text, notApplicable = false) {
    messages.innerHTML = `<div class="notice ${notApplicable ? 'info' : 'error'}">${esc(text)}</div>`;
  }

  /** Current state and the algorithm that builds it from a solved, white-up cube. */
  function currentInput() {
    if (mode === 'scramble') {
      const r = readScramble(scrambleInput.value);
      if (r.error) return { error: r.error };
      return { state: apply(solvedFacelets(), r.moves), setup: r.moves };
    }
    const state = editor.state;
    const v = validate(state);
    if (!v.ok) {
      editor.mark(v.errors.flatMap(e => e.stickers));
      return { error: v.errors.map(e => e.message).join(' ') };
    }
    return { state, setup: setupFor(state) };
  }

  async function solve() {
    const my = ++ticket;
    messages.innerHTML = '';
    const input = currentInput();
    if (input.error) return showError(input.error);
    if (cfop().analyze(input.state).solved) return showError('Cube đang ở trạng thái đã giải — hãy xáo hoặc tô màu trước.', true);
    $('#solve').disabled = true;
    try {
      if (method === 'short') {
        $('#steps').innerHTML = '<li class="muted">Đang tìm lời giải ngắn…</li>';
        const r = await shortSolution(input.setup);
        if (my !== ticket || dead) return;
        result = { setup: input.setup, steps: withSetups(input.setup, r.steps), solved: r.solved, remaining: [], method };
      } else {
        const r = cfop().solve(input.state, goal);
        if (!r.ok) return showError(r.error, r.notApplicable);
        result = { setup: input.setup, steps: withSetups(input.setup, r.steps), solved: r.solved, remaining: r.remaining, endState: r.endState, method };
      }
      await render();
    } catch (e) {
      console.error(e);
      if (!dead && my === ticket) showError('Không giải được trạng thái này. Hãy kiểm tra lại dữ liệu nhập.');
    } finally { if (!dead) $('#solve').disabled = false; }
  }
  $('#solve').addEventListener('click', solve);

  function continueSolve() {
    const r = cfop().solve(result.endState, 'all');
    if (!r.ok) return showError(r.error);
    const lastSetup = result.steps.length ? `${result.steps.at(-1).setup} ${result.steps.at(-1).moves}` : result.setup;
    const more = withSetups(lastSetup.trim(), r.steps.filter(s => s.stage !== 'hold'));
    result = { ...result, steps: [...result.steps, ...more], solved: r.solved, remaining: r.remaining, endState: r.endState };
    render();
  }

  function stageProgress() {
    const done = new Set(result.steps.map(s => s.stage));
    const f2l = result.steps.filter(s => s.stage === 'f2l').length;
    return STAGES.map(([k, label]) => {
      const finished = result.solved || (k === 'cross' ? done.has('cross') || !result.remaining.includes('Cross') : k === 'f2l' ? !result.remaining.some(x => x.startsWith('F2L')) : k === 'oll' ? !result.remaining.includes('OLL') : !result.remaining.includes('PLL'));
      return `<span class="stage-pill ${finished ? 'done' : ''}">${finished ? '✓' : '○'} ${label}${k === 'f2l' && f2l ? ` · ${f2l} cặp` : ''}</span>`;
    }).join('');
  }

  async function render() {
    const all = result.steps.map(s => s.moves).join(' ');
    const fullPlayback = { setup: result.setup, alg: all };
    const total = moveCount(result.steps.filter(s => s.stage !== 'hold'));
    $('#summary').innerHTML = `<div class="solve-summary">
      ${result.method === 'cfop' ? `<div class="stage-row">${stageProgress()}</div>` : ''}
      <p><b>${total} bước xoay</b>${result.method === 'cfop' ? ' theo CFOP' : ' (hai pha)'} · ${result.solved ? 'cube được giải hoàn toàn.' : 'đã xong mục tiêu “' + esc(GOALS[goal]) + '”.'}</p>
      ${!result.solved && result.method === 'cfop' ? `<div class="notice info">Mục tiêu từng phần chỉ dừng ở giai đoạn bạn chọn. Còn lại: <b>${result.remaining.map(esc).join(' → ')}</b>.<button class="button primary" id="continue">Giải tiếp đến khi xong ↗</button></div>` : ''}
      <div class="row-buttons"><button class="small-button" id="play-all">▶ Xem toàn bộ</button><button class="small-button" id="copy-all">Sao chép lời giải</button></div></div>`;
    $('#steps').innerHTML = result.steps.map((s, i) => `<li class="solution-step stage-${s.stage}"><div class="step-head"><span class="step-no">${String(i + 1).padStart(2, '0')}</span><strong>${esc(s.title)}</strong><small>${s.stage === 'hold' ? 'xoay khối' : parse(s.moves).filter(m => !'xyz'.includes(m.base)).length + ' bước'}</small></div>
      <div class="move-chips">${s.moves ? s.moves.split(' ').map(m => `<span>${esc(m)}</span>`).join('') : '<span>—</span>'}</div>
      <p>${esc(s.explanation)}</p>${s.caseId ? `<a class="source-link" href="#/guide?case=${encodeURIComponent(s.caseId)}">Xem case ${esc(s.caseId.toUpperCase())} trong thư viện ↗</a>` : ''}
      <button class="small-button" data-step="${i}">▶ Xem bước này</button></li>`).join('');
    $('#continue')?.addEventListener('click', continueSolve);
    $('#copy-all').addEventListener('click', () => copy(all));
    $('#play-all').addEventListener('click', () => retarget(player, fullPlayback));
    root.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
      const s = result.steps[+b.dataset.step];
      retarget(player, { setup: s.setup, alg: s.moves });
      $('#player').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    await showCube(fullPlayback);
  }

  setMode(mode);
  (async () => {
    const s = params.get('scramble');
    if (s) scrambleInput.value = s;
    else if (params.get('random')) await randomScramble();
    if ((s || params.get('random')) && !dead) solve();
  })();

  return () => { dead = true; editor?.dispose(); };
}
