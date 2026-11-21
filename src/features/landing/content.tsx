import type { ReactNode } from 'react';
import { ExternalLink } from '../../shared/ui/ExternalLink';

/** Nhãn 6 chương ở thanh điều hướng của hành trình cuộn. */
export const CHAPTERS = ['Khám phá', '1974', '1980–82', 'Nam châm', 'MagLev', 'Hoàn thành'];
export const LAST_CHAPTER = CHAPTERS.length - 1;

/** [--page, --disc] cho từng chương. */
export const PALETTES: [string, string][] = [
  ['#fbf8f0', '#e4d8ff'],
  ['#fff5e6', '#ffd08b'],
  ['#fff0f2', '#f7b6d3'],
  ['#f1f8e7', '#c8e89c'],
  ['#f1edff', '#bcaff0'],
  ['#fffbea', '#fff16c'],
];

interface StoryActions {
  goToChapter: (i: number) => void;
  goToEnd: () => void;
}

/** Nội dung 6 chương. Mỗi phần tử là thân của một <article class="story">. */
export function stories({ goToChapter, goToEnd }: StoryActions): ReactNode[] {
  return [
    <>
      <small>MỘT KHỐI RUBIK. CẢ MỘT THẾ GIỚI.</small>
      <h1>
        Xáo trộn.
        <br />
        <span>Khám phá.</span>
        <br />
        Chinh phục.
      </h1>
      <p>
        Từ một ý tưởng ở Budapest đến những chuyển động chính xác trong lòng bàn tay. Mỗi vòng xoay, một điều để khám
        phá.
      </p>
      <button className="cta" onClick={() => goToChapter(1)}>
        Cuộn vào câu chuyện ↓
      </button>
      <div className="hero-doodle" aria-hidden="true">
        ✳ <span>STAY CURIOUS.</span>
      </div>
    </>,
    <>
      <small>1974 / BUDAPEST, HUNGARY</small>
      <h2>
        Bắt đầu từ
        <br />
        <span>một câu hỏi.</span>
      </h2>
      <p>
        Năm 1974, <strong>Ernő Rubik</strong>, kiến trúc sư và giảng viên thiết kế người Hungary, tạo nên khối xếp hình
        ba chiều để khám phá các quan hệ không gian.
      </p>
      <p className="aside">Làm sao các mảnh có thể chuyển động mà cả khối vẫn gắn liền?</p>
      <ExternalLink href="https://www.moma.org/collection/works/2908">Về người sáng tạo ↗</ExternalLink>
    </>,
    <>
      <small>1980 → 1982 / MỘT BIỂU TƯỢNG RA ĐỜI</small>
      <h2>
        Sáu màu sắc.
        <br />
        <span>Khắp thế giới.</span>
      </h2>
      <p>
        Năm 1980, “Magic Cube” ra mắt toàn cầu dưới tên Rubik’s Cube. Năm 1982, giải vô địch thế giới đầu tiên biến
        những vòng xoay thành cuộc đua.
      </p>
      <div className="milestones">
        <span>
          <b>1980</b>Ra mắt toàn cầu
        </span>
        <span>
          <b>1982</b>Giải thế giới đầu tiên
        </span>
      </div>
      <ExternalLink href="https://rubiks.com/history">Lịch sử Rubik’s ↗</ExternalLink>
    </>,
    <>
      <small>BƯỚC TIẾN CƠ KHÍ / SPEEDCUBE NAM CHÂM</small>
      <h2>
        Không chỉ nhanh.
        <br />
        <span>Còn chính xác.</span>
      </h2>
      <p>
        Từ cơ chế truyền thống, speedcube phát triển theo hướng tối ưu cảm giác xoay. Nam châm giữa các viên hỗ trợ đưa
        lớp về vị trí, tạo điểm dừng rõ ràng.
      </p>
      <div className="pills">
        <span>Căn chỉnh lớp</span>
        <span>Cảm giác kiểm soát</span>
      </div>
      <p className="aside">Cơ chế phát triển. Niềm vui chinh phục vẫn nguyên vẹn.</p>
    </>,
    <>
      <small>CÔNG NGHỆ HIỆN ĐẠI / MAGLEV + LÕI TỪ</small>
      <h2>
        Bên trong nhỏ.
        <br />
        <span>Bước tiến lớn.</span>
      </h2>
      <p>
        MagLev dùng hai vòng nam châm đẩy nhau thay lò xo, giảm ma sát ở cơ chế nén. Nam châm lõi hỗ trợ ổn định và tự
        căn chỉnh trên những mẫu được thiết kế phù hợp.
      </p>
      <div className="pills">
        <span>MagLev</span>
        <span>Core magnet</span>
        <span>Tùy chỉnh lực</span>
      </div>
      <a href="#/cube/gan12">Bên trong GAN12 ↗</a>
    </>,
    <>
      <small>HÔM NAY / CHƯƠNG TIẾP THEO LÀ BẠN</small>
      <h2>
        Sáu mặt.
        <br />
        <span>Một khoảnh khắc.</span>
      </h2>
      <p>
        Từng vòng xoay đã tìm về đúng vị trí. Khối Rubik hoàn thành cả sáu mặt. Cuộn thêm một chút để bước vào thế giới
        thương hiệu và tìm cá tính của bạn.
      </p>
      <button className="cta" onClick={goToEnd}>
        Bước vào Cube Club ↗
      </button>
    </>,
  ];
}
