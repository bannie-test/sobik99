import { useState, type CSSProperties } from 'react';
import type { Cube } from '../../data/types';
import { ExternalLink } from '../../shared/ui/ExternalLink';

const GAN_COMPARISON_URL =
  'https://www.gancube.com/blogs/gan_news/gan-16-vs-gan-17-comparison-which-flagship-should-you-buy';

function MagnetCard() {
  const [repel, setRepel] = useState(false);
  return (
    <article className="mechanism-card mint">
      <small>01 / NAM CHÂM VIÊN</small>
      <div
        className={`force-diagram${repel ? ' repel' : ''}`}
        aria-label={repel ? 'Hai nam châm cùng cực đẩy nhau' : 'Hai nam châm khác cực hút nhau'}
      >
        <span className="magnet one">N</span>
        <span className="force-arrows">{repel ? '← →' : '→ ←'}</span>
        <span className="magnet two">{repel ? 'N' : 'S'}</span>
      </div>
      <h3>Một điểm dừng rõ ràng.</h3>
      <p>
        Nam châm viên góc và cạnh hỗ trợ lớp tự căn thẳng. Lực mạnh hơn không mặc định là tốt hơn: cảm giác phù hợp tay
        quan trọng hơn.
      </p>
      <button className="small-button" onClick={() => setRepel((r) => !r)}>
        {repel ? 'Thử lực hút khác cực' : 'Thử lực đẩy cùng cực'}
      </button>
    </article>
  );
}

function HomingCard() {
  // Mỗi lần bấm tăng `snaps` → remount lớp với class "snap" để chạy lại animation.
  const [snaps, setSnaps] = useState(0);
  return (
    <article className="mechanism-card peach">
      <small>03 / AUTO-HOMING</small>
      <div className="homing-diagram" aria-label="Lớp lệch góc trở về thẳng hàng">
        <div className="homing-base"></div>
        <div key={snaps} className={`homing-layer${snaps ? ' snap' : ''}`}>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i}></i>
          ))}
        </div>
      </div>
      <h3>Trở về đúng vị trí.</h3>
      <p>
        Ở một số thiết kế, nam châm lõi hỗ trợ kéo lớp về khi lệch trong một ngưỡng. Đây là mô phỏng nguyên lý, không
        phải cam kết một góc cố định.
      </p>
      <button className="small-button" onClick={() => setSnaps((n) => n + 1)}>
        Xoay lệch & căn lại
      </button>
    </article>
  );
}

function GanGenerations() {
  return (
    <div className="generation">
      <h3>Hai thế hệ, hai hệ từ trường.</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thông số</th>
              <th>GAN16 MagLev MAX</th>
              <th>GAN17 MagDrive</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Nam châm</th>
              <td>136</td>
              <td>196</td>
            </tr>
            <tr>
              <th>Trọng lượng đã xác minh</th>
              <td>64 g</td>
              <td></td>
            </tr>
            <tr>
              <th>Cơ chế</th>
              <td>MagLev / Magnetic GES</td>
              <td>MagDrive / MagLev</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ExternalLink href={GAN_COMPARISON_URL}>Nguồn: so sánh của GANCUBE ↗</ExternalLink>
    </div>
  );
}

/** Sơ đồ nguyên lý cơ chế (không phải bản vẽ kỹ thuật của mẫu). */
export function Mechanisms({ cube }: { cube: Cube }) {
  const showGenerations = cube.brand === 'GAN' && ['gan17', 'gan16'].includes(cube.id);
  return (
    <section className="mechanism-section">
      <div className="section-heading">
        <div>
          <small>BÊN TRONG MỘT VÒNG XOAY</small>
          <h2>
            Nhỏ ở kích thước.
            <br />
            <em>Lớn ở cơ chế.</em>
          </h2>
        </div>
        <p>
          Mô hình nguyên lý minh họa, không phải bản vẽ kỹ thuật của {cube.name}. Khả năng thực tế phụ thuộc từng thiết
          kế và thiết lập.
        </p>
      </div>
      <div className="mechanism-grid">
        <MagnetCard />
        <article className="mechanism-card lilac">
          <small>02 / MAGLEV & LÒ XO</small>
          <div className="compression-diagram">
            <div>
              <span className="spring"></span>
              <b>Lò xo</b>
            </div>
            <div>
              <span className="maglev-rings">
                <i></i>
                <i></i>
              </span>
              <b>MagLev</b>
            </div>
          </div>
          <h3>Đàn hồi bằng từ trường.</h3>
          <p>
            MagLev thay lò xo bằng hai vòng nam châm đẩy nhau, giảm ma sát tại cơ chế nén. Các bộ phận khác của khối
            Rubik vẫn tiếp xúc cơ học.
          </p>
        </article>
        <HomingCard />
        <article className="mechanism-card butter">
          <small>04 / LÕI TỪ</small>
          <div className="core-diagram" role="img" aria-label="Lõi trung tâm và các điểm từ quanh lõi">
            <div className="core-hub">◎</div>
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} style={{ '--a': `${i * 60}deg` } as CSSProperties}></i>
            ))}
          </div>
          <h3>Ổn định từ tâm.</h3>
          <p>
            Nam châm lõi bổ sung tương tác từ với các viên quanh tâm, hỗ trợ kiểm soát. Khối không có lõi từ vẫn có thể
            dùng nam châm giữa các viên.
          </p>
        </article>
      </div>
      {showGenerations && <GanGenerations />}
    </section>
  );
}
