import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../shared/store/createStore';
import { useToast } from '../../shared/ui/Toast';
import * as timer from './timerStore';

const SAVE_FAILED = 'Trình duyệt không lưu được lịch sử. Hãy xuất CSV để giữ kết quả.';
const SCRAMBLE_FAILED = 'Không tạo được scramble. Bấm Scramble mới để thử lại.';

/** Nối timerStore với UI: đọc state, gọi action và hiện thông báo khi lỗi. */
export function useTimer() {
  const state = useStore(timer.timerStore);
  const toast = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const generate = useCallback(async () => {
    const result = await timer.generateScramble();
    if (mounted.current && result === 'failed') toast(SCRAMBLE_FAILED);
  }, [toast]);

  /** Chạy action ghi lịch sử, báo lỗi nếu localStorage không ghi được. */
  const persisting = useCallback(
    <A extends unknown[]>(action: (...args: A) => boolean) =>
      (...args: A) => {
        if (!action(...args)) toast(SAVE_FAILED);
      },
    [toast],
  );

  return {
    state,
    generate,
    toggle: () => timer.toggleTimer(),
    save: () => {
      if (!timer.timerStore.get().pending) return;
      persisting(timer.savePending)();
      void generate();
    },
    discard: () => {
      timer.discardPending();
      void generate();
    },
    setPenalty: persisting(timer.setPenalty),
    deleteSolve: persisting(timer.deleteSolve),
    clearHistory: persisting(timer.clearHistory),
  };
}
