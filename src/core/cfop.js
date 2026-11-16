// CFOP solver: Cross -> F2L (4 pairs) -> OLL -> PLL with the white cross on D and yellow as the
// last layer. F2L/OLL/PLL use the algorithm library; the case each algorithm solves is derived by
// applying its inverse to a solved cube, so recognition never disagrees with the data.
import { apply, parse, invert, simplify, format, htm, centers, solvedFacelets, ORIENTATIONS } from './cube.js';
import { toCubie, isSolvedCubie, validate, DFR, DLF, DBL, DRB, FR, FL, BL, BR } from './cubie.js';

export const COLOR_VI = { U: 'trắng', R: 'đỏ', F: 'xanh lá', D: 'vàng', L: 'cam', B: 'xanh dương' };
export const CROSS_COLOR = 'U'; // white in the standard scheme (white U, green F)
const SLOT_CORNER = [DFR, DLF, DBL, DRB];
const SLOT_EDGE = [FR, FL, BL, BR];
const SLOT_NAMES = ['trước-phải (FR)', 'trước-trái (FL)', 'sau-trái (BL)', 'sau-phải (BR)'];
const Y_TO_FR = ['', "y'", 'y2', 'y'];
const EXTRACT = ['', "L' U' L", "L U L'", "R' U' R"];
const AUF = ['', 'U', 'U2', "U'"];

export class Frame {
  constructor(state) {
    this.state = state;
    this.cc = toCubie(state);
    if (!this.cc) throw new Error('Trạng thái không hợp lệ');
  }
  apply(moves) { return (typeof moves === 'string' ? moves.trim() : moves.length) ? new Frame(apply(this.state, moves)) : this; }
  color(faceIndex) { return this.state[faceIndex * 9 + 4]; }
  get crossSolved() { const c = this.cc; return [4, 5, 6, 7].every(i => c.ep[i] === i && c.eo[i] === 0); }
  slotSolved(s) { const c = this.cc, k = SLOT_CORNER[s], e = SLOT_EDGE[s]; return c.cp[k] === k && c.co[k] === 0 && c.ep[e] === e && c.eo[e] === 0; }
  get solvedSlots() { return [0, 1, 2, 3].filter(s => this.slotSolved(s)); }
  get f2lSolved() { return this.crossSolved && this.solvedSlots.length === 4; }
  get ollSolved() { const c = this.cc; return this.f2lSolved && [0, 1, 2, 3].every(i => c.co[i] === 0 && c.eo[i] === 0); }
  get solved() { return isSolvedCubie(this.cc); }
}

export const noNetRotation = moves => centers(apply(solvedFacelets(), moves)).join('') === 'URFDLB';

// ------------------------------------------------------------------ case keys

function f2lPlayable(c) {
  const cp = c.cp.indexOf(DFR), ep = c.ep.indexOf(FR);
  return (cp < 4 || cp === DFR) && (ep < 4 || ep === FR);
}
export function f2lKey(c) {
  const cp = c.cp.indexOf(DFR), ep = c.ep.indexOf(FR);
  return (cp * 3 + c.co[cp]) * 24 + ep * 2 + c.eo[ep];
}
export const ollKey = c => [0, 1, 2, 3].map(i => c.co[i]).join('') + [0, 1, 2, 3].map(i => c.eo[i]).join('');
export const pllKey = c => [0, 1, 2, 3].map(i => c.cp[i]).join('') + [0, 1, 2, 3].map(i => c.ep[i]).join('');

/** Whole-cube rotation that cancels an algorithm's net rotation ('' when there is none). */
export function rotationFix(moves) {
  for (const r of ORIENTATIONS) if (noNetRotation([...moves, ...parse(r)])) return r;
  return null;
}

/**
 * Case (Frame) an algorithm solves, or a reason it is not a clean F2L/OLL/PLL algorithm.
 * Algorithms may end rotated (e.g. "y' R' U' R" or an x-perm without the closing x'); `fix` is
 * the rotation that restores the holding orientation and `setup` the normalized inverse that
 * builds the case in the standard orientation.
 */
export function caseOf(type, alg) {
  let moves;
  try { moves = parse(alg); } catch (e) { return { error: 'notation: ' + e.message }; }
  const fix = rotationFix(moves);
  if (fix === null) return { error: 'net rotation' };
  const setupMoves = invert([...moves, ...parse(fix)]);
  const f = new Frame(apply(solvedFacelets(), setupMoves));
  const out = { frame: f, moves, fix, setup: format(setupMoves) };
  if (type === 'f2l') {
    const ok = f.crossSolved && [1, 2, 3].every(s => f.slotSolved(s)) && !f.slotSolved(0) && f2lPlayable(f.cc);
    return ok ? out : { error: 'not an FR-slot F2L case' };
  }
  if (type === 'oll') return f.f2lSolved && !f.ollSolved ? out : { error: 'not an OLL case' };
  if (type === 'pll') return f.ollSolved && !f.solved ? out : { error: 'not a PLL case' };
  return { error: 'type' };
}

