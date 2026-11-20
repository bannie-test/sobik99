import { t as tr } from '../utils/i18n.js';
// Cubie view of a sticker state, relative to the current centers (Kociemba conventions), and the
// validator that explains why a colored-in cube cannot exist.
import { FACES } from './cube.js';

const F = (face, n) => FACES.indexOf(face) * 9 + n - 1;
// Corner positions URF UFL ULB UBR DFR DLF DBL DRB; first facelet is the U/D one.
export const CORNER_FACELETS = [
  [F('U', 9), F('R', 1), F('F', 3)], [F('U', 7), F('F', 1), F('L', 3)], [F('U', 1), F('L', 1), F('B', 3)],
  [F('U', 3), F('B', 1), F('R', 3)], [F('D', 3), F('F', 9), F('R', 7)], [F('D', 1), F('L', 9), F('F', 7)],
  [F('D', 7), F('B', 9), F('L', 7)], [F('D', 9), F('R', 9), F('B', 7)],
];
// Edge positions UR UF UL UB DR DF DL DB FR FL BL BR.
export const EDGE_FACELETS = [
  [F('U', 6), F('R', 2)], [F('U', 8), F('F', 2)], [F('U', 4), F('L', 2)], [F('U', 2), F('B', 2)],
  [F('D', 6), F('R', 8)], [F('D', 2), F('F', 8)], [F('D', 4), F('L', 8)], [F('D', 8), F('B', 8)],
  [F('F', 6), F('R', 4)], [F('F', 4), F('L', 6)], [F('B', 6), F('L', 4)], [F('B', 4), F('R', 6)],
];
const CORNER_COLORS = CORNER_FACELETS.map(c => c.map(i => FACES[Math.floor(i / 9)]));
const EDGE_COLORS = EDGE_FACELETS.map(e => e.map(i => FACES[Math.floor(i / 9)]));
export const CORNER_NAMES = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];
export const EDGE_NAMES = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'];
export const URF = 0, DFR = 4, DLF = 5, DBL = 6, DRB = 7, FR = 8, FL = 9, BL = 10, BR = 11;

/** Re-labels every sticker with the face whose center has its color. */
export function relabel(state) {
  const byColor = {};
  FACES.forEach((f, i) => { byColor[state[i * 9 + 4]] = f; });
  return state.map(c => byColor[c]);
}

/** cp/co/ep/eo where cp[i] is the corner sitting at position i. Returns null if a piece is unknown. */
export function toCubie(state) {
  const f = relabel(state);
  if (f.some(x => x === undefined)) return null;
  const cp = [], co = [], ep = [], eo = [];
  for (let i = 0; i < 8; i++) {
    const fl = CORNER_FACELETS[i];
    let ori = 0;
    while (ori < 3 && f[fl[ori]] !== 'U' && f[fl[ori]] !== 'D') ori++;
    if (ori === 3) return null;
    const c1 = f[fl[(ori + 1) % 3]], c2 = f[fl[(ori + 2) % 3]];
    const j = CORNER_COLORS.findIndex(c => c[1] === c1 && c[2] === c2);
    if (j < 0) return null;
    cp[i] = j; co[i] = ori;
  }
  for (let i = 0; i < 12; i++) {
    const a = f[EDGE_FACELETS[i][0]], b = f[EDGE_FACELETS[i][1]];
    let j = EDGE_COLORS.findIndex(c => c[0] === a && c[1] === b);
    if (j >= 0) { ep[i] = j; eo[i] = 0; continue; }
    j = EDGE_COLORS.findIndex(c => c[0] === b && c[1] === a);
    if (j < 0) return null;
    ep[i] = j; eo[i] = 1;
  }
  return { cp, co, ep, eo };
}

export const isSolvedCubie = c => c.cp.every((p, i) => p === i && c.co[i] === 0) && c.ep.every((p, i) => p === i && c.eo[i] === 0);

function parity(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) s ^= 1;
  return s;
}

const COLOR_NAMES = { U: tr('trên', "top"), R: tr('phải', "right"), F: tr('trước', "front"), D: tr('dưới', "bottom"), L: tr('trái', "left"), B: tr('sau', 'back') };

/**
 * Checks a facelet array of color ids. Returns {ok, errors:[{code, message, stickers}]}.
 * Codes: COUNT, CENTERS, CORNER_INVALID, EDGE_INVALID, DUPLICATE, TWIST, FLIP, PARITY.
 */
