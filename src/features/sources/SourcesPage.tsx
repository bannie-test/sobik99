import { cubes } from '../../data/cubes';
import { ExternalLink } from '../../shared/ui/ExternalLink';

const HISTORY_SOURCES = [
  ['https://rubiks.com/history', 'Rubik’s — lịch sử 1974, 1980, 1982'],
  ['https://www.moma.org/collection/works/2908', 'MoMA — Ernő Rubik, kiến trúc sư và giảng viên thiết kế'],
  [
    'https://www.gancube.com/blogs/gan_news/gan-16-vs-gan-17-comparison-which-flagship-should-you-buy',
    'GANCUBE — so sánh GAN16 / GAN17',
  ],
] as const;

export function SourcesPage() {
  return (
    <section className="page-shell source-page">
      <small>CUBE CLUB / MINH BẠCH DỮ LIỆU</small>
      <h1>
        Nguồn rõ ràng.
        <br />
        <em>Khám phá an tâm.</em>
      </h1>
      <h2>Một website cá nhân, phi thương mại.</h2>
      <p>
        SOBIK99 không bán hàng, không thu thập địa chỉ và không xử lý thanh toán. Mọi giá VND do SOBIK99 đặt để minh họa
        giao diện; không phải giá đang bán hay quy đổi ngoại tệ. Tất cả đơn hàng và vận chuyển là mô phỏng.
      </p>
      <h2>Thông số sản phẩm</h2>
      <p>
        Ngày đối chiếu: 16/11/2026. Dữ liệu chưa xác minh để trống; các phiên bản cùng tên có thể khác cơ chế. Không
        dùng điểm rating giả. Phần điểm mạnh / lưu ý là nhận định biên tập dựa trên tính năng, không phải trích review
        khách hàng.
      </p>
      <ul className="sources-product-list">
        {cubes.map((c) => (
          <li key={c.id}>
            <ExternalLink href={c.sources[0].url}>
              {c.name} — {c.sources[0].name} ↗
            </ExternalLink>
          </li>
        ))}
      </ul>
      <h2>Lịch sử và cơ chế</h2>
      <ul>
        {HISTORY_SOURCES.map(([href, label]) => (
          <li key={href}>
            <ExternalLink href={href}>{label}</ExternalLink>
          </li>
        ))}
      </ul>
      <h2>Công thức và hình minh họa</h2>
      <p>
        119 case CFOP và các công thức tham khảo từ{' '}
        <ExternalLink href="https://github.com/lukejacksonn/cube">Cube Coach của Luke Jackson (MIT)</ExternalLink>.
        Trạng thái và ảnh được sinh bằng{' '}
        <ExternalLink href="https://github.com/cubing/cubing.js">cubing.js (MPL-2.0)</ExternalLink>. Biến thể “Đổi hướng
        cầm y” được ghi rõ. Hướng dẫn tiếng Việt do SOBIK99 biên soạn; các trang bài học dẫn tài liệu mở rộng.
      </p>
      <p>
        Rubik trên landing được xáo bằng 20 phép xoay hợp lệ rồi giải bằng chuỗi nghịch đảo theo cuộn, không phải quá
        trình CFOP hay lời giải tối ưu. Các hình sản phẩm là minh họa hình khối, không mô phỏng chính xác kết cấu từng
        mẫu.
      </p>
      <h2>Dữ liệu của bạn</h2>
      <p>
        Lịch sử timer, đánh dấu đã học và danh sách so sánh chỉ lưu trong localStorage của trình duyệt. Không có tài
        khoản hay máy chủ lưu thành tích. Xóa dữ liệu trình duyệt sẽ mất dữ liệu; dùng nút xuất CSV ở Timer để giữ bản
        sao.
      </p>
      <a href="#/" className="button primary">
        Quay lại hành trình ↗
      </a>
    </section>
  );
}