/** All keys of a case's equivalence class under pre-AUF (and post-AUF for PLL). */
export function caseClass(type, alg) {
  const r = caseOf(type, alg);
  if (r.error) return null;
  const keys = new Set();
  for (const a of AUF) {
    if (type === 'pll') {
      for (const b of AUF) {
        const f = new Frame(apply(solvedFacelets(), invert(parse(`${a} ${alg} ${r.fix} ${b}`))));
        keys.add(pllKey(f.cc));
      }
    } else {
      const f = r.frame.apply(a);
      keys.add(type === 'f2l' ? f2lKey(f.cc) : ollKey(f.cc));
    }
  }
  return keys;
}

const rotations = moves => moves.filter(m => 'xyz'.includes(m.base)).length;

export class CaseLibrary {
  /**
   * cases: [{id, type, name, algs:[{alg}]}]. For every recognizable situation the solver keeps the
   * algorithm that is easiest to execute: fewest whole-cube rotations, then the library order
   * (recommended first), then fewest moves.
   */
  constructor(cases) {
    this.f2l = new Map(); this.oll = new Map(); this.pll = new Map(); this.rejected = [];
    const offer = (map, key, info) => { const cur = map.get(key); if (!cur || info.score < cur.score) map.set(key, info); };
    for (const c of cases) {
      c.algs.forEach((entry, rank) => {
        const r = caseOf(c.type, entry.alg);
        if (r.error) { this.rejected.push([c.id, entry.alg, r.error]); return; }
        const alg = r.fix ? `${entry.alg} ${r.fix}` : entry.alg;
        const moves = parse(alg);
        const info = { caseId: c.id, name: c.name, alg, recognition: c.recognition || '', score: rotations(moves) * 100 + rank * 10 + htm(moves) };
        if (c.type === 'f2l') offer(this.f2l, f2lKey(r.frame.cc), info);
        if (c.type === 'oll') offer(this.oll, ollKey(r.frame.cc), info);
        if (c.type === 'pll') {
          AUF.forEach((b, bi) => {
            const f = new Frame(apply(solvedFacelets(), invert(parse(`${alg} ${b}`))));
            offer(this.pll, pllKey(f.cc), { ...info, post: bi });
          });
        }
      });
    }
  }
}

// ------------------------------------------------------------------ cross (optimal)

const FACE_MOVES = ['U', 'R', 'F', 'D', 'L', 'B'].flatMap(f => [f, f + '2', f + "'"]);
let crossTables = null;
function crossData() {
  if (crossTables) return crossTables;
  const mcs = FACE_MOVES.map(m => toCubie(apply(solvedFacelets(), m)));
  const next = new Int32Array(24 * 18);
  for (let s = 0; s < 24; s++) for (let m = 0; m < 18; m++) {
    const pos = s >> 1, ori = s & 1, mc = mcs[m];
    const np = mc.ep.indexOf(pos);
    next[s * 18 + m] = np * 2 + ((ori + mc.eo[np]) & 1);
  }
  const N = 24 ** 4, dist = new Int8Array(N).fill(-1);
  const idx = (a, b, c, d) => ((a * 24 + b) * 24 + c) * 24 + d;
  const solved = idx(8, 10, 12, 14);
  dist[solved] = 0;
  let frontier = [solved], depth = 0;
  while (frontier.length) {
    const nf = [];
    for (const i of frontier) {
      const d = i % 24, c = Math.floor(i / 24) % 24, b = Math.floor(i / 576) % 24, a = Math.floor(i / 13824);
      for (let m = 0; m < 18; m++) {
        const j = idx(next[a * 18 + m], next[b * 18 + m], next[c * 18 + m], next[d * 18 + m]);
        if (dist[j] < 0) { dist[j] = depth + 1; nf.push(j); }
      }
    }
    frontier = nf; depth++;
  }
  // Prefer U, R, F, L, D, B and quarter turns when several moves are optimal.
  const preferred = [0, 1, 2, 4, 3, 5].flatMap(f => [0, 2, 1].map(p => f * 3 + p));
  crossTables = { next, dist, idx, preferred };
  return crossTables;
}
export function solveCross(cc) {
  const { next, dist, idx, preferred } = crossData();
  let s = [4, 5, 6, 7].map(piece => { const pos = cc.ep.indexOf(piece); return pos * 2 + cc.eo[pos]; });
  let d = dist[idx(...s)];
  const out = [];
  while (d > 0) {
    for (const m of preferred) {
      const ns = s.map(x => next[x * 18 + m]);
      if (dist[idx(...ns)] === d - 1) { out.push(FACE_MOVES[m]); s = ns; d--; break; }
    }
  }
  return out.join(' ');
}

