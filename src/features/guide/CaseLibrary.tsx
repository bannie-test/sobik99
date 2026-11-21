import { useMemo, useState } from 'react';
import { cases } from '../../data/algorithms';
import type { CasePhase } from '../../data/types';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { useStore } from '../../shared/store/createStore';
import { useToast } from '../../shared/ui/Toast';
import { CaseCard } from './CaseCard';
import { CrossWorkshop } from './CrossWorkshop';
import { filterCases, groupsOf, paginate } from './filterCases';
import { learnedStore, toggleLearned } from './learnedStore';

type Phase = 'cross' | CasePhase;

const PHASES: [Phase, string][] = [
  ['cross', 'Cross'],
  ['f2l', 'F2L · 41'],
  ['oll', 'OLL · 57'],
  ['pll', 'PLL · 21'],
];

/** Thư viện CFOP 3×3: tab giai đoạn, tìm kiếm, lọc nhóm, đánh dấu đã học, phân trang 12 case. */
export function CaseLibrary() {
  const toast = useToast();
  const learned = useStore(learnedStore);
  const [phase, setPhase] = useState<Phase>('cross');
  const [term, setTerm] = useState('');
  const [group, setGroup] = useState('');
  const [onlyUnlearned, setOnlyUnlearned] = useState(false);
  const [requestedPage, setPage] = useState(0);

  const choosePhase = (next: Phase) => {
    setPhase(next);
    setPage(0);
    setGroup('');
    setTerm('');
  };
  const onFilter =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(0);
    };
  const onToggleLearned = (id: string) => {
    if (!toggleLearned(id)) toast('Không lưu được tiến độ vào trình duyệt.');
  };

  const isCross = phase === 'cross';
  const groups = useMemo(() => (isCross ? [] : groupsOf(cases, phase)), [isCross, phase]);
  const filtered = useMemo(
    () => (isCross ? [] : filterCases(cases, learned, { phase, term, group, onlyUnlearned })),
    [isCross, phase, term, group, onlyUnlearned, learned],
  );
  const { total, page, items } = paginate(filtered, requestedPage);
  const learnedInPhase = cases.filter((c) => c.type === phase && learned.includes(c.id)).length;

  return (
    <section className="algorithm-library">
      <div className="section-heading">
        <div>
          <small>CFOP / THƯ VIỆN THẾ GIẢI</small>
          <h2>Nhìn thế. Chọn cách.</h2>
        </div>
        <span className="chip">119 CASE</span>
      </div>
      <div className="phase-tabs" role="group" aria-label="Giai đoạn CFOP">
        {PHASES.map(([id, label]) => (
          <button key={id} aria-pressed={id === phase} onClick={() => choosePhase(id)}>
            {label}
          </button>
        ))}
      </div>
      <div id="case-tools" hidden={isCross}>
        <label>
          Tìm case
          <input
            id="case-search"
            placeholder="Sune, OLL 27, nhóm hình…"
            type="search"
            value={term}
            onChange={(e) => onFilter(setTerm)(e.target.value)}
          />
        </label>
        <label>
          Nhóm
          <select id="case-group" value={group} onChange={(e) => onFilter(setGroup)(e.target.value)}>
            <option value="">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            id="unlearned"
            checked={onlyUnlearned}
            onChange={(e) => onFilter(setOnlyUnlearned)(e.target.checked)}
          />{' '}
          Chưa đánh dấu đã học
        </label>
      </div>
      <p className="case-count" aria-live="polite">
        {isCross
          ? 'Cross là bài toán lập kế hoạch, không phải danh sách công thức cố định.'
          : `${filtered.length} case · ${learnedInPhase} đã đánh dấu học`}
      </p>
      {isCross ? (
        <CrossWorkshop />
      ) : (
        <div id="case-grid" className="case-grid">
          {items.length ? (
            items.map((c) => (
              <CaseCard key={c.id} item={c} learned={learned.includes(c.id)} onToggleLearned={onToggleLearned} />
            ))
          ) : (
            <p className="empty-state">Không có case phù hợp. Thử xóa tìm kiếm hoặc thay nhóm.</p>
          )}
        </div>
      )}
      <div id="case-pagination">
        {!isCross && total > 1 && (
          <>
            <button className="button secondary" id="case-prev" disabled={page === 0} onClick={() => setPage(page - 1)}>
              ← Trước
            </button>
            <span>
              Trang {page + 1} / {total}
            </span>
            <button
              className="button secondary"
              id="case-next"
              disabled={page === total - 1}
              onClick={() => setPage(page + 1)}
            >
              Tiếp →
            </button>
          </>
        )}
      </div>
      <p className="muted">
        Ảnh và mô hình dùng mặt trắng ở U, xanh lá ở F trong trạng thái gốc. Mỗi lựa chọn có hình thiết lập riêng. “Đổi
        hướng cầm y” là biến thể xoay hướng cầm của cùng case, không phải công thức mới nhanh hơn.
      </p>
      <ExternalLink className="source-link" href="https://github.com/lukejacksonn/cube">
        Nguồn case: Cube Coach (MIT) · Minh họa sinh từ trạng thái cubing.js ↗
      </ExternalLink>
    </section>
  );
}
