import { Fragment } from 'react';
import { puzzleTypes } from '../../data/cubes';
import { lessons, notation } from '../../data/lessons';
import type { Lesson, PuzzleType } from '../../data/types';
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

function PracticeSection({ lesson, puzzle }: { lesson: Lesson; puzzle: PuzzleType }) {
  const play = usePlayAlgorithm();
  const hasAlgs = lesson.algs.length > 0;
  return (
    <section className="algorithm-library">
      <small>LUYỆN BẰNG MÔ HÌNH</small>
      <h2>{hasAlgs ? 'Một vài chuyển động để bắt đầu.' : 'Từ ý tưởng đến luyện tập.'}</h2>
      {hasAlgs ? (
        lesson.algs.map(([name, alg]) => (
          <article key={name} className="tutorial-alg">
            <h3>{name}</h3>
            <code>{alg}</code>
            <button className="button secondary" onClick={() => play({ alg, puzzle, title: name })}>
              Xem chuyển động ↗
            </button>
          </article>
        ))
      ) : (
        <>
          <p>
            Với {puzzle}, ưu tiên nhận diện tâm, cạnh và quỹ đạo trước khi áp dụng công thức. Theo lộ trình bên trên,
            luyện từng bước trên khối thật; tài liệu tham khảo có hướng dẫn mở rộng theo trường hợp.
          </p>
          <ExternalLink className="button primary" href={lesson.source}>
            Mở tài liệu {puzzle} ↗
          </ExternalLink>
        </>
      )}
    </section>
  );
}

export default function GuidePage({ query }: { query: URLSearchParams }) {
  const requested = query.get('puzzle');
  const puzzle: PuzzleType = isPuzzle(requested) ? requested : '3x3';
  const lesson = lessons[puzzle];

  return (
    <section className="page-shell guide-page">
      <div className="page-heading">
        <div>
          <small>CUBE SCHOOL / {puzzle}</small>
          <LessonTitle title={lesson.title} />
        </div>
        <p>{lesson.intro}</p>
      </div>
      <div className="guide-layout">
        <aside className="guide-sidebar">
          <small>CHỌN HÌNH KHỐI</small>
          <nav aria-label="Loại Rubik">
            {puzzleTypes.map((t) => (
              <a key={t} href={`#/guide?puzzle=${t}`} aria-current={t === puzzle ? 'page' : undefined}>
                {t}
                <span>↗</span>
              </a>
            ))}
          </nav>
          <details className="notation" open>
            <summary>Bảng ký hiệu</summary>
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
        <div className="guide-main">
          <div className="learning-intro">
            <small>HIỂU TRƯỚC. XOAY SAU.</small>
            <h2>Lộ trình của bạn.</h2>
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
              Tài liệu tham khảo thêm ↗
            </ExternalLink>
          </div>
          {puzzle === '3x3' ? <CaseLibrary /> : <PracticeSection lesson={lesson} puzzle={puzzle} />}
        </div>
      </div>
    </section>
  );
}
