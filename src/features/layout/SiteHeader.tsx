import { language, setLanguage, t } from '../../cube-tools/utils/i18n.js';

const NAV_LINKS = [
  ['/', t('Trang chủ', 'Home')],
  ['/catalog', t('Thư viện Rubik', 'Cube Library')],
  ['/solve', t('Giải Rubik', 'Solve')],
  ['/guide', t('Học cách xoay', 'Learn')],
  ['/workshop', t('Xưởng Rubik', 'Workshop')],
  ['/simulator', t('Rubik 3D', '3D Cube')],
  ['/timer', 'Timer'],
] as const;

export function SiteHeader({ currentPath, compact, onCompactChange }: {
  currentPath: string;
  compact: boolean;
  onCompactChange: (value: boolean) => void;
}) {
  const wordmark = <>SOBIK<span>99</span><i>✳</i></>;
  return (
    <header className="site-nav">
      {compact ? <span className="wordmark">{wordmark}</span> : (
        <a className="wordmark" href="#/" aria-label={t('SOBIK99 Trang chủ', 'SOBIK99 home')}>{wordmark}</a>
      )}
      <nav aria-label={t('Điều hướng chính', 'Main navigation')}>
        {compact ? <span className="nav-learn" aria-current="page">{t('Học cách xoay', 'Learn')}</span> :
          NAV_LINKS.map(([path, label]) => (
            <a key={path} href={`#${path}`} className={path === '/timer' ? 'nav-timer' : path === '/' ? 'nav-home' : undefined}
              aria-current={currentPath === path || (path === '/catalog' && currentPath.startsWith('/cube/')) ? 'page' : undefined}>
              {label}
            </a>
          ))}
      </nav>
      <div className="site-controls">
        <label className="site-switch">
          <input
            id="compact-mode"
            type="checkbox"
            role="switch"
            checked={compact}
            onChange={(event) => onCompactChange(event.currentTarget.checked)}
          />
          <span className="site-switch-track" aria-hidden="true" />
          {t('Thu gọn', 'Compact')}
        </label>
        <label className="site-switch language-switch">
          <input
            id="site-language"
            type="checkbox"
            role="switch"
            aria-label={t('Dùng tiếng Anh', 'Use English')}
            checked={language === 'en'}
            onChange={(event) => setLanguage(event.currentTarget.checked ? 'en' : 'vi')}
          />
          <span className="language-segments" aria-hidden="true">
            <span>VI</span>
            <span>EN</span>
          </span>
        </label>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a href="#/" className="wordmark">SOBIK<span>99</span> ✳</a>
      <p>{t('Website Rubik phi thương mại. Mọi thương hiệu thuộc chủ sở hữu tương ứng.', 'A noncommercial cube site. Trademarks belong to their respective owners.')}</p>
      <a href="#/sources">{t('Nguồn hình ảnh ↗', 'Photo credits ↗')}</a>
    </footer>
  );
}

export function SkipLink() {
  return (
    <a className="skip-link" href="#main" onClick={(e) => {
      e.preventDefault();
      const main = document.getElementById('main');
      main?.focus();
      main?.scrollIntoView();
    }}>{t('Đến nội dung', 'Skip to content')}</a>
  );
}