// ------------------------------------------------------------------ solver

export const GOALS = {
  all: 'Giải toàn bộ', cross: 'Cross', f2l: 'F2L (4 cặp)', pair: 'Một cặp F2L', oll: 'OLL', pll: 'PLL',
};

const tidy = text => format(simplify(parse(text)));

export class CfopSolver {
  constructor(cases) { this.library = new CaseLibrary(cases); }

  /** Rotation that puts the white center on D, keeping the front if possible. */
  holdRotation(state) {
    let best = null;
    for (const alg of ORIENTATIONS) {
      const c = centers(apply(state, alg));
      if (c[3] !== CROSS_COLOR) continue;
      const score = (c[2] === state[2 * 9 + 4] ? 0 : 10) + (c[2] === 'F' ? 0 : 1) + alg.length;
      if (!best || score < best.score) best = { alg, score };
    }
    return best.alg;
  }

  analyze(state) {
    const f = new Frame(apply(state, this.holdRotation(state)));
    return { crossSolved: f.crossSolved, slots: f.solvedSlots.length, f2lSolved: f.f2lSolved, ollSolved: f.ollSolved, solved: f.solved };
  }

  /** Why a goal cannot be used right now (null = available). */
  availability(state, goal) {
    const a = this.analyze(state);
    if (a.solved) return 'Cube đã được giải.';
    switch (goal) {
      case 'cross': return a.crossSolved ? 'Cross trắng đã xong — chọn F2L hoặc Giải toàn bộ.' : null;
      case 'f2l': case 'pair':
        if (!a.crossSolved) return 'Cần hoàn thành Cross trắng trước. Chọn “Cross” hoặc “Giải toàn bộ”.';
        return a.f2lSolved ? 'F2L đã xong — chọn OLL.' : null;
      case 'oll':
        if (!a.f2lSolved) return `OLL chỉ dùng khi đã xong hai tầng đầu (hiện có ${a.crossSolved ? a.slots + '/4 cặp F2L' : 'chưa có Cross'}).`;
        return a.ollSolved ? 'Mặt vàng đã xong — chọn PLL.' : null;
      case 'pll':
        return a.ollSolved ? null : 'PLL chỉ dùng khi mặt vàng phía trên đã cùng màu (xong OLL).';
      default: return null;
    }
  }

  /**
   * Solves towards a goal. Returns {ok, steps:[{stage,title,moves,explanation,caseId}], solved, remaining}
   * where `remaining` lists the CFOP stages still left after a partial goal.
   */
  solve(state, goal = 'all') {
    const v = validate(state);
    if (!v.ok) return { ok: false, error: v.errors[0].message, errors: v.errors };
    const why = this.availability(state, goal);
    if (why) return { ok: false, notApplicable: true, error: why };
    const steps = [];
    const hold = this.holdRotation(state);
    let f = new Frame(state);
    if (hold) {
      steps.push({ stage: 'hold', title: 'Cầm cube', moves: hold, explanation: 'Xoay cả khối để tâm trắng nằm dưới, mặt vàng hướng lên trên.' });
      f = f.apply(hold);
    }
    const push = (s) => { steps.push(s); f = f.apply(s.moves); };
    try {
      if (goal === 'cross') push(this.crossStep(f));
      else if (goal === 'pair') push(this.f2lStep(f));
      else if (goal === 'oll') push(this.ollStep(f));
      else if (goal === 'pll') push(this.pllStep(f));
      else {
        if (!f.crossSolved) push(this.crossStep(f));
        while (!f.f2lSolved) push(this.f2lStep(f));
        if (goal === 'all') {
          if (!f.ollSolved) push(this.ollStep(f));
          if (!f.solved) push(this.pllStep(f));
        }
      }
    } catch (e) {
      return { ok: false, error: e.message };
    }
    const remaining = [];
    if (!f.crossSolved) remaining.push('Cross');
    if (!f.f2lSolved) remaining.push(`F2L (${f.crossSolved ? 4 - f.solvedSlots.length : 4} cặp)`);
    if (!f.ollSolved) remaining.push('OLL');
    if (!f.solved) remaining.push('PLL');
    return { ok: true, steps, solved: f.solved, remaining, endState: f.state };
  }

