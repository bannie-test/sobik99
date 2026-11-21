import { useModal } from '../../shared/ui/Modal';
import { CompareDialog } from '../compare/CompareDialog';
import { useCompare } from '../compare/useCompare';

const NAV_LINKS = [
  { path: '/catalog', label: 'Bộ sưu tập' },
  { path: '/guide', label: 'Học cách xoay' },
  { path: '/timer', label: 'Timer ↗', className: 'nav-timer' },
];

export function SiteHeader({ currentPath }: { currentPath: string }) {
  const modal = useModal();
  const { ids } = useCompare();
  return (
    <header className="site-nav">
      <a className="wordmark" href="#/" aria-label="SOBIK99 Trang chủ">
        SOBIK<span>99</span>
        <i>✳</i>
      </a>
      <nav aria-label="Điều hướng chính">
        {NAV_LINKS.map(({ path, label, className }) => (
          <a
            key={path}
            href={`#${path}`}
            className={className}
            aria-current={currentPath.startsWith(path) ? 'page' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <button
        id="compare-open"
        className="compare-pill"
        aria-label="Mở so sánh"
        onClick={() => modal.open(<CompareDialog />)}
      >
        So sánh <span>{ids.length}</span>
      </button>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a href="#/" className="wordmark">
          SOBIK<span>99</span> ✳
        </a>
        <p>Cứ tò mò. Cứ xoay. Cứ tiến bộ.</p>
      </div>
      <div>
        <p>
          Website cá nhân, phi thương mại. Không bán hàng thật.
          <br />
          Giá demo chỉ minh họa; thông số có nguồn riêng trên mỗi sản phẩm.
          <br />
          Mọi thương hiệu thuộc chủ sở hữu tương ứng.
        </p>
        <a href="#/sources">Nguồn & ghi chú dữ liệu ↗</a>
      </div>
    </footer>
  );
}

/** Link "Đến nội dung" cho người dùng bàn phím (hash đã dùng cho routing nên xử lý thủ công). */
export function SkipLink() {
  return (
    <a
      className="skip-link"
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('main');
        if (!main) return;
        main.tabIndex = -1;
        main.focus();
        main.scrollIntoView();
      }}
    >
      Đến nội dung
    </a>
  );
}
