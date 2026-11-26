import { Fragment, useState } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import { blindfoldPage } from '../../cube-tools/pages-blindfold.js';
import { InteractiveView } from '../../shared/ui/InteractiveView';
import { puzzleTypes } from '../../cube-tools/data/puzzles.js';
import { lessons, notation } from '../../cube-tools/data/lessons.js';
import type { PuzzleType } from '../../data/types';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { usePlayAlgorithm } from './AlgorithmPlayer';
import { CaseLibrary } from './CaseLibrary';

const isPuzzle = (v: string | null): v is PuzzleType => v !== null && Object.hasOwn(lessons, v);

/** "Nhỏ gọn. Không hề đơn điệu." → "Nhỏ gọn." + <em>"Không hề đơn điệu."</em> */
function LessonTitle({ title }: { title: string }) {
  const at = title.indexOf('. ');
  if (at < 0) return <h1>{title}</h1>;
  return (
    <h1>
      {title.slice(0, at + 1)}
      <br />
      <em>{title.slice(at + 2)}</em>
    </h1>
  );
}

function PracticeSection({ lesson, puzzle, compact }: { lesson: (typeof lessons)[PuzzleType]; puzzle: PuzzleType; compact: boolean }) {
  const play = usePlayAlgorithm();
  const hasAlgs = lesson.algs.length > 0;
  return (
    <section className="algorithm-library">
      <small>{t('LUYỆN BẰNG MÔ HÌNH', 'MODEL PRACTICE')}</small>
      <h2>{hasAlgs ? t('Một vài chuyển động để bắt đầu.', 'Moves to get started.') : t('Từ ý tưởng đến luyện tập.', 'From ideas to practice.')}</h2>
      {hasAlgs ? (
        lesson.algs.map(([name = '', alg = '']) => (
          <article key={name} className="tutorial-alg">
            <h3>{name}</h3>
            <code>{alg}</code>
            <button className="button secondary" onClick={() => play({ alg, puzzle, title: name })}>
              {t('Xem cách xoay ↗', 'Watch algorithm ↗')}
            </button>
          </article>
        ))
      ) : (
        <>
          <p>
            {t(`Với ${puzzle}, hãy nhận diện tâm và cạnh trước khi luyện công thức trên khối thật.`, `For ${puzzle}, identify the centers and edges before practicing algorithms on a physical puzzle.`)}
          </p>
          {!compact && <ExternalLink className="button primary" href={lesson.source}>
            {t('Mở tài liệu', 'Open guide')} {puzzle} ↗
          </ExternalLink>}
        </>
      )}
    </section>
  );
}

export default function GuidePage({ query, compact = false }: { query: URLSearchParams; compact?: boolean }) {
  const requested = query.get('puzzle');
  const [compactPuzzle, setCompactPuzzle] = useState<PuzzleType | undefined>();
  const puzzle = (compact && compactPuzzle) || (isPuzzle(requested) ? requested : '3x3');
  const [blindfold, setBlindfold] = useState(query.get('lesson') === 'blindfold');
  const lesson = lessons[puzzle];
  const wideLayout = typeof matchMedia === 'undefined' || matchMedia('(min-width: 761px)').matches;

  return (
    <section className="page-shell guide-page">
      {!blindfold && <div className="page-heading">
        <div>
          <small>CUBE SCHOOL / {puzzle}</small>
          <LessonTitle title={lesson.title} />
        </div>
        <p>{lesson.intro}</p>
      </div>}
      <div className="guide-layout">
        <aside className="guide-sidebar">
          <small>{t('CHỌN HÌNH KHỐI', 'CHOOSE A PUZZLE')}</small>
          <nav aria-label={t('Loại Rubik', 'Puzzle types')}>
            {puzzleTypes.filter(isPuzzle).map((type) => compact ? (
              <button key={type} type="button" data-guide-puzzle={type}
                aria-current={type === puzzle && !blindfold ? 'page' : undefined}
                onClick={() => { setCompactPuzzle(type); setBlindfold(false); }}>{type}</button>
            ) : (
              <a key={type} href={`#/guide?puzzle=${type}`} aria-current={type === puzzle && !blindfold ? 'page' : undefined}>
                {type}<span>↗</span>
              </a>
            ))}
            {compact ? <button type="button" data-guide-puzzle="blindfold" aria-current={blindfold ? 'page' : undefined}
              onClick={() => setBlindfold(true)}>{t('Bịt mắt', 'Blindfold')}</button> :
              <a href="#/guide?lesson=blindfold" aria-current={blindfold ? 'page' : undefined}>{t('Bịt mắt', 'Blindfold')}</a>}
          </nav>
          <details className="notation" open={!compact && wideLayout}>
            <summary>{t('Bảng ký hiệu', 'Move notation')}</summary>
            <dl>
              {notation.map(([n, d]) => (
                <Fragment key={n}>
                  <dt>{n}</dt>
                  <dd>{d}</dd>
                </Fragment>
              ))}
            </dl>
          </details>
        </aside>
        <div className="guide-main" key={puzzle}>
          {blindfold ? <InteractiveView mount={blindfoldPage} /> : <>
          {!compact && <details className="learning-intro guide-roadmap" open={wideLayout}>
            <summary>{t('Lộ trình học', 'Learning path')}</summary>
            {lesson.steps.map(([title, text], i) => (
              <details key={title} className="lesson" open={i === 0}>
                <summary>
                  <span>0{i + 1}</span>
                  {title}
                </summary>
                <p>{text}</p>
              </details>
            ))}
            <ExternalLink href={lesson.source} className="source-link">
              {t('Tài liệu tham khảo thêm ↗', 'More resources ↗')}
            </ExternalLink>
          </details>}
          {puzzle === '3x3' ? <CaseLibrary query={query} compact={compact} /> : <PracticeSection lesson={lesson} puzzle={puzzle} compact={compact} />}
          </>}
        </div>
      </div>
    </section>
  );
}
