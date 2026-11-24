/**
 * Mô phỏng Rubik 3×3 bằng ma trận quay: 26 cubie, xáo bằng 20 phép xoay hợp lệ
 * rồi giải bằng chuỗi nghịch đảo. Thuần logic, không đụng DOM → test được.
 */
export type Vec3 = [number, number, number];
/** Ma trận 3×3 dạng phẳng, theo hàng. */
export type Mat3 = number[];

export interface Cubie {
  /** Vị trí hiện tại (-1..1 mỗi trục) */
  p: number[];
  /** Ma trận hướng */
  m: Mat3;
  /** Vị trí khi đã giải — quyết định màu các mặt */
  home: Vec3;
}

export interface Turn {
  /** Trục: 0 = x, 1 = y, 2 = z */
  a: number;
  /** Lớp bị xoay trên trục */
  l: number;
  /** Số phần tư vòng (có dấu) */
  q: number;
  notation: string;
}

export interface CubeTimeline {
  solved: Cubie[];
  /** states[k] = trạng thái sau k bước giải (states[0] = đã xáo) */
  states: Cubie[][];
  turns: Turn[];
  scramble: string[];
  /** Trạng thái nội suy tại thời điểm t ∈ [0, 20] (phần lẻ = đang xoay dở) */
  sample: (t: number) => Cubie[];
  vec: (m: Mat3, p: readonly number[]) => number[];
}

export const SCRAMBLE = "R U2 F' L D B2 R' U F2 D' L2 B U' R2 F D2 L' U B' R".split(' ');

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const mul = (a: Mat3, b: Mat3): Mat3 =>
  Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    return a[r * 3]! * b[c]! + a[r * 3 + 1]! * b[c + 3]! + a[r * 3 + 2]! * b[c + 6]!;
  });

const vec = (m: Mat3, p: readonly number[]): number[] =>
  [0, 1, 2].map((r) => m[r * 3]! * p[0]! + m[r * 3 + 1]! * p[1]! + m[r * 3 + 2]! * p[2]!);

const rot = (axis: number, t: number): Mat3 => {
  const c = Math.cos(t);
  const s = Math.sin(t);
  if (axis === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};

/** [trục, lớp, chiều] của từng mặt */
const FACE_TURNS: Record<string, [number, number, number]> = {
  R: [0, 1, -1],
  L: [0, -1, 1],
  U: [1, -1, -1],
  D: [1, 1, 1],
  F: [2, 1, 1],
  B: [2, -1, -1],
};

const parse = (s: string): Turn => {
  const [a, l, d] = FACE_TURNS[s[0]!]!;
  const amount = s.endsWith('2') ? 2 : s.endsWith("'") ? -1 : 1;
  return { a, l, q: d * amount, notation: s };
};

const apply = (state: Cubie[], move: Turn): Cubie[] => {
  const r = rot(move.a, (move.q * Math.PI) / 2).map(Math.round);
  return state.map((c) =>
    c.p[move.a] === move.l
      ? { ...c, p: vec(r, c.p).map(Math.round), m: mul(r, c.m).map(Math.round) }
      : { ...c, p: [...c.p], m: [...c.m] },
  );
};

function randomScramble(): string[] {
  const axes = ['RL', 'UD', 'FB'];
  const suffixes = ['', "'", '2'];
  const choose = <T,>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)]!;
  let previous = '';
  return Array.from({ length: 20 }, () => {
    previous = choose(axes.filter((axis) => axis !== previous));
    return choose([...previous]) + choose(suffixes);
  });
}

export function cubeTimeline(scramble: string[] = randomScramble()): CubeTimeline {
  const solved: Cubie[] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) if (x || y || z) solved.push({ p: [x, y, z], m: [...IDENTITY], home: [x, y, z] });

  let state = solved;
  for (const s of scramble) state = apply(state, parse(s));

  const turns = scramble
    .map(parse)
    .reverse()
    .map((m) => ({ ...m, q: -m.q }));
  const states = [state];
  for (const m of turns) {
    state = apply(state, m);
    states.push(state);
  }

  const sample = (t: number): Cubie[] => {
    const k = Math.min(turns.length, Math.floor(t));
    const f = t - k;
    const base = states[k]!;
    const move = turns[k];
    if (!move || !f) return base;
    const r = rot(move.a, ((move.q * Math.PI) / 2) * f);
    return base.map((c) => (c.p[move.a] === move.l ? { ...c, p: vec(r, c.p), m: mul(r, c.m) } : c));
  };

  return { solved, states, turns, scramble, sample, vec };
}

/* ---------- Màu & sơ đồ 6 mặt ---------- */

/** Thứ tự mặt: F, B, R, L, U, D */
export const FACE_LABELS = ['F', 'B', 'R', 'L', 'U', 'D'] as const;
export const FACE_NORMALS: Vec3[] = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
];
export const FACE_COLORS = ['#ff7650', '#eb4e65', '#2e65eb', '#25b58a', '#fff9e8', '#ffcf42'];
export const INNER_COLOR = '#292339';

/** Mặt thứ `face` của cubie có màu (nằm ở mặt ngoài khi đã giải) hay không. */
export const isOutside = (home: Vec3, face: number): boolean =>
  FACE_NORMALS[face]!.some((v, k) => v !== 0 && v === home[k]);

/** Màu 9 ô của từng mặt (thứ tự FACE_LABELS) cho một trạng thái. */
export function netColors(state: readonly Cubie[]): string[][] {
  const values = FACE_NORMALS.map(() => Array<string>(9).fill(INNER_COLOR));
  for (const c of state) {
    FACE_NORMALS.forEach((n, color) => {
      if (!isOutside(c.home, color)) return;
      const v = vec(c.m, n);
      const face = FACE_NORMALS.findIndex((fn) => fn.every((x, a) => x === v[a]));
      let x: number, y: number;
      if (face < 2) [x, y] = [c.p[0]!, c.p[1]!];
      else if (face < 4) [x, y] = [c.p[2]!, c.p[1]!];
      else [x, y] = [c.p[0]!, c.p[2]!];
      values[face]![(y + 1) * 3 + x + 1] = FACE_COLORS[color]!;
    });
  }
  return values;
}

export const solvedFaceCount = (net: readonly string[][]): number => net.filter((a) => new Set(a).size === 1).length;

/** Ma trận CSS matrix3d (cột chính) từ ma trận hướng 3×3. */
export function toMatrix3d(m: Mat3): string {
  return [m[0], m[3], m[6], 0, m[1], m[4], m[7], 0, m[2], m[5], m[8], 0, 0, 0, 0, 1]
    .map((v) => (Math.abs(v!) < 1e-9 ? 0 : v))
    .join(',');
}
