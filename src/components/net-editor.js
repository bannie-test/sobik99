// Paint-the-cube editor: an unfolded net held yellow-up, green-front (white on the bottom).
// Centers are fixed; every other sticker is painted with the selected color.
import { apply, solvedFacelets } from '../core/cube.js';
import { COLORS } from './diagrams.js';
import { escapeHTML as esc } from '../utils/ui.js';

export const COLOR_ORDER = ['D', 'U', 'F', 'B', 'R', 'L'];
export const COLOR_LABEL = { U: 'Trắng', D: 'Vàng', F: 'Xanh lá', B: 'Xanh dương', R: 'Đỏ', L: 'Cam' };
const FACE_LABEL = { U: 'Trên', R: 'Phải', F: 'Trước', D: 'Dưới', L: 'Trái', B: 'Sau' };
// Net placement (column, row in face units) of each face index U R F D L B.
const PLACE = [[1, 0], [2, 1], [1, 1], [1, 2], [0, 1], [3, 1]];
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

/** Solved cube in the editor's grip. */
export const heldSolved = () => apply(solvedFacelets(), 'z2');

export function netEditor(root, { initial = heldSolved(), onChange = () => {} } = {}) {
  let state = [...initial];
  let brush = 'D';
  let marked = new Set();
  root.innerHTML = `<div class="net-palette" role="radiogroup" aria-label="Chọn màu để tô">${COLOR_ORDER.map(c => `<button type="button" role="radio" data-brush="${c}" style="--swatch:${COLORS[c]}" aria-checked="${c === brush}"><i></i>${COLOR_LABEL[c]}</button>`).join('')}</div>
  <div class="net-grid">${FACES.map((f, fi) => `<div class="net-face" style="grid-column:${PLACE[fi][0] + 1};grid-row:${PLACE[fi][1] + 1}" aria-label="Mặt ${FACE_LABEL[f]}"><span>${FACE_LABEL[f]}</span>${Array.from({ length: 9 }, (_, k) => {
    const i = fi * 9 + k;
    return `<button type="button" class="net-cell" data-i="${i}" ${k === 4 ? 'disabled' : ''}></button>`;
  }).join('')}</div>`).join('')}</div>`;
  const cells = [...root.querySelectorAll('.net-cell')];
  function paint() {
    cells.forEach(b => {
      const i = +b.dataset.i, c = state[i];
      b.style.background = COLORS[c];
      b.classList.toggle('bad', marked.has(i));
      b.setAttribute('aria-label', `${COLOR_LABEL[c]}${i % 9 === 4 ? ' (tâm cố định)' : ''}`);
    });
  }
  root.querySelectorAll('[data-brush]').forEach(b => b.addEventListener('click', () => {
    brush = b.dataset.brush;
    root.querySelectorAll('[data-brush]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
  }));
  let dragging = false;
  const set = b => { const i = +b.dataset.i; if (i % 9 === 4 || state[i] === brush) return; state[i] = brush; marked.delete(i); paint(); onChange(state); };
  cells.forEach(b => {
    b.addEventListener('pointerdown', e => { dragging = true; b.releasePointerCapture?.(e.pointerId); set(b); });
    b.addEventListener('pointerenter', () => { if (dragging) set(b); });
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(b); } });
  });
  const stop = () => { dragging = false; };
  window.addEventListener('pointerup', stop);
  paint();
  return {
    get state() { return [...state]; },
    setState(s) { state = [...s]; marked = new Set(); paint(); onChange(state); },
    mark(indices) { marked = new Set(indices); paint(); },
    dispose() { window.removeEventListener('pointerup', stop); },
    describe: () => esc('Cầm vàng ở trên, xanh lá phía trước, trắng ở dưới.'),
  };
}