export function validate(state) {
  const errors = [];
  const counts = {};
  state.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
  const ctr = FACES.map((_, i) => state[i * 9 + 4]);
  if (new Set(ctr).size !== 6) {
    errors.push({ code: 'CENTERS', message: tr('Sáu ô tâm phải có sáu màu khác nhau.', "The six centers must have different colors."), stickers: FACES.map((_, i) => i * 9 + 4) });
    return { ok: false, errors };
  }
  const wrong = ctr.filter(c => counts[c] !== 9);
  if (wrong.length || Object.keys(counts).length !== 6) {
    const detail = ctr.map(c => `${c}: ${counts[c] || 0}`).join(', ');
    errors.push({ code: 'COUNT', message: `${tr("Mỗi màu phải xuất hiện đúng 9 lần (hiện tại", "Each color must appear exactly nine times (current counts:")} ${detail}).`, stickers: state.map((c, i) => (wrong.includes(c) ? i : -1)).filter(i => i >= 0) });
    return { ok: false, errors };
  }
  const f = relabel(state);
  for (let i = 0; i < 8; i++) {
    const fl = CORNER_FACELETS[i];
    const set = fl.map(x => f[x]).sort().join('');
    if (!CORNER_COLORS.some(c => [...c].sort().join('') === set)) {
      errors.push({ code: 'CORNER_INVALID', message: `${tr("Góc", "Corners")} ${CORNER_NAMES[i]} ${tr("có tổ hợp màu không tồn tại trên Rubik thật (ví dụ hai màu đối diện trên cùng một góc).", "has an impossible color combination, such as two opposite colors.")}`, stickers: fl });
    }
  }
  for (let i = 0; i < 12; i++) {
    const el = EDGE_FACELETS[i];
    const set = el.map(x => f[x]).sort().join('');
    if (!EDGE_COLORS.some(c => [...c].sort().join('') === set)) {
      errors.push({ code: 'EDGE_INVALID', message: `${tr("Cạnh", "Edges")} ${EDGE_NAMES[i]} ${tr("có tổ hợp màu không tồn tại.", "has an impossible color combination.")}`, stickers: el });
    }
  }
  if (errors.length) return { ok: false, errors };
  const cc = toCubie(state);
  if (!cc) return { ok: false, errors: [{ code: 'CORNER_INVALID', message: tr('Không nhận ra được một số mảnh.', "Some pieces couldn't be identified."), stickers: [] }] };
  const dupC = cc.cp.map((p, i) => (cc.cp.indexOf(p) !== i ? i : -1)).filter(i => i >= 0);
  const dupE = cc.ep.map((p, i) => (cc.ep.indexOf(p) !== i ? i : -1)).filter(i => i >= 0);
  if (dupC.length || dupE.length) {
    errors.push({ code: 'DUPLICATE', message: tr('Có mảnh bị lặp lại (cùng một góc hoặc cạnh xuất hiện hai lần). Kiểm tra lại màu đã nhập.', "A corner or edge appears twice. Check the entered colors."), stickers: [...dupC.flatMap(i => CORNER_FACELETS[i]), ...dupE.flatMap(i => EDGE_FACELETS[i])] });
    return { ok: false, errors };
  }
  if (cc.co.reduce((a, b) => a + b, 0) % 3) errors.push({ code: 'TWIST', message: tr('Một góc đang bị xoay lệch: tổng hướng các góc không hợp lệ. Có thể bạn đã nhập nhầm thứ tự màu của một góc, hoặc cube từng bị vặn góc.', "Corner orientation is invalid. Check the color order on each corner and look for a physically twisted corner."), stickers: [] });
  if (cc.eo.reduce((a, b) => a + b, 0) % 2) errors.push({ code: 'FLIP', message: tr('Một cạnh đang bị lật: số cạnh bị lật phải là số chẵn. Kiểm tra hai màu của từng cạnh.', "The number of flipped edges must be even. Check both colors of each edge."), stickers: [] });
  if (parity(cc.cp) !== parity(cc.ep)) errors.push({ code: 'PARITY', message: tr('Hai mảnh đang bị đổi chỗ cho nhau — trạng thái này không thể có khi chỉ xoay. Kiểm tra lại hai góc hoặc hai cạnh gần nhau.', "Two pieces appear swapped, which can't happen using legal turns alone. Check nearby corners and edges."), stickers: [] });
  return { ok: errors.length === 0, errors };
}

export const faceLabel = f => COLOR_NAMES[f];
