import { useEffect, useRef } from 'react';
import { downloadText } from '../../shared/lib/csv';
import { formatTime, statistics } from '../../shared/lib/stats';
import { useModal } from '../../shared/ui/Modal';
import { historyCsv } from './exportCsv';
import { HistoryTable } from './HistoryTable';
import { TimerClock } from './TimerClock';
import { canToggle, timerStore } from './timerStore';
import { useTimer } from './useTimer';

const STAT_LABELS = [
  ['best', 'Best'],
  ['worst', 'Worst'],
  ['ao5', 'Ao5'],
  ['ao12', 'Ao12'],
] as const;

/** Phím Space không kích hoạt timer khi đang gõ hoặc focus vào control khác. */
const isInteractive = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest('input,textarea,select,button,a'));

export default function TimerPage() {
  const modal = useModal();
  const { state, generate, toggle, save, discard, setPenalty, deleteSolve, clearHistory } = useTimer();
  const { history, scramble, running, startedAt, pending, loading } = state;
  const stats = statistics(history);

  // Giữ tham chiếu mới nhất cho listener bàn phím đăng ký một lần.
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.code !== 'Space' || e.repeat || modal.isOpen() || isInteractive(e.target)) return;
        e.preventDefault();
        toggleRef.current();
      },
      { signal: controller.signal },
    );
    window.addEventListener(
      'keyup',
      (e) => {
        if (e.code === 'Space' && !isInteractive(e.target)) e.preventDefault();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [modal]);

  // Vào trang: tạo scramble nếu chưa có (đồng hồ đang chạy thì giữ nguyên).
  useEffect(() => {
    const s = timerStore.get();
    if (!s.running && (!s.scramble || s.loading)) void generate();
  }, [generate]);

  const hint = running
    ? 'ĐANG CHẠY · SPACE HOẶC CHẠM ĐỂ DỪNG'
    : pending
      ? 'ĐÃ DỪNG · LƯU KẾT QUẢ ĐỂ TIẾP TỤC'
      : 'Nhấn Space hoặc chạm để bắt đầu';

  const confirmClear = () =>
    modal.open(
      <>
        <h2>Xóa {history.length} lần giải?</h2>
        <p>Bạn có thể xuất CSV trước để giữ bản sao. Việc xóa không thể hoàn tác.</p>
        <button
          className="button primary"
          id="confirm-clear"
          onClick={() => {
            clearHistory();
            modal.close();
          }}
        >
          Xóa toàn bộ lịch sử
        </button>
      </>,
    );

  return (
    <section className="page-shell timer-page">
      <div className="page-heading">
        <div>
          <small>PRACTICE CLUB / 3×3</small>
          <h1>
            Thêm một lần.
            <br />
            <em>Thêm một tiến bộ.</em>
          </h1>
        </div>
        <p>
          Scramble random-state từ cubing.js.
          <br />
          Kết quả chỉ lưu trên trình duyệt này.
        </p>
      </div>

      <section className="timer-workspace">
        <div className="scramble-top">
          <span className="chip">3×3 · RANDOM STATE</span>
          <button
            id="new-scramble"
            className="small-button"
            disabled={running || !!pending || loading}
            onClick={() => void generate()}
          >
            Scramble mới ↻
          </button>
        </div>
        <p className="scramble-text" id="scramble" aria-live="polite">
          {loading ? 'Đang tạo scramble…' : scramble || 'Chưa tải được scramble. Bấm “Scramble mới” để thử lại.'}
        </p>
        <button
          className={`timer-display${running ? ' running' : ''}`}
          id="timer-toggle"
          aria-label="Bắt đầu hoặc dừng đồng hồ"
          disabled={!canToggle(state)}
          onClick={toggle}
        >
          <TimerClock running={running} startedAt={startedAt} stoppedMs={pending?.ms ?? 0} />
          <span id="timer-hint">{hint}</span>
        </button>
        <div className="timer-actions">
          <button id="save-solve" className="button primary" disabled={!pending} onClick={save}>
            Lưu kết quả ↗
          </button>
          <button id="discard-solve" className="button secondary" hidden={!pending} onClick={discard}>
            Bỏ kết quả
          </button>
          <span className="timer-state" role="status">
            {pending ? 'Kết quả chưa lưu.' : running ? 'Đồng hồ đang chạy.' : ''}
          </span>
        </div>
      </section>

      <div className="stats-grid">
        {STAT_LABELS.map(([id, name]) => (
          <div key={id}>
            <small>{name}</small>
            <strong id={`stat-${id}`}>{formatTime(stats[id])}</strong>
          </div>
        ))}
      </div>
      <p className="muted stats-note">
        Ao5 / Ao12 lấy 5 / 12 lần gần nhất, bỏ một nhanh nhất và một chậm nhất. Một DNF có thể được bỏ; hai DNF khiến
        trung bình là DNF. +2 được cộng trước khi tính.
      </p>

      <div className="section-heading">
        <div>
          <small>NHỮNG VÒNG XOAY ĐÃ QUA</small>
          <h2>Lịch sử của bạn.</h2>
        </div>
        <div className="actions">
          <button
            id="export-history"
            className="small-button"
            disabled={!history.length}
            onClick={() => downloadText(historyCsv(history), 'sobik99-solves.csv', 'text/csv;charset=utf-8')}
          >
            Xuất CSV ↓
          </button>
          <button id="clear-history" className="small-button" disabled={!history.length} onClick={confirmClear}>
            Xóa lịch sử
          </button>
        </div>
      </div>
      <div id="history-content">
        <HistoryTable history={history} onPenalty={setPenalty} onDelete={deleteSolve} />
      </div>
    </section>
  );
}
