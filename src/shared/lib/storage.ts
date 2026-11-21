import { PENALTIES, type Solve } from './stats';

/** Khóa localStorage — giữ nguyên với bản cũ để không mất dữ liệu người dùng. */
export const STORAGE_KEYS = {
  compare: 'sobik_compare',
  learned: 'sobik_learned',
  timerHistory: 'rubik_timer_history',
} as const;

export type Validator<T> = (value: unknown) => value is T;

/**
 * Đọc JSON an toàn: trả fallback khi storage không khả dụng, JSON hỏng,
 * hoặc dữ liệu không qua validator (localStorage là dữ liệu không tin cậy).
 */
export function read<T>(key: string, fallback: T, validate: (value: unknown) => boolean = () => true): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) as string);
    return value !== null && validate(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Ghi JSON; trả false khi hết quota hoặc storage bị chặn. */
export function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

export const validHistory = (v: unknown): v is Solve[] =>
  Array.isArray(v) &&
  v.every(
    (x) =>
      isRecord(x) &&
      typeof x.id === 'string' &&
      Number.isFinite(x.ms) &&
      (x.ms as number) >= 0 &&
      typeof x.scramble === 'string' &&
      typeof x.date === 'string' &&
      PENALTIES.includes(x.penalty as Solve['penalty']),
  );
