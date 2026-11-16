// 3x3 sticker model. 54 facelets in Kociemba order U R F D L B, each face row-major as seen
// looking straight at it (U with B at the top, D with F at the top, side faces with U at the top).
// Moves are derived geometrically from sticker positions, so faces, wide turns, slices and
// whole-cube rotations all share one implementation.

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

const AXIS = { x: 0, y: 1, z: 2 };
// [axis, layer predicate, sign]: sign -1 means "clockwise seen from the + side of the axis".
const MOVE_DEFS = {
  U: ['y', p => p[1] === 1, -1], D: ['y', p => p[1] === -1, 1],
  R: ['x', p => p[0] === 1, -1], L: ['x', p => p[0] === -1, 1],
  F: ['z', p => p[2] === 1, -1], B: ['z', p => p[2] === -1, 1],
  u: ['y', p => p[1] >= 0, -1], d: ['y', p => p[1] <= 0, 1],
  r: ['x', p => p[0] >= 0, -1], l: ['x', p => p[0] <= 0, 1],
  f: ['z', p => p[2] >= 0, -1], b: ['z', p => p[2] <= 0, 1],
  M: ['x', p => p[0] === 0, 1], E: ['y', p => p[1] === 0, 1], S: ['z', p => p[2] === 0, -1],
  x: ['x', () => true, -1], y: ['y', () => true, -1], z: ['z', () => true, -1],
};

function stickerGeometry(i) {
  const f = Math.floor(i / 9), r = Math.floor((i % 9) / 3), c = i % 3;
  switch (FACES[f]) {
    case 'U': return { p: [c - 1, 1, r - 1], n: [0, 1, 0] };
    case 'R': return { p: [1, 1 - r, 1 - c], n: [1, 0, 0] };
    case 'F': return { p: [c - 1, 1 - r, 1], n: [0, 0, 1] };
    case 'D': return { p: [c - 1, -1, 1 - r], n: [0, -1, 0] };
    case 'L': return { p: [-1, 1 - r, c - 1], n: [-1, 0, 0] };
    default: return { p: [1 - c, 1 - r, -1], n: [0, 0, -1] };
  }
}
export const GEOMETRY = Array.from({ length: 54 }, (_, i) => stickerGeometry(i));
const key = (p, n) => p.join(',') + '|' + n.join(',');
const INDEX = new Map(GEOMETRY.map((g, i) => [key(g.p, g.n), i]));

// Quarter turn about an axis; sign -1 is clockwise seen from the + side.
function rotate(v, axis, sign) {
  const [x, y, z] = v;
  if (axis === 0) return sign < 0 ? [x, z, -y] : [x, -z, y];
  if (axis === 1) return sign < 0 ? [-z, y, x] : [z, y, -x];
  return sign < 0 ? [y, -x, z] : [-y, x, z];
}

// perm[j] = i means the sticker now at j came from i.
function quarterPerm(name) {
  const [axisName, inLayer, sign] = MOVE_DEFS[name];
  const axis = AXIS[axisName];
  const perm = new Array(54);
  GEOMETRY.forEach((g, i) => {
    const j = inLayer(g.p) ? INDEX.get(key(rotate(g.p, axis, sign), rotate(g.n, axis, sign))) : i;
    perm[j] = i;
  });
  return perm;
}
const compose = (a, b) => b.map(i => a[i]); // a then b
const QUARTER = Object.fromEntries(Object.keys(MOVE_DEFS).map(n => [n, quarterPerm(n)]));
const PERMS = new Map();
function permFor(base, amount) {
  const k = base + amount;
  if (!PERMS.has(k)) {
    let p = [...Array(54).keys()];
    for (let i = 0; i < amount; i++) p = compose(p, QUARTER[base]);
    PERMS.set(k, p);
  }
  return PERMS.get(k);
}

// ------------------------------------------------------------------ notation