  crossStep(f) {
    const moves = solveCross(f.cc);
    const n = moves ? moves.split(' ').length : 0;
    return { stage: 'cross', title: 'Cross', moves, explanation: `Tạo dấu cộng trắng ở mặt dưới, mỗi cạnh khớp màu với tâm bên cạnh (${n} bước, tối ưu).` };
  }

  f2lStep(f) {
    let best = null;
    for (let slot = 0; slot < 4; slot++) {
      if (f.slotSolved(slot)) continue;
      const plan = this.planPair(f, slot);
      if (!plan) continue;
      const cost = plan.cost + (slot ? 1 : 0);
      if (!best || cost < best.cost) best = { ...plan, slot, cost };
    }
    if (!best) throw new Error('Thư viện F2L thiếu trường hợp cho trạng thái hiện tại.');
    const target = f.apply(Y_TO_FR[best.slot]);
    const corner = [3, 2, 1].map(i => COLOR_VI[target.color(i)]).join('-');
    const edge = [2, 1].map(i => COLOR_VI[target.color(i)]).join('-');
    const n = f.solvedSlots.length + 1;
    return {
      stage: 'f2l', title: `F2L ${n}`, moves: best.moves, caseId: best.info.caseId,
      explanation: `Ghép góc ${corner} với cạnh ${edge} vào khe ${SLOT_NAMES[best.slot]}` +
        (Y_TO_FR[best.slot] ? ` (xoay ${Y_TO_FR[best.slot]} để khe về trước-phải)` : '') + `. Trường hợp: ${best.info.name}.`,
    };
  }

  planPair(f, slot) {
    let moves = Y_TO_FR[slot];
    let cur = f.apply(moves);
    for (let k = 0; k < 2 && !f2lPlayable(cur.cc); k++) {
      const c = cur.cc;
      const cp = c.cp.indexOf(DFR), ep = c.ep.indexOf(FR);
      let stuck = SLOT_CORNER.indexOf(cp);
      if (!(stuck > 0)) stuck = SLOT_EDGE.indexOf(ep);
      if (!(stuck > 0)) return null;
      moves += ' ' + EXTRACT[stuck];
      cur = cur.apply(EXTRACT[stuck]);
    }
    if (!f2lPlayable(cur.cc)) return null;
    let best = null;
    for (const a of AUF) {
      const info = this.library.f2l.get(f2lKey(cur.apply(a).cc));
      if (!info) continue;
      const total = tidy(`${moves} ${a} ${info.alg}`);
      const cost = info.score + htm(parse(total));
      if (!best || cost < best.cost) best = { moves: total, info, cost };
    }
    return best;
  }

  ollStep(f) {
    let best = null;
    for (const a of AUF) {
      const info = this.library.oll.get(ollKey(f.apply(a).cc));
      if (!info) continue;
      const total = tidy(`${a} ${info.alg}`);
      const cost = info.score + htm(parse(total));
      if (!best || cost < best.cost) best = { moves: total, info, cost };
    }
    if (!best) throw new Error('Không tìm thấy công thức OLL phù hợp trong thư viện.');
    return { stage: 'oll', title: 'OLL', moves: best.moves, caseId: best.info.caseId, explanation: `${best.info.name}: lật các mảnh để mặt trên cùng màu vàng.` + (best.info.recognition ? ' Nhận diện: ' + best.info.recognition : '') };
  }

  pllStep(f) {
    let best = null;
    for (const a of AUF) {
      const g = f.apply(a);
      if (g.solved) { const cost = htm(parse(a)); if (!best || cost < best.cost) best = { moves: a, info: null, cost }; continue; }
      const info = this.library.pll.get(pllKey(g.cc));
      if (!info) continue;
      const total = tidy(`${a} ${info.alg} ${AUF[info.post]}`);
      const cost = info.score + htm(parse(total));
      if (!best || cost < best.cost) best = { moves: total, info, cost };
    }
    if (!best) throw new Error('Không tìm thấy công thức PLL phù hợp trong thư viện.');
    return best.info
      ? { stage: 'pll', title: 'PLL', moves: best.moves, caseId: best.info.caseId, explanation: `${best.info.name}: hoán vị các mảnh tầng trên về đúng chỗ (gồm chỉnh U cuối nếu cần).` }
      : { stage: 'pll', title: 'AUF', moves: best.moves, explanation: 'Chỉ cần xoay mặt trên để hoàn thành.' };
  }
}

/** Rotation that brings a solved-or-not cube back to the standard orientation (white U, green F). */
export function standardOrientation(state) {
  for (const alg of ORIENTATIONS) {
    const c = centers(apply(state, alg));
    if (c[0] === 'U' && c[2] === 'F') return alg;
  }
  return '';
}
