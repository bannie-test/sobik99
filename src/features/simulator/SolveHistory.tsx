import { useMemo, useState } from 'react';
import { locale, t } from '../../cube-tools/utils/i18n.js';
import { formatTime } from '../../shared/lib/stats';
import { useModal } from '../../shared/ui/Modal';
import { AlgorithmPlayer } from '../guide/AlgorithmPlayer';
import { analyzeSolve, cfopMilestones } from './solveAnalysis';
import { formatMoveNotation } from './shortcuts';
import type { CompletedSolve, TurnSource } from './solveHistory';
import type { SolveHistoryEntry } from './useSolveHistory';

const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });
const INPUT_NAME: Record<TurnSource, string> = {
  camera: t('Cử chỉ tay', 'Hand gesture'),
  keyboard: t('Bàn phím', 'Keyboard'),
  formula: t('Ô công thức', 'Algorithm field'),
};

function SolveReport({ solve }: { solve: CompletedSolve }) {
  const [cfop, setCfop] = useState(false);
  const { algorithm, shortened, reductions, pauses, savedMoves } = useMemo(() => analyzeSolve(solve), [solve]);
  const timings = useMemo(() => solve.turns.map((turn) => turn.atMs), [solve]);
  const milestones = useMemo(() => cfop ? cfopMilestones(solve) : null, [cfop, solve]);
  return <div className="simulator-report">
    <AlgorithmPlayer
      title={t('Phát lại phiên giải', 'Solve replay')}
      setup={formatMoveNotation(solve.scramble.join(' '))}
      alg={algorithm}
      turnTimes={timings}
      formatNotation={formatMoveNotation}
    />
    <dl className="simulator-report-summary">
      <div><dt>Scramble</dt><dd><code>{formatMoveNotation(solve.scramble.join(' '))}</code></dd></div>
      <div><dt>{t('Thời gian', 'Time')}</dt><dd>{formatTime(solve.durationMs)} · {solve.turns.length} {t('nước', 'moves')}</dd></div>
    </dl>
    <h3>{t('Nhận xét', 'Review')}</h3>
    {savedMoves > 0 ? <>
      <p>{t(
        `Có thể bớt ${savedMoves} thao tác bằng cách gộp hoặc bỏ các nước xoay cùng tầng liên tiếp.`,
        `Merge or cancel consecutive turns of the same layer to save ${savedMoves} moves.`,
      )}</p>
      <code className="simulator-code">{formatMoveNotation(shortened) || t('Chuỗi rút gọn rỗng', 'Empty shortened sequence')}</code>
      <ul>
        {reductions.slice(0, 3).map(({ first, last, before, after }) =>
          <li key={first}>{t('Bước', 'Steps')} {first}–{last} · <code>{formatMoveNotation(before)}</code> → {after
            ? <code>{formatMoveNotation(after)}</code>
            : t('bỏ cả đoạn', 'remove the sequence')}</li>)}
      </ul>
    </> : <p>{t('Các nước cùng tầng liên tiếp đã gọn.', 'Consecutive turns of the same layer are already streamlined.')}</p>}
    {pauses.length > 0 && <>
      <p>{t('Thử nhìn trước nước tiếp theo ở các đoạn có khoảng dừng dài nhất.', 'Try spotting the next move during the longest gaps.')}</p>
      <ul>
        {pauses.slice(0, 3).map(({ before, move, gap }) => <li key={before}>
          {t('Trước bước', 'Before step')} {before} (<code>{formatMoveNotation(move)}</code>) · {formatTime(gap)}
        </li>)}
      </ul>
    </>}
    <label className="simulator-cfop-toggle">
      <input type="checkbox" checked={cfop} onChange={(event) => setCfop(event.currentTarget.checked)} />
      {t('Hiện các mốc CFOP với Cross trắng', 'Show CFOP milestones for a white cross')}
    </label>
    {milestones && <ul className="simulator-milestones">
      {milestones.map(({ phase, step, atMs }) => <li key={phase}>
        <strong>{phase}</strong>
        <span>{step ? `${t('Bước', 'Step')} ${step} · ${formatTime(atMs)}` : t('Có sẵn trong scramble', 'Already in scramble')}</span>
      </li>)}
    </ul>}
    <details className="simulator-history">
      <summary>{t('Thời điểm và nguồn từng nước', 'Move timestamps and sources')}</summary>
      {solve.turns.some(({ source }) => source === 'formula') && <p>
        {t('Các nước gửi cùng một công thức có chung thời điểm nhập.', 'Moves submitted in the same algorithm share an input timestamp.')}
      </p>}
      {solve.turns.some(({ viewMove }) => viewMove !== undefined) && <p>
        {t('Trước mũi tên là nước theo góc nhìn lúc xoay. Sau mũi tên là nước theo góc chuẩn dùng để phát lại.', 'The arrow connects the turn in your view to its standard-view notation for replay.')}
      </p>}
      <table>
        <thead><tr>
          <th scope="col">{t('Bước', 'Step')}</th>
          <th scope="col">{t('Nước xoay', 'Move')}</th>
          <th scope="col">{t('Thời điểm', 'Time')}</th>
          <th scope="col">{t('Nguồn', 'Input')}</th>
        </tr></thead>
        <tbody>{solve.turns.map((turn, index) => <tr key={index}>
          <td>{index + 1}</td><td><code>{turn.viewMove ? `${formatMoveNotation(turn.viewMove)} → ${formatMoveNotation(turn.move)}` : formatMoveNotation(turn.move)}</code></td><td>{formatTime(turn.atMs)}</td>
          <td>{INPUT_NAME[turn.source]}</td>
        </tr>)}</tbody>
      </table>
    </details>
  </div>;
}

