import { puzzleTypes } from '../../data/cubes';

/** Lối vào theo loại hình khối + CTA sang Guide / Timer. */
export function HomeExplore() {
  return (
    <section className="home-explore page-shell">
      <div className="section-heading">
        <div>
          <small>TỪ HÌNH HỌC ĐẾN TỐC ĐỘ</small>
          <h2>
            Chọn thử thách.
            <br />
            <em>Tự viết hành trình.</em>
          </h2>
        </div>
        <p>
          Khối nhỏ, khối lớn, nhiều mặt hơn.
          <br />
          Có một hình khối đang chờ bạn.
        </p>
      </div>
      <div className="puzzle-type-grid">
        {puzzleTypes.map((t, i) => (
          <a key={t} href={`#/catalog?type=${t}`} className={`type-tile tone-${i % 5}`}>
            <b>{t}</b>
            <span>KHÁM PHÁ ↗</span>
          </a>
        ))}
      </div>
      <div className="home-cta">
        <div>
          <small>XOAY TỐT HƠN MỖI NGÀY</small>
          <h2>
            Hiểu một công thức.
            <br />
            Phá một giới hạn.
          </h2>
          <a href="#/guide" className="button secondary">
            Vào lớp học ↗
          </a>
        </div>
        <div>
          <span className="timer-sample">00:00.00</span>
          <p>R U R′ U′ · Một bước nhỏ để bắt đầu.</p>
          <a href="#/timer" className="button primary">
            Bắt đầu luyện tập ↗
          </a>
        </div>
      </div>
    </section>
  );
}
