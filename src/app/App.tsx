import { Suspense, useLayoutEffect } from 'react';
import { PageLoading } from '../features/layout/NotFoundPage';
import { SiteFooter, SiteHeader, SkipLink } from '../features/layout/SiteHeader';
import { useModal } from '../shared/ui/Modal';
import { resolveRoute } from './routes';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { useHashLocation } from './router';

export function App() {
  const location = useHashLocation();
  const modal = useModal();
  const { route, params } = resolveRoute(location.path);
  const ctx = { params, query: location.query };
  const title = route.title(ctx);

  // Mỗi lần điều hướng: đóng hộp thoại, cuộn lên đầu, đặt tiêu đề trang.
  useLayoutEffect(() => {
    modal.close();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.hash, modal]);
  useLayoutEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <SkipLink />
      <SiteHeader currentPath={location.path} />
      <main id="main">
        {/* key = hash: mỗi lần điều hướng trang được dựng mới, giống bản cũ. */}
        <RouteErrorBoundary key={location.hash}>
          <Suspense fallback={<PageLoading message={route.loading ?? ''} />}>{route.render(ctx)}</Suspense>
        </RouteErrorBoundary>
      </main>
      <SiteFooter />
    </>
  );
}
