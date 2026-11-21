import { cubes, findCube } from '../../data/cubes';
import { money } from '../../shared/lib/format';
import { CubeArt } from '../../shared/ui/CubeArt';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { CompareButton } from '../compare/CompareButton';
import { Mechanisms } from './Mechanisms';
import { ProductCard } from './ProductCard';
import { SPEC_FIELDS } from './specFields';
import { useCheckout } from './useCheckout';

const RELATED_LIMIT = 3;

export function CubeDetailPage({ id }: { id: string }) {
  const checkout = useCheckout();
  const cube = findCube(id);

  if (!cube) {
    return (
      <section className="page-shell">
        <h1>Không tìm thấy Rubik.</h1>
        <a href="#/catalog">Quay lại bộ sưu tập</a>
      </section>
    );
  }

  const related = cubes.filter((x) => x.id !== id && x.type === cube.type).slice(0, RELATED_LIMIT);
  const { reviews_summary: review } = cube;

  return (
    <section className="page-shell">
      <a href="#/catalog" className="back-link">
        ← Bộ sưu tập
      </a>
      <div className="detail-hero">
        <div className={`detail-art tone-${cubes.indexOf(cube) % 5}`}>
          <CubeArt type={cube.type} />
          <small>MINH HỌA HÌNH KHỐI · KHÔNG PHẢI ẢNH SẢN PHẨM</small>
        </div>
        <div>
          <small>
            {cube.brand} / {cube.type}
          </small>
          <h1>{cube.name}</h1>
          <p>{cube.summary}</p>
          <div className="detail-price">
            {money(cube.price_fake)} <span>Giá demo</span>
          </div>
          <p className="muted">{cube.price_note}</p>
          <div className="actions">
            <button className="button primary" onClick={() => checkout(cube.id)}>
              Mua (Demo) ↗
            </button>
            <CompareButton id={cube.id} className="button secondary" />
          </div>
        </div>
      </div>

      <section className="spec-section">
        <div>
          <small>HỒ SƠ HÌNH KHỐI</small>
          <h2>Thông số rõ ràng.</h2>
          <p>Ô trống là thông số chưa xác minh. Kiểm tra đúng phiên bản tại nguồn trước khi mua thật.</p>
        </div>
        <dl className="specs">
          {SPEC_FIELDS.map(({ label, get }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{get(cube)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Mechanisms cube={cube} />

      <section className="review-section">
        <div>
          <small>GÓC NHÌN TỔNG QUAN</small>
          <h2>Điểm mạnh & lưu ý.</h2>
          <p>{review.source}</p>
        </div>
        <div className="pros-cons">
          <article>
            <h3>＋ Điểm đáng chú ý</h3>
            <ul>
              {review.pros.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>↳ Điều cần cân nhắc</h3>
            <ul>
              {review.cons.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="source-panel">
        <small>THÔNG TIN & NGUỒN</small>
        <h3>{cube.brand} nói gì về cơ chế?</h3>
        <p>{cube.manufacturer_info}</p>
        <p>Ngày đối chiếu: {cube.checked}. Thông số có thể khác giữa các phiên bản.</p>
        {cube.sources.map((s) => (
          <ExternalLink key={s.url} href={s.url}>
            {s.name} — {s.url} ↗
          </ExternalLink>
        ))}
      </section>

      <div className="section-heading">
        <h2>Thêm một cá tính?</h2>
        <a href="#/catalog">Xem tất cả ↗</a>
      </div>
      <div className="product-grid">
        {related.map((c) => (
          <ProductCard key={c.id} cube={c} />
        ))}
      </div>
    </section>
  );
}
