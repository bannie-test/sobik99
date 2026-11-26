import { useEffect, useRef, useState } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import { downloadText } from '../../shared/lib/csv';
import { formatTime, statistics } from '../../shared/lib/stats';
import { useModal } from '../../shared/ui/Modal';
import { historyCsv } from './exportCsv';
import { HistoryTable } from './HistoryTable';
import { TimerClock } from './TimerClock';
import { canToggle, timerStore } from './timerStore';
import { useTimer } from './useTimer';

const STAT_LABELS = [
  ['best', t('Nhanh nhất', 'Best')],
  ['worst', t('Chậm nhất', 'Worst')],
  ['ao5', 'Ao5'],
  ['ao12', 'Ao12'],
] as const;

/** Phím Space không kích hoạt timer khi đang gõ hoặc focus vào control khác. */
const HOLD_MS = 350;
const isInteractive = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest('input,textarea,select,button:not(#timer-toggle),a,summary,[contenteditable]:not([contenteditable="false"])'));

export default function TimerPage() {
  const modal = useModal();
  const { state, generate, toggle, save, discard, setPenalty, deleteSolve, clearHistory } = useTimer();
  const { history, scramble, running, startedAt, pending, loading } = state;
  const stats = statistics(history);

  const [hold, setHold] = useState<'idle' | 'holding' | 'ready'>('idle');
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let captured = false;
    let started: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
      captured = false;
      started = undefined;
      clearTimeout(timeout);
      setHold('idle');
    };

    window.addEventListener('keydown', (event) => {
      if (event.code !== 'Space') return;
      if (captured) {
        event.preventDefault();
        return;
      }
      if (event.repeat || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
          modal.isOpen() || isInteractive(event.target)) return;
      const current = timerStore.get();
      if (!canToggle(current)) return;
      event.preventDefault();
      captured = true;
      if (current.running) {
        toggleRef.current(event.timeStamp);
        return;
      }
      started = event.timeStamp;
      setHold('holding');
      timeout = setTimeout(() => setHold('ready'), HOLD_MS);
    }, { signal });
    window.addEventListener('keyup', (event) => {
      if (event.code !== 'Space' || !captured) return;
      event.preventDefault();
      const current = timerStore.get();
      const ready = started !== undefined && event.timeStamp - started >= HOLD_MS;
      reset();
      if (ready && !modal.isOpen() && !current.running && canToggle(current)) toggleRef.current(event.timeStamp);
    }, { signal });
    window.addEventListener('blur', reset, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); }, { signal });
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [modal]);

  useEffect(() => {
    const current = timerStore.get();
    if (!current.running && (!current.scramble || current.loading)) void generate();
  }, [generate]);

  const hint = running
    ? t('ĐANG CHẠY · SPACE HOẶC CHẠM ĐỂ DỪNG', 'RUNNING · SPACE OR TAP TO STOP')
    : pending
      ? t('Lưu hoặc bỏ kết quả để giải tiếp', 'Save or discard the result to continue')
      : hold === 'ready'
        ? t('Sẵn sàng · Nhả Space để bắt đầu', 'Ready · Release Space to start')
        : hold === 'holding'
          ? t('Tiếp tục giữ Space…', 'Keep holding Space…')
          : t('Giữ Space rồi nhả hoặc chạm để bắt đầu', 'Hold and release Space or tap to start');

  const confirmClear = () =>
    modal.open(
      <>
        <h2>{t(`Xóa ${history.length} lần giải?`, `Delete ${history.length} solves?`)}</h2>
        <p>{t('Bạn có thể xuất CSV trước để giữ bản sao. Việc xóa không thể hoàn tác.', 'Export a CSV first to keep a copy. Deleting your history is permanent.')}</p>
        <button
          className="button primary"
          id="confirm-clear"
          onClick={() => {
            clearHistory();
            modal.close();
          }}
        >
          {t('Xóa toàn bộ lịch sử', 'Clear all history')}
        </button>
      </>,
    );

  return (
    <section className="timer-page" aria-labelledby="practice-title">
      <header className="practice-bar">
        <a href="#/">{t('← Trang chủ', '← Home')}</a>
        <h1 id="practice-title">{t('Luyện tập 3×3', '3×3 Practice')}</h1>
        <button id="new-scramble" className="small-button" disabled={running || !!pending || loading}
          onClick={() => void generate()}>{t('Scramble mới ↻', 'New scramble ↻')}</button>
      </header>
      <section className="timer-workspace">
        <p className="scramble-text" id="scramble" aria-live="polite">
          {loading ? t('Đang tạo scramble…', 'Generating scramble…') : scramble || t('Chưa tải được scramble. Bấm “Scramble mới” để thử lại.', 'Could not load a scramble. Try generating a new one.')}
        </p>
        <button
          className="timer-display"
          data-state={running ? 'running' : pending ? 'stopped' : hold}
          id="timer-toggle"
          aria-label={t('Bắt đầu hoặc dừng đồng hồ', 'Start or stop the timer')}
          aria-describedby="timer-hint"
          disabled={!canToggle(state)}
          onClick={(event) => toggle(event.timeStamp)}
        >
          <TimerClock running={running} startedAt={startedAt} stoppedMs={pending?.ms ?? 0} />
        </button>
        <p id="timer-hint" role="status">{hint}</p>
        <div className="timer-actions" hidden={!pending}>
          <button id="save-solve" className="button primary" disabled={!pending} onClick={save}>
            {t('Lưu kết quả ↗', 'Save result ↗')}
          </button>
          <button id="discard-solve" className="button secondary" hidden={!pending} onClick={discard}>
            {t('Bỏ kết quả', 'Discard result')}
          </button>
          <span className="timer-state" role="status">
            {pending ? t('Kết quả chưa lưu.', 'Unsaved result.') : running ? t('Đồng hồ đang chạy.', 'Timer running.') : ''}
          </span>
        </div>
      </section>

      <details className="practice-history" inert={running}>
      <summary>{t('Lịch sử và thống kê', 'History and statistics')}</summary>
      <div className="stats-grid">
        {STAT_LABELS.map(([id, name]) => (
          <div key={id}>
            <small>{name}</small>
            <strong id={`stat-${id}`}>{formatTime(stats[id])}</strong>
          </div>
        ))}
      </div>
      <p className="muted stats-note">
        {t('Ao5 / Ao12 bỏ lần nhanh nhất và chậm nhất trong 5 / 12 lần gần nhất. Hai DNF khiến trung bình là DNF. +2 được cộng trước khi tính.', 'Ao5 / Ao12 drop the fastest and slowest of the last 5 / 12 solves. Two DNFs make the average a DNF. Penalties are applied before averaging.')}
      </p>

      <div className="section-heading">
        <div>
          <small>{t('NHỮNG VÒNG XOAY ĐÃ QUA', 'PAST SOLVES')}</small>
          <h2>{t('Lịch sử của bạn.', 'Your history')}</h2>
        </div>
        <div className="actions">
          <button
            id="export-history"
            className="small-button"
            disabled={!history.length}
            onClick={() => downloadText(historyCsv(history), 'sobik99-solves.csv', 'text/csv;charset=utf-8')}
          >
            {t('Xuất CSV ↓', 'Export CSV ↓')}
          </button>
          <button id="clear-history" className="small-button" disabled={!history.length} onClick={confirmClear}>
            {t('Xóa lịch sử', 'Clear history')}
          </button>
        </div>
      </div>
      <div id="history-content">
        <HistoryTable history={history} onPenalty={setPenalty} onDelete={deleteSolve} />
      </div>
      </details>
    </section>
  );
}
