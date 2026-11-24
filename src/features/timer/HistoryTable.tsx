import { locale, t } from '../../cube-tools/utils/i18n.js';
import { effective, formatTime, PENALTIES, type Penalty, type Solve } from '../../shared/lib/stats';
import { useModal } from '../../shared/ui/Modal';

const VISIBLE_LIMIT = 100;
const SCRAMBLE_PREVIEW = 25;

interface Props {
  history: Solve[];
  onPenalty: (id: string, penalty: Penalty) => void;
  onDelete: (id: string) => void;
}

function ConfirmDelete({ solve, onConfirm }: { solve: Solve; onConfirm: () => void }) {
  return (
    <>
      <h2>{t('Xóa lần giải', 'Delete solve')} {formatTime(effective(solve))}?</h2>
      <p>{t('Thao tác này sẽ cập nhật lại thống kê.', 'Your statistics will update.')}</p>
      <button id="confirm-delete" className="button primary" onClick={onConfirm}>
        {t('Xóa lần giải', 'Delete solve')}
      </button>
    </>
  );
}

/** Bảng 100 lần giải gần nhất (mới nhất ở trên). */
export function HistoryTable({ history, onPenalty, onDelete }: Props) {
  const modal = useModal();

  if (!history.length) {
    return (
      <div className="empty-state">
        <div className="empty-glyph">✳</div>
        <h3>{t('Chưa có lần giải nào. Và đó là khởi đầu tốt.', 'No solves recorded yet.')}</h3>
        <p>{t('Tạo scramble, giải khối Rubik, rồi lưu kết quả đầu tiên.', 'Generate a scramble and save your first result.')}</p>
      </div>
    );
  }

  const confirmDelete = (solve: Solve) =>
    modal.open(
      <ConfirmDelete
        solve={solve}
        onConfirm={() => {
          onDelete(solve.id);
          modal.close();
        }}
      />,
    );

  const rows = history.slice(-VISIBLE_LIMIT).reverse();
  return (
    <>
      <p className="muted">{history.length} {t('lần đã lưu · hiển thị tối đa 100 lần gần nhất', 'solves saved · showing the latest 100')}</p>
      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('Thời gian', 'Time')}</th>
              <th>{t('Điều chỉnh', 'Penalty')}</th>
              <th>{t('Scramble / thời điểm', 'Scramble / date')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const n = history.length - i;
              return (
                <tr key={s.id}>
                  <td>{n}</td>
                  <td>
                    <strong>{formatTime(effective(s))}</strong>
                    {s.penalty === 'DNF' && <small>{t('Gốc', 'Original')} {formatTime(s.ms)}</small>}
                  </td>
                  <td>
                    <select
                      value={s.penalty}
                      aria-label={`${t('Điều chỉnh lần', 'Adjust solve')} ${n}`}
                      onChange={(e) => onPenalty(s.id, e.target.value as Penalty)}
                    >
                      {PENALTIES.map((p) => (
                        <option key={p} value={p}>
                          {p === 'none' ? 'OK' : p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <details>
                      <summary>{s.scramble.slice(0, SCRAMBLE_PREVIEW)}…</summary>
                      <code>{s.scramble}</code>
                    </details>
                    <small>{new Date(s.date).toLocaleString(locale)}</small>
                  </td>
                  <td>
                    <button className="text-button" aria-label={`${t('Xóa lần', 'Delete solve')} ${n}`} onClick={() => confirmDelete(s)}>
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
