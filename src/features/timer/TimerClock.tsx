import { useEffect, useState } from 'react';
import { formatTime } from '../../shared/lib/stats';

/**
 * Chỉ component này render lại mỗi frame khi đồng hồ chạy,
 * phần còn lại của trang không bị ảnh hưởng.
 */
export function TimerClock({
  running,
  startedAt,
  stoppedMs,
}: {
  running: boolean;
  startedAt: number;
  stoppedMs: number;
}) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return <span id="timer-value">{formatTime(running ? now - startedAt : stoppedMs)}</span>;
}
