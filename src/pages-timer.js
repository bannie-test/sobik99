import { locale, t as tr } from './utils/i18n.js';
import { read, write, validHistory } from './utils/storage.js';
import { statistics, formatTime, effective } from './utils/stats.js';
import { escapeHTML as esc, toast, openModal, closeModal } from './utils/ui.js';

const HOLD_MS = 350;
let history = read('rubik_timer_history', [], validHistory);
let scramble = '', running = false, started = 0, pending = null, loading = false, generation = null;

export function timerPage(root) {
  const abort = new AbortController();
  const { signal } = abort;
  let raf = 0, readyTimer = 0, heldAt = null, spaceCaptured = false;
  root.innerHTML = `<section class="timer-page" aria-labelledby="practice-title">
    <header class="practice-bar">
      <a href="#/">${tr('← Trang chủ', '← Home')}</a>
      <h1 id="practice-title">${tr('Luyện tập 3×3', '3×3 Practice')}</h1>
      <button id="new-scramble" class="small-button">${tr('Scramble mới ↻', 'New scramble ↻')}</button>
    </header>
    <section class="timer-workspace">
      <p class="scramble-text" id="scramble" aria-live="polite"></p>
      <button type="button" class="timer-display" id="timer-toggle"
        aria-label="${tr('Bắt đầu hoặc dừng đồng hồ', 'Start or stop the timer')}" aria-describedby="timer-hint">
        <span id="timer-value">00:00.00</span>
      </button>
      <p id="timer-hint" role="status"></p>
      <div class="timer-actions" hidden>
        <button id="save-solve" class="button primary">${tr('Lưu kết quả', 'Save result')}</button>
        <button id="discard-solve" class="button secondary">${tr('Bỏ kết quả', 'Discard result')}</button>
      </div>
    </section>
    <details class="practice-history">
      <summary>${tr('Lịch sử và thống kê', 'History and statistics')}</summary>
      <div class="stats-grid">${[['best', tr('Nhanh nhất', 'Best')], ['worst', tr('Chậm nhất', 'Worst')], ['ao5', 'Ao5'], ['ao12', 'Ao12']].map(([id, name]) => `<div><small>${name}</small><strong id="stat-${id}">—</strong></div>`).join('')}</div>
      <p class="muted stats-note">${tr('Ao5 và Ao12 bỏ lần nhanh nhất và chậm nhất trong 5 hoặc 12 lần gần nhất. Hai DNF khiến trung bình là DNF.', 'Ao5 and Ao12 drop the fastest and slowest of the latest 5 or 12 solves. Two DNFs make the average a DNF.')}</p>
      <div class="actions"><button id="export-history" class="small-button">${tr('Xuất CSV ↓', 'Export CSV ↓')}</button><button id="clear-history" class="small-button">${tr('Xóa lịch sử', 'Clear history')}</button></div>
      <div id="history-content"></div>
    </details>
  </section>`;

  const display = root.querySelector('#timer-value');
  const toggle = root.querySelector('#timer-toggle');
  const hint = root.querySelector('#timer-hint');
  const scrambleText = root.querySelector('#scramble');
  const actions = root.querySelector('.timer-actions');
  const refresh = root.querySelector('#new-scramble');
  const historyPanel = root.querySelector('.practice-history');
  const modal = document.getElementById('modal');
  const persist = () => {
    if (!write('rubik_timer_history', history)) toast(tr('Trình duyệt không lưu được lịch sử. Hãy xuất CSV để giữ kết quả.', 'The browser could not save your history. Export a CSV to keep your results.'));
  };

  function updateHold(ready) {
    toggle.dataset.state = ready ? 'ready' : 'holding';
    hint.textContent = ready
      ? tr('Sẵn sàng · Nhả Space để bắt đầu', 'Ready · Release Space to start')
      : tr('Tiếp tục giữ Space…', 'Keep holding Space…');
  }

  function ui() {
    scrambleText.textContent = loading
      ? tr('Đang tạo scramble…', 'Generating scramble…')
      : scramble || tr('Chưa tải được scramble. Hãy thử tạo lại.', 'Could not load a scramble. Try generating another one.');
    refresh.disabled = running || Boolean(pending) || loading;
    toggle.disabled = loading || !scramble;
    toggle.setAttribute('aria-disabled', String(Boolean(pending)));
    actions.hidden = !pending;
    historyPanel.inert = running;
    toggle.dataset.state = running ? 'running' : pending ? 'stopped' : 'idle';
    if (!running) display.textContent = formatTime(pending?.ms ?? 0);
    hint.textContent = running
      ? tr('Nhấn Space hoặc chạm đồng hồ để dừng', 'Press Space or tap the timer to stop')
      : pending
        ? tr('Lưu hoặc bỏ kết quả để giải tiếp', 'Save or discard your result to continue')
        : scramble && !loading
          ? tr('Giữ Space đến khi đồng hồ chuyển xanh, rồi nhả. Bạn cũng có thể chạm đồng hồ.', 'Hold Space until the timer turns green, then release. You can also tap the timer.')
          : '';
  }

  function tick() {
    display.textContent = formatTime(performance.now() - started);
    raf = requestAnimationFrame(tick);
  }

  async function generate() {
    if (running || pending) return;
    const focus = document.activeElement;
    const returnFocus = focus === refresh || actions.contains(focus);
    cancelHold();
    loading = true;
    ui();
    generation ??= (async () => {
      try {
        const { randomScrambleForEvent } = await import('cubing/scramble');
        scramble = (await randomScrambleForEvent('333')).toString();
      } catch {
        scramble = '';
      } finally {
        loading = false;
        generation = null;
      }
    })();
    await generation;
    if (signal.aborted) return;
    ui();
    if (returnFocus && !toggle.disabled && (document.activeElement === focus || document.activeElement === document.body)) {
      toggle.focus({ preventScroll: true });
    }
  }

  function cancelHold() {
    clearTimeout(readyTimer);
    if (heldAt === null) return;
    heldAt = null;
    ui();
  }

  function switchTimer(at = performance.now()) {
    if (loading || !scramble || pending) return;
    cancelHold();
    if (running) {
      running = false;
      cancelAnimationFrame(raf);
      pending = { id: crypto.randomUUID(), ms: at - started, scramble, date: new Date().toISOString(), penalty: 'none' };
    } else {
      started = at;
      running = true;
      historyPanel.open = false;
      display.textContent = formatTime(Math.max(0, performance.now() - started));
      raf = requestAnimationFrame(tick);
    }
    ui();
  }

  toggle.onclick = () => switchTimer();
  refresh.onclick = generate;
  root.querySelector('#save-solve').onclick = () => {
    if (!pending) return;
    history.push(pending);
    pending = null;
    persist();
    renderHistory();
    generate();
  };
  root.querySelector('#discard-solve').onclick = () => {
    pending = null;
    generate();
  };

  const interactive = 'input, textarea, select, button, a, summary, [contenteditable]:not([contenteditable="false"])';
  window.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    if (spaceCaptured) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || modal.open) return;
    if (event.target !== toggle && event.target.closest?.(interactive)) return;
    event.preventDefault();
    if (loading || !scramble || pending) return;
    spaceCaptured = true;
    if (running) {
      switchTimer(event.timeStamp);
      return;
    }
    heldAt = event.timeStamp;
    historyPanel.open = false;
    updateHold(false);
    readyTimer = setTimeout(() => updateHold(true), HOLD_MS);
  }, { signal });

  window.addEventListener('keyup', event => {
    if (event.code !== 'Space' || !spaceCaptured) return;
    event.preventDefault();
    spaceCaptured = false;
    const ready = heldAt !== null && event.timeStamp - heldAt >= HOLD_MS;
    cancelHold();
    if (ready && !modal.open) switchTimer(event.timeStamp);
  }, { signal });

  function resetKeyboard() {
    spaceCaptured = false;
    cancelHold();
  }
  window.addEventListener('blur', resetKeyboard, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetKeyboard();
  }, { signal });

 function renderHistory(){const stats=statistics(history);Object.entries(stats).forEach(([k,v])=>root.querySelector('#stat-'+k).textContent=formatTime(v));const target=root.querySelector('#history-content');root.querySelector('#export-history').disabled=history.length===0;root.querySelector('#clear-history').disabled=history.length===0;if(!history.length){target.innerHTML=tr('<div class="empty-state"><div class="empty-glyph">✳</div><h3>Chưa có lần giải nào. Và đó là khởi đầu tốt.</h3><p>Tạo scramble, giải khối Rubik, rồi lưu kết quả đầu tiên.</p></div>', "<div class=\"empty-state\"><div class=\"empty-glyph\">✳</div><h3>No solves recorded yet.</h3><p>Generate a scramble, solve the cube, and save your first result.</p></div>");return;}target.innerHTML=`<p class="muted">${history.length} ${tr("lần đã lưu · hiển thị tối đa 100 lần gần nhất", "solves saved · showing the latest 100")}</p><div class="table-wrap"><table class="history-table"><thead><tr><th>#</th><th>${tr("Thời gian", "Time")}</th><th>${tr("Điều chỉnh", "Penalty")}</th><th>${tr("Scramble / thời điểm", "Scramble / date")}</th><th></th></tr></thead><tbody>${history.slice(-100).reverse().map((s,i)=>`<tr><td>${history.length-i}</td><td><strong>${formatTime(effective(s))}</strong>${s.penalty==='DNF'?`<small>${tr("Gốc", "Original:")} ${formatTime(s.ms)}</small>`:''}</td><td><select data-penalty="${s.id}" aria-label="${tr("Điều chỉnh lần", "Adjust penalty for solve")} ${history.length-i}">${['none','+2','DNF'].map(p=>`<option value="${p}" ${s.penalty===p?'selected':''}>${p==='none'?'OK':p}</option>`).join('')}</select></td><td><details><summary>${esc(s.scramble.slice(0,25))}…</summary><code>${esc(s.scramble)}</code></details><small>${new Date(s.date).toLocaleString(locale)}</small></td><td><button class="text-button" data-delete="${s.id}" aria-label="${tr("Xóa lần", "Delete solve")} ${history.length-i}">×</button></td></tr>`).join('')}</tbody></table></div>`;target.querySelectorAll('[data-penalty]').forEach(s=>s.onchange=()=>{const solve=history.find(x=>x.id===s.dataset.penalty);solve.penalty=s.value;persist();renderHistory()});target.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const deleted=history.find(x=>x.id===b.dataset.delete);openModal(`<h2>${tr("Xóa lần giải", "Delete solve")} ${formatTime(effective(deleted))}?</h2><p>${tr("Thao tác này sẽ cập nhật lại thống kê.", "Your statistics will update.")}</p><button id="confirm-delete" class="button primary">${tr("Xóa lần giải", "Delete solve")}</button>`,el=>{el.querySelector('#confirm-delete').onclick=()=>{history=history.filter(x=>x.id!==deleted.id);persist();renderHistory();closeModal()}})})}
 root.querySelector('#clear-history').onclick=()=>openModal(`<h2>${tr("Xóa", "Delete")} ${history.length} ${tr("lần giải?", "solves?")}</h2><p>${tr("Bạn có thể xuất CSV trước để giữ bản sao. Việc xóa không thể hoàn tác.", "Export a CSV first if you want a copy. Deleting your history is permanent.")}</p><button class="button primary" id="confirm-clear">${tr("Xóa toàn bộ lịch sử", "Clear all history")}</button>`,el=>{el.querySelector('#confirm-clear').onclick=()=>{history=[];persist();renderHistory();closeModal()}});
 root.querySelector('#export-history').onclick=()=>{const rows=[['date','milliseconds','penalty','display_time','scramble'],...history.map(s=>[s.date,s.ms,s.penalty,formatTime(effective(s)),s.scramble])];const csv='\ufeff'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sobik99-solves.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};

  renderHistory();
  ui();
  if (running) tick();
  else if (!scramble || loading) generate();
  return () => {
    abort.abort();
    clearTimeout(readyTimer);
    cancelAnimationFrame(raf);
  };
}
