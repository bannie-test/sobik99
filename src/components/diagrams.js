import { t as tr } from '../utils/i18n.js';
// Static SVG case pictures drawn from the cube engine, with yellow on top and white on the bottom
// (the way the cube is held for CFOP). Top view for OLL/PLL (PLL with arrows), 3/4 view for F2L.
import { apply, solvedFacelets, GEOMETRY } from '../core/cube.js';
import { toCubie, CORNER_FACELETS, EDGE_FACELETS } from '../core/cubie.js';

export const COLORS = { U: '#ffffff', D: '#ffd52e', F: '#2fb27c', B: '#3f6fd8', R: '#ec5a68', L: '#ff9a4d' };
const GRAY = '#cfcad6', INK = '#292339';

/** Facelets of a case in the CFOP holding position: yellow up, white down, green front. */
export const caseState = setup => apply(solvedFacelets(), 'z2 ' + (setup || ''));

const uCell = i => ({ r: Math.floor(i / 3), c: i % 3 }); // U facelet -> grid cell
const sideCells = () => {
  // Top row of each side face, placed around the U face in a 5x5 grid (x, y in cells).
  const cells = [];
  for (let c = 0; c < 3; c++) {
    cells.push({ i: 18 + c, x: 1 + c, y: 4, side: 'h' });          // F
    cells.push({ i: 45 + c, x: 3 - c, y: 0, side: 'h' });          // B (seen from behind)
    cells.push({ i: 9 + c, x: 4, y: 3 - c, side: 'v' });           // R
    cells.push({ i: 36 + c, x: 0, y: 1 + c, side: 'v' });          // L
  }
  return cells;
};

function arrowDefs(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs>`;
}

let uid = 0;
/** Top view for OLL ("oll": yellow vs gray) and PLL ("pll": full colors and arrows). */
export function topView(state, mode = 'pll', { title = '' } = {}) {
  const S = 30, pad = 4, size = S * 5 + pad * 2;
  const yellow = state[4];
  const fill = col => (mode === 'oll' ? (col === yellow ? COLORS[col] : GRAY) : COLORS[col]);
  let out = '';
  for (let i = 0; i < 9; i++) {
    const { r, c } = uCell(i);
    out += `<rect x="${pad + (c + 1) * S + 1.5}" y="${pad + (r + 1) * S + 1.5}" width="${S - 3}" height="${S - 3}" rx="4" fill="${fill(state[i])}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  for (const s of sideCells()) {
    const col = state[s.i];
    if (mode === 'oll' && col !== yellow) continue;
    const w = s.side === 'h' ? S - 5 : 9, h = s.side === 'h' ? 9 : S - 5;
    const x = pad + s.x * S + (s.side === 'h' ? 2.5 : s.x === 0 ? S - 12 : 3);
    const y = pad + s.y * S + (s.side === 'v' ? 2.5 : s.y === 0 ? S - 12 : 3);
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${fill(col)}" stroke="${INK}" stroke-width="1.2"/>`;
  }
  let defs = '';
  if (mode === 'pll') {
    const cc = toCubie(state);
    const marker = 'ah' + (++uid);
    const center = idx => { const { r, c } = uCell(idx); return [pad + (c + 1.5) * S, pad + (r + 1.5) * S]; };
    const lines = [];
    const drawn = new Set();
    const cycle = (perm, facelets) => {
      for (let i = 0; i < 4; i++) {
        const j = perm[i];
        if (j === i || drawn.has(`${i}-${j}`)) continue;
        const swap = perm[j] === i;
        drawn.add(`${i}-${j}`); if (swap) drawn.add(`${j}-${i}`);
        const [x1, y1] = center(facelets[i][0]), [x2, y2] = center(facelets[j][0]);
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), k = 9 / len;
        lines.push(`<line x1="${(x1 + dx * k).toFixed(1)}" y1="${(y1 + dy * k).toFixed(1)}" x2="${(x2 - dx * k).toFixed(1)}" y2="${(y2 - dy * k).toFixed(1)}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" marker-end="url(#${marker})"${swap ? ` marker-start="url(#${marker})"` : ''}/>`);
      }
    };
    cycle(cc.cp, CORNER_FACELETS);
    cycle(cc.ep, EDGE_FACELETS);
    if (lines.length) { defs = arrowDefs(marker); out += lines.join(''); }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img">${title ? `<title>${title}</title>` : ''}${defs}${out}</svg>`;
}

/** 3/4 view of U, F and R. F2L diagrams mask last-layer stickers to highlight the FR pair. */
export function f2lView(state, { title = '', highlight = true } = {}) {
  const masked = new Set();
  if (highlight) {
    const cc = toCubie(state);
    masked.add(4); // U center
    CORNER_FACELETS.forEach((fl, pos) => { if (cc.cp[pos] < 4) fl.forEach(i => masked.add(i)); });
    EDGE_FACELETS.forEach((fl, pos) => { if (cc.ep[pos] < 4) fl.forEach(i => masked.add(i)); });
  }
  const proj = ([x, y, z]) => [(x - z) * 0.866 * 26, ((x + z) * 0.5 - y) * 26];
  const polys = [];
  GEOMETRY.forEach((g, i) => {
    if (!(g.n[0] === 1 || g.n[1] === 1 || g.n[2] === 1)) return;
    const axis = g.n.findIndex(v => v !== 0);
    const others = [0, 1, 2].filter(a => a !== axis);
    const center = g.p.map((v, a) => (a === axis ? 1.5 : v));
    const corner = (su, sv) => { const p = [...center]; p[others[0]] += su * 0.44; p[others[1]] += sv * 0.44; return proj(p); };
    const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const fill = masked.has(i) ? '#000000' : COLORS[state[i]];
    polys.push(`<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 160" role="img">${title ? `<title>${title}</title>` : ''}${polys.join('')}</svg>`;
}

/** Picture for an algorithm-library case. */
export function caseDiagram(c, setup = c.setup) {
  const state = caseState(setup);
  const title = `${c.name}${tr(": mặt vàng ở trên, mặt trắng ở dưới", ": yellow on top, white on the bottom")}`;
  if (c.type === 'f2l') return f2lView(state, { title });
  return topView(state, c.type === 'oll' ? 'oll' : 'pll', { title });
}

/** Full 3/4 view of any state (no masking), e.g. for solver steps. */
export const cubeView = (state, title = '') => f2lView(state, { title, highlight: false });