export function SolveHistory({ entries, loadStatus, onRetry, onReview }: {
  entries: SolveHistoryEntry[];
  loadStatus: 'loading' | 'ready' | 'failed';
  onRetry: (solve: CompletedSolve) => void;
  onReview: () => void;
}) {
  const modal = useModal();
  return <section className="simulator-saved-solves" aria-labelledby="simulator-history-heading">
    <h2 id="simulator-history-heading">{t('Lịch sử giải', 'Solve history')}</h2>
    {loadStatus === 'failed' && <p role="status">{t('Không thể mở lịch sử trên trình duyệt này.', 'Could not open local solve history.')}</p>}
    {entries.length === 0 && loadStatus === 'ready' && <p>
      {t('Tạo scramble rồi giải khối để lưu phiên đầu tiên.', 'Generate a scramble and solve the cube to save your first session.')}
    </p>}
    {entries.length > 0 && <ul className="simulator-solves">
      {entries.map(({ solve, status }) => <li key={solve.id}>
        <div className="simulator-solve-main">
          <strong>{formatTime(solve.durationMs)}</strong>
          <time dateTime={solve.finishedAt}>{dateFormat.format(new Date(solve.finishedAt))}</time>
          <span>{solve.turns.length} {t('nước', 'moves')}</span>
          <code>{formatMoveNotation(solve.scramble.join(' '))}</code>
        </div>
        <div className="actions">
          <button className="small-button" type="button" onClick={() => {
            onReview();
            modal.open(<SolveReport solve={solve} />);
          }}>{t('Phát lại và nhận xét', 'Replay and review')}</button>
          {status === 'saving' && <span role="status">{t('Đang lưu…', 'Saving…')}</span>}
          {status === 'failed' && <>
            <span role="status">{t('Chưa lưu được', 'Could not save')}</span>
            <button className="small-button" type="button" onClick={() => onRetry(solve)}>{t('Lưu lại', 'Retry save')}</button>
          </>}
        </div>
      </li>)}
    </ul>}
  </section>;
}
