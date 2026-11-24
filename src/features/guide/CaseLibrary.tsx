import { useEffect, useMemo, useState } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import { usePlayCase } from './AlgorithmPlayer';
import { IntuitiveF2L } from './IntuitiveF2L';
import { cases } from '../../data/algorithms';
import type { CasePhase } from '../../data/types';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { useStore } from '../../shared/store/createStore';
import { useToast } from '../../shared/ui/Toast';
import { CaseCard } from './CaseCard';
import { CrossWorkshop } from './CrossWorkshop';
import { CASES_PER_PAGE, filterCases, groupsOf, paginate } from './filterCases';
import { learnedStore, toggleLearned } from './learnedStore';

type Phase = 'cross' | CasePhase;

const PHASES: [Phase, string][] = [
  ['cross', 'Cross'],
  ['f2l', 'F2L · 41'],
  ['oll', 'OLL · 57'],
  ['pll', 'PLL · 21'],
];

/** Thư viện CFOP 3×3: tab giai đoạn, tìm kiếm, lọc nhóm, đánh dấu đã học, phân trang 12 case. */
export function CaseLibrary({ query, compact }: { query: URLSearchParams; compact: boolean }) {
  const target = cases.find((item) => item.id === query.get('case'));
  const requestedPhase = PHASES.find(([id]) => id === query.get('phase'))?.[0];
  const playCase = usePlayCase();
  const toast = useToast();
  const learned = useStore(learnedStore);
  const [phase, setPhase] = useState<Phase>(target?.type ?? requestedPhase ?? 'f2l');
  const [term, setTerm] = useState('');
  const [group, setGroup] = useState('');
  const [onlyUnlearned, setOnlyUnlearned] = useState(false);
  const [view, setView] = useState<'algorithms' | 'intuitive'>('algorithms');
  const [requestedPage, setPage] = useState(() => target ? Math.floor(cases.filter((item) => item.type === target.type).indexOf(target) / CASES_PER_PAGE) : 0);
  const intuitive = phase === 'f2l' && view === 'intuitive';

  useEffect(() => {
    if (!target) return;
    const card = document.getElementById(`case-${target.id}`);
    card?.classList.add('focused');
    const frame = requestAnimationFrame(() => card?.scrollIntoView?.({ block: 'center' }));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const choosePhase = (next: Phase) => {
    setPhase(next);
    setView('algorithms');
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
    if (!toggleLearned(id)) toast(t('Không lưu được tiến độ vào trình duyệt.', 'Could not save your progress.'));
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
          <small>{t('CFOP / THƯ VIỆN THẾ GIẢI', 'CFOP ALGORITHM LIBRARY')}</small>
          <h2>{t('Nhìn thế. Chọn cách.', 'Recognize the case. Choose an algorithm.')}</h2>
        </div>
        <span className="chip">119 CASE</span>
      </div>
      <div className="phase-tabs" role="group" aria-label={t('Giai đoạn CFOP', 'CFOP stages')}>
        {PHASES.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={id === phase} onClick={() => choosePhase(id)}>
            {label}
          </button>
        ))}
      </div>
      {phase === 'f2l' && <div className="f2l-tabs" role="tablist" aria-label="F2L">
        {(['algorithms', 'intuitive'] as const).map((option, index, options) => (
          <button key={option} id={`f2l-${option}-tab`} type="button" role="tab"
            aria-selected={view === option} aria-controls={option === 'intuitive' ? 'f2l-intuitive' : 'case-panel'}
            tabIndex={view === option ? 0 : -1}
            onClick={() => setView(option)} onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
              event.preventDefault();
              const next = options[1 - index]!;
              setView(next);
              document.getElementById(`f2l-${next}-tab`)?.focus();
            }}>
            {option === 'algorithms' ? t('Công thức', 'Algorithms') : t('Tự nghiệm', 'Intuitive')}
          </button>
        ))}
      </div>}
      {phase === 'f2l' && intuitive && <IntuitiveF2L compact={compact} />}
      <div id="case-panel" hidden={intuitive} role={phase === 'f2l' ? 'tabpanel' : undefined}
        aria-labelledby={phase === 'f2l' ? 'f2l-algorithms-tab' : undefined}>
      <div id="case-tools" hidden={isCross}>
        <label>
          {t('Tìm case', 'Find a case')}
          <input
            id="case-search"
            placeholder={t("Sune, OLL 27, nhóm hình…", "Sune, OLL 27, group…")}
            type="search"
            value={term}
            onChange={(e) => onFilter(setTerm)(e.target.value)}
          />
        </label>
        <label>
          {t('Nhóm', 'Group')}
          <select id="case-group" value={group} onChange={(e) => onFilter(setGroup)(e.target.value)}>
            <option value="">{t('Tất cả nhóm', 'All groups')}</option>
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
          {t('Chưa đánh dấu đã học', 'Unlearned only')}
        </label>
      </div>
      <p className="case-count" aria-live="polite">
        {isCross
          ? t('Cross là bài toán lập kế hoạch, không phải danh sách công thức cố định.', 'Cross is a planning exercise.')
          : `${filtered.length} case · ${learnedInPhase} ${t('đã đánh dấu học', 'learned')}`}
      </p>
      {isCross ? (
        <CrossWorkshop compact={compact} />
      ) : (
        <div id="case-grid" className="case-grid">
          {items.length ? (
            items.map((c) => (
              <CaseCard key={c.id} item={c} learned={learned.includes(c.id)} onToggleLearned={onToggleLearned} onPlay={(variant) => playCase(filtered, filtered.indexOf(c), variant)} />
            ))
          ) : (
            <p className="empty-state">{t('Không có case phù hợp. Thử xóa tìm kiếm hoặc thay nhóm.', 'No cases match. Clear the search or change the group.')}</p>
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
              {t('Trang', 'Page')} {page + 1} / {total}
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
      {!isCross && <p className="muted">
        {t('Sơ đồ 2D đặt mặt vàng ở trên, mặt trắng ở dưới. Chọn cách giải để đổi sơ đồ.', 'The 2D diagrams show yellow on top and white below. Select a variant to change the diagram.')}
      </p>}
      {!compact && <ExternalLink className="source-link" href="https://github.com/lukejacksonn/cube">
        {t('Nguồn case từ Cube Coach (MIT) ↗', 'Cases from Cube Coach (MIT) ↗')}
      </ExternalLink>}
      </div>
    </section>
  );
}