const ALIASES = { Uw: 'u', Dw: 'd', Rw: 'r', Lw: 'l', Fw: 'f', Bw: 'b' };
const TOKEN = /([URFDLBMESxyz]w?|[urfdlb])(\d*)('?)/y;

/** Parses an algorithm into [{base, amount}] with amount in 1..3. Supports ( ) groups with repeat counts. */
export function parse(text) {
  const src = String(text).replace(/[’′`]/g, "'").replace(/\[|\]/g, s => (s === '[' ? '(' : ')'));
  let i = 0;
  function seq(depth) {
    const out = [];
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '(') {
        i++;
        const inner = seq(depth + 1);
        if (src[i] !== ')') throw new Error('Thiếu dấu ")"');
        i++;
        const m = /^(\d*)('?)/.exec(src.slice(i));
        i += m[0].length;
        let group = inner;
        if (m[2]) group = invert(group);
        const times = m[1] ? Number(m[1]) : 1;
        for (let t = 0; t < times; t++) out.push(...group);
        continue;
      }
      if (ch === ')') { if (depth === 0) throw new Error('Thừa dấu ")"'); return out; }
      TOKEN.lastIndex = i;
      const m = TOKEN.exec(src);
      if (!m) throw new Error(`Ký hiệu không hợp lệ gần "${src.slice(i, i + 4)}"`);
      i = TOKEN.lastIndex;
      const base = ALIASES[m[1]] || m[1];
      let amount = (m[2] ? Number(m[2]) : 1) % 4;
      if (m[3]) amount = (4 - amount) % 4;
      if (amount) out.push({ base, amount });
    }
    if (depth > 0) throw new Error('Thiếu dấu ")"');
    return out;
  }
  return seq(0);
}

export const invert = moves => moves.slice().reverse().map(m => ({ base: m.base, amount: (4 - m.amount) % 4 }));

const WIDE_OUT = { u: 'Uw', d: 'Dw', r: 'Rw', l: 'Lw', f: 'Fw', b: 'Bw' };
export function format(moves, { wide = 'lower' } = {}) {
  return moves.map(m => {
    const b = wide === 'w' && WIDE_OUT[m.base] ? WIDE_OUT[m.base] : m.base;
    return b + (m.amount === 2 ? '2' : m.amount === 3 ? "'" : '');
  }).join(' ');
}

/** Merges consecutive turns of the same layer (R R -> R2, R R' -> nothing). */
export function simplify(moves) {
  const out = [];
  for (const m of moves) {
    const last = out[out.length - 1];
    if (last && last.base === m.base) {
      const amount = (last.amount + m.amount) % 4;
      if (amount) out[out.length - 1] = { base: m.base, amount }; else out.pop();
    } else out.push({ ...m });
  }
  return out;
}

const ROTATIONS = new Set(['x', 'y', 'z']);
/** Half-turn metric, whole-cube rotations excluded. */
export const htm = moves => moves.filter(m => !ROTATIONS.has(m.base)).length;
export const isRotation = m => ROTATIONS.has(m.base);

// ------------------------------------------------------------------ state

/** Color letters of a solved cube in its own frame: the letter is the face name of the color's home. */
export const solvedFacelets = () => FACES.flatMap(f => Array(9).fill(f));

/** Applies moves (parsed or text) to a facelet array; returns a new array. */
export function apply(facelets, moves) {
  const list = typeof moves === 'string' ? parse(moves) : moves;
  let s = facelets;
  for (const m of list) {
    const p = permFor(m.base, m.amount);
    s = p.map(i => s[i]);
  }
  return s;
}

export const centers = s => FACES.map((_, f) => s[f * 9 + 4]);

// The 24 whole-cube orientations as rotation sequences, simplest names first.
export const ORIENTATIONS = (() => {
  const singles = ['', 'y', "y'", 'y2', 'x', "x'", 'x2', 'z', "z'", 'z2'];
  const combos = [];
  for (const a of ['x', "x'", 'x2', 'z', "z'"]) for (const b of ['y', "y'", 'y2']) combos.push(`${a} ${b}`);
  const out = [], seen = new Set();
  for (const alg of [...singles, ...combos]) {
    const c = centers(apply(solvedFacelets(), alg)).join('');
    if (!seen.has(c)) { seen.add(c); out.push(alg); }
  }
  return out;
})();

/** Rotation that turns the cube so the given colors sit on U and F (null if impossible). */
export function orientationFor(state, upColor, frontColor) {
  for (const alg of ORIENTATIONS) {
    const c = centers(apply(state, alg));
    if (c[0] === upColor && c[2] === frontColor) return alg;
  }
  return null;
}

/** Maps face letters of a move list through a whole-cube rotation (conjugation), e.g. z2: U<->D, R<->L. */
export function conjugate(moves, rotation) {
  // Track where each face's center goes: the move on face X in the old frame is the move on
  // face rot(X) in the new frame.
  const before = solvedFacelets();
  const after = apply(before, rotation);
  const faceAfter = {};
  FACES.forEach((f, i) => { faceAfter[after[i * 9 + 4]] = FACES[i]; });
  const map = b => {
    const upper = b.toUpperCase();
    if (FACES.includes(upper)) { const t = faceAfter[upper]; return b === upper ? t : t.toLowerCase(); }
    return null;
  };
  return moves.map(m => {
    const t = map(m.base);
    if (!t) throw new Error('Chỉ chuyển được lượt xoay mặt hoặc wide');
    return { base: t, amount: m.amount };
  });
}
