import { useRef, useState, type KeyboardEvent } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import { formatTime } from '../../shared/lib/stats';
import { write } from '../../shared/lib/storage';
import { TimerClock } from '../timer/TimerClock';
import { CameraControls } from './CameraControls';
import { CubeCenterLegend } from './CubeCenterLegend';
import { ShortcutSettings } from './ShortcutSettings';
import { SolveHistory } from './SolveHistory';
import { formatMoveNotation, isCubeMove, type CubeMove, loadShortcuts, parseMoveList, SHORTCUTS_KEY, shortcutFromEvent } from './shortcuts';
import { useCubeSession } from './useCubeSession';
import { useHandCamera } from './useHandCamera';
import { useSolveHistory } from './useSolveHistory';
import { useWorkspaceFullscreen } from './useWorkspaceFullscreen';
import './simulator.css';

const ARROW_TURNS: Partial<Record<string, CubeMove>> = {
  ArrowLeft: 'y', ArrowRight: "y'", ArrowUp: 'x', ArrowDown: "x'",
};

export default function SimulatorPage() {
  const workspace = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fullscreen = useWorkspaceFullscreen(workspace, stage);
  const history = useSolveHistory();
  const simulation = useCubeSession(stage, (solve) => {
    history.save(solve);
    fullscreen.exit();
  });
  const { game, status, scrambleStatus, scramble, startedAt, moves, view, centers, result } = simulation;
  const camera = useHandCamera(stage, game, (move) => simulation.enqueue([move], 'camera'));
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const [formula, setFormula] = useState('');
  const [formulaError, setFormulaError] = useState(false);

  const clock = (scramble.length > 0 || fullscreen.active) && (
    <div className="simulator-clock" aria-label={t('Thời gian giải', 'Solve time')}>
      {startedAt !== null && !result
        ? <TimerClock running startedAt={startedAt} stoppedMs={0} />
        : <strong>{formatTime(result?.durationMs ?? 0)}</strong>}
    </div>
  );

  function onStageKey(event: KeyboardEvent<HTMLDivElement>) {
    const runtime = game.current;
    const native = event.nativeEvent;
    if (!runtime || event.target !== event.currentTarget || event.defaultPrevented ||
        native.ctrlKey || native.altKey || native.metaKey || native.isComposing) return;

    const rotation = ARROW_TURNS[native.key];
    if (rotation && !native.shiftKey) {
      event.preventDefault();
      if (!native.repeat) simulation.enqueue([rotation], 'keyboard');
      return;
    }

    const key = shortcutFromEvent(native);
    if (!key) return;
    const match = Object.entries(shortcuts).find(([, binding]) => binding === key);
    if (!match || !isCubeMove(match[0])) return;
    event.preventDefault();
    if (!native.repeat) simulation.enqueue([match[0]], 'keyboard');
  }

  return <div className="page-shell simulator-page">
    <h1 hidden={fullscreen.active}>{t('Rubik 3D', '3D Cube')}</h1>
    <div className="simulator-layout" ref={workspace}
      data-fullscreen={fullscreen.mode ?? undefined} onKeyDown={fullscreen.onKeyDown}
      role={fullscreen.mode === 'expanded' ? 'dialog' : undefined}
      aria-modal={fullscreen.mode === 'expanded' ? true : undefined}
      aria-label={fullscreen.active ? t('Không gian xoay Rubik', 'Cube workspace') : undefined}>
      <section aria-label={t('Mô phỏng Rubik', 'Cube simulator')}>
        <div className="simulator-round" hidden={fullscreen.active}>
          <div className="simulator-round-bar">
            <div className="actions">
              <button className="button primary" type="button" onClick={() => void simulation.newScramble()}
                disabled={status !== 'ready' || scrambleStatus === 'loading'}>
                {scrambleStatus === 'loading' ? t('Đang tạo…', 'Generating…') : t('Tạo scramble', 'Generate scramble')}
              </button>
              <button className="small-button" type="button" disabled={status !== 'ready'} onClick={() => {
                simulation.cancelGesture();
                game.current?.scene.resetView();
                stage.current?.focus({ preventScroll: true });
              }}>
                {t('Nhìn từ mặt trước', 'Front view')}
              </button>
              <button className="small-button" type="button" ref={fullscreen.button}
                aria-pressed={fullscreen.active} onClick={() => void fullscreen.toggle()}>
                {fullscreen.active ? t('Thoát toàn màn hình', 'Exit fullscreen') : t('Toàn màn hình', 'Fullscreen')}
              </button>
            </div>
            {!fullscreen.active && clock}
          </div>
          {scrambleStatus === 'error' && <p role="alert">{t('Không tạo được scramble. Hãy thử lại.', 'Could not generate a scramble. Try again.')}</p>}
          {scramble.length > 0 && <div className="simulator-code simulator-scramble">
            <span>{t('Scramble theo góc chuẩn', 'Standard-view scramble')}</span>
            <code aria-label="Scramble">{formatMoveNotation(scramble.join(' '))}</code>
          </div>}
          {result && <p className="simulator-completed" role="status">
            {t('Đã giải xong', 'Solved')} · {result.turns.length} {t('nước', 'moves')} · {formatTime(result.durationMs)}
          </p>}
        </div>
        <p id="simulator-stage-help" hidden={fullscreen.active}>{t(
          'Bấm hoặc Tab vào khối để dùng phím xoay. Kéo để đổi góc nhìn. Dùng phím mũi tên để xoay cả khối.',
          'Click or Tab to the cube to use turn keys. Drag to orbit. Use the arrow keys to rotate the entire cube.',
        )}</p>
        <div className="simulator-board">
          <div className="simulator-board-reference">
            <CubeCenterLegend view={view} centers={centers} />
            {fullscreen.active && <button className="simulator-exit" type="button"
              aria-label={t('Thoát toàn màn hình', 'Exit fullscreen')} onClick={fullscreen.exit}>×</button>}
          </div>
          <div ref={stage} className="simulator-stage" role="group" tabIndex={0}
            aria-label={t('Khối Rubik 3D', '3D Rubik’s Cube')} aria-describedby="simulator-stage-help"
            onPointerDown={() => {
              simulation.cancelGesture();
              stage.current?.focus({ preventScroll: true });
            }}
            onPointerMove={(event) => { if (event.buttons & 1) simulation.cancelGesture(); }}
            onWheel={simulation.cancelGesture}
            onKeyDown={onStageKey}
          >
            {fullscreen.active && <div className="simulator-fullscreen-clock">{clock}</div>}
            <span className="simulator-hand-cursor" ref={camera.cursor} hidden aria-hidden="true" />
            {!fullscreen.active && camera.feedback.preview && <span className="simulator-turn-preview" aria-hidden="true">{camera.feedback.preview}</span>}
          </div>
        </div>
        {!fullscreen.active && status === 'loading' && <p role="status">{t('Đang tải khối 3D…', 'Loading the 3D cube…')}</p>}
        {!fullscreen.active && status === 'error' && <p role="alert">{t('Không thể hiển thị khối Rubik 3D.', 'Could not display the 3D cube.')}</p>}
        <form className="simulator-formula" hidden={fullscreen.active} onSubmit={(event) => {
          event.preventDefault();
          const turns = parseMoveList(formula);
          if (!turns) {
            setFormulaError(true);
            return;
          }
          if (!simulation.enqueue(turns, 'formula')) return;
          setFormula('');
          setFormulaError(false);
        }}>
          <label>{t('Công thức', 'Algorithm')}
            <input value={formula} placeholder="R U R' U' wR y wU2" spellCheck={false}
              autoComplete="off" autoCapitalize="off" aria-invalid={formulaError || undefined}
              onChange={(event) => { setFormula(event.currentTarget.value); setFormulaError(false); }}
            />
          </label>
          <p className="simulator-formula-hint">{t(
            'Phím và công thức dùng góc nhìn hiện tại. Khi nằm giữa hai mặt, mặt bên phải là F.',
            'Keys and algorithms use the current view. Between two faces, the one on the right becomes F.',
          )}</p>
          <div className="actions">
            <button className="small-button primary" disabled={status !== 'ready' || scrambleStatus === 'loading' || !formula.trim()}>
              {t('Chạy công thức', 'Apply algorithm')}
            </button>
            <button className="small-button" type="button" disabled={status !== 'ready'} onClick={simulation.reset}>
              {t('Đặt lại khối', 'Reset cube')}
            </button>
          </div>
          {formulaError && <p role="alert">{t('Nhập các nước hợp lệ, cách nhau bằng dấu cách.', 'Enter valid moves separated by spaces.')}</p>}
        </form>
        {moves.length > 0 && <details className="simulator-history" hidden={fullscreen.active}>
          <summary>{t('Các nước đã xoay theo góc chuẩn', 'Applied moves in standard notation')} · {moves.length}</summary>
          <code>{formatMoveNotation(moves.join(' '))}</code>
        </details>}
      </section>
      <aside className="simulator-inputs" hidden={fullscreen.active}>
        <CameraControls camera={camera} disabled={status !== 'ready'} />
        <section aria-labelledby="simulator-keyboard-heading">
          <h2 id="simulator-keyboard-heading">{t('Bàn phím', 'Keyboard')}</h2>
          <dl className="simulator-current">
            {Object.entries(shortcuts).map(([move, key]) => <div key={move}><dt><kbd>{key}</kbd></dt><dd><code>{formatMoveNotation(move)}</code></dd></div>)}
          </dl>
          <ShortcutSettings initial={shortcuts} onSave={(next) => {
            setShortcuts(next);
            return write(SHORTCUTS_KEY, next);
          }} />
        </section>
      </aside>
    </div>
    {!fullscreen.active && <SolveHistory entries={history.history} loadStatus={history.loadStatus} onRetry={history.save} onReview={camera.stop} />}
  </div>;
}
