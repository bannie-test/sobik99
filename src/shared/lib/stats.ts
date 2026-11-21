export type Penalty = 'none' | '+2' | 'DNF';

export interface Solve {
  id: string;
  ms: number;
  scramble: string;
  /** ISO 8601 */
  date: string;
  penalty: Penalty;
}

export const PENALTIES: readonly Penalty[] = ['none', '+2', 'DNF'];

type Timed = Pick<Solve, 'ms' | 'penalty'>;

/** Thời gian tính điểm: DNF = Infinity, +2 cộng 2000 ms. */
export const effective = (s: Timed): number =>
  s.penalty === 'DNF' ? Infinity : s.ms + (s.penalty === '+2' ? 2000 : 0);

/** Trung bình cắt (AoN): lấy N lần gần nhất, bỏ nhanh nhất và chậm nhất. */
export function averageOf(solves: readonly Timed[], n: number): number | null {
  if (solves.length < n) return null;
  const trimmed = solves
    .slice(-n)
    .map(effective)
    .sort((a, b) => a - b)
    .slice(1, -1);
  if (trimmed.some((x) => !Number.isFinite(x))) return Infinity;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/** mm:ss.cc, `—` khi không có dữ liệu, `DNF` khi vô hạn. */
export function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (!Number.isFinite(ms)) return 'DNF';
  const cs = Math.floor(ms / 10);
  const minutes = String(Math.floor(cs / 6000)).padStart(2, '0');
  const seconds = String(Math.floor(cs / 100) % 60).padStart(2, '0');
  const centis = String(cs % 100).padStart(2, '0');
  return `${minutes}:${seconds}.${centis}`;
}

export interface Statistics {
  best: number | null;
  worst: number | null;
  ao5: number | null;
  ao12: number | null;
}

export function statistics(solves: readonly Timed[]): Statistics {
  const times = solves.map(effective);
  const valid = times.filter(Number.isFinite);
  return {
    best: valid.length ? Math.min(...valid) : null,
    worst: times.length ? Math.max(...times) : null,
    ao5: averageOf(solves, 5),
    ao12: averageOf(solves, 12),
  };
}
