import { randomScramble3x3 } from '../../cube-tools/core/cubing-search.js';
import { read, STORAGE_KEYS, validHistory, write } from '../../shared/lib/storage';
import type { Penalty, Solve } from '../../shared/lib/stats';
import { createStore } from '../../shared/store/createStore';

/**
 * Trạng thái timer sống ngoài component: rời trang Timer rồi quay lại thì
 * đồng hồ đang chạy / kết quả chưa lưu / scramble vẫn còn (như bản cũ).
 */
export interface TimerState {
  history: Solve[];
  scramble: string;
  running: boolean;
  /** performance.now() lúc bắt đầu */
  startedAt: number;
  /** Kết quả đã dừng nhưng chưa lưu */
  pending: Solve | null;
  loading: boolean;
}

const initialState = (): TimerState => ({
  history: read(STORAGE_KEYS.timerHistory, [], validHistory),
  scramble: '',
  running: false,
  startedAt: 0,
  pending: null,
  loading: false,
});

export const timerStore = createStore<TimerState>(initialState());

const patch = (partial: Partial<TimerState>) => timerStore.set((s) => ({ ...s, ...partial }));

/** Chỉ dùng trong test. */
export const resetTimerStore = () => {
  generation = null;
  timerStore.set(initialState());
};

/* ---------- Scramble ---------- */

export type ScrambleLoader = () => Promise<string>;

/** Scramble random-state chính thức 3×3 từ cubing.js (tải khi cần). */
export const cubingScramble: ScrambleLoader = randomScramble3x3;

let generation: Promise<void> | null = null;

export type GenerateResult = 'skipped' | 'ok' | 'failed';

/** Tạo scramble mới; các lời gọi chồng nhau dùng chung một lần tạo. */
export async function generateScramble(loader: ScrambleLoader = cubingScramble): Promise<GenerateResult> {
  const { running, pending } = timerStore.get();
  if (running || pending) return 'skipped';
  patch({ loading: true });
  if (!generation) {
    generation = (async () => {
      let scramble = '';
      try {
        scramble = await loader();
      } catch {
        scramble = '';
      } finally {
        patch({ scramble, loading: false });
        generation = null;
      }
    })();
  }
  await generation;
  return timerStore.get().scramble ? 'ok' : 'failed';
}

/* ---------- Đồng hồ ---------- */

const newId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export const canToggle = ({ loading, scramble, pending }: TimerState): boolean => !loading && !!scramble && !pending;

/** Bắt đầu, hoặc dừng và tạo kết quả chờ lưu. */
export function toggleTimer(now: number = performance.now()): void {
  const s = timerStore.get();
  if (!canToggle(s)) return;
  if (s.running) {
    patch({
      running: false,
      pending: {
        id: newId(),
        ms: now - s.startedAt,
        scramble: s.scramble,
        date: new Date().toISOString(),
        penalty: 'none',
      },
    });
  } else {
    patch({ running: true, startedAt: now });
  }
}

/* ---------- Lịch sử (mỗi hàm trả false nếu không ghi được localStorage) ---------- */

const persist = (history: Solve[]): boolean => {
  patch({ history });
  return write(STORAGE_KEYS.timerHistory, history);
};

export function savePending(): boolean {
  const { pending, history } = timerStore.get();
  if (!pending) return true;
  patch({ pending: null });
  return persist([...history, pending]);
}

export const discardPending = (): void => patch({ pending: null });

export const setPenalty = (id: string, penalty: Penalty): boolean =>
  persist(timerStore.get().history.map((s) => (s.id === id ? { ...s, penalty } : s)));

export const deleteSolve = (id: string): boolean => persist(timerStore.get().history.filter((s) => s.id !== id));

export const clearHistory = (): boolean => persist([]);
