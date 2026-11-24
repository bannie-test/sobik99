import { Suspense, useLayoutEffect, useState } from 'react';
import { language, t } from '../cube-tools/utils/i18n.js';
import { PageLoading } from '../features/layout/NotFoundPage';
import { SiteFooter, SiteHeader, SkipLink } from '../features/layout/SiteHeader';
import { read, write } from '../shared/lib/storage';
import { CubeToolsUi } from '../shared/ui/InteractiveView';
import { useModal } from '../shared/ui/Modal';
import { resolveRoute } from './routes';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { useHashLocation } from './router';

const COMPACT_KEY = 'sobik_compact_mode';

export function App() {
  const location = useHashLocation();
  const modal = useModal();
  const [compact, setCompact] = useState(() => read(COMPACT_KEY, false, (value): value is boolean => typeof value === 'boolean'));
  const path = compact ? '/guide' : location.path;
  const { route, params } = resolveRoute(path);
  const query = path === location.path ? location.query : new URLSearchParams();
  const routeKey = compact ? 'compact' + location.hash : location.hash;

  useLayoutEffect(() => {
    modal.close();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [routeKey, modal]);
  useLayoutEffect(() => {
    document.title = path === '/' ? route.title : `${route.title} — SOBIK99`;
  }, [path, route.title, routeKey]);
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.body.classList.toggle('compact-mode', compact);
    return () => document.body.classList.remove('compact-mode');
  }, [compact]);

  return (
    <>
      <CubeToolsUi />
      <SkipLink />
      <SiteHeader currentPath={path} compact={compact} onCompactChange={(value) => {
        write(COMPACT_KEY, value);
        setCompact(value);
      }} />
      <main id="main" tabIndex={-1}>
        <RouteErrorBoundary key={routeKey}>
          <Suspense fallback={<PageLoading message={route.loading ?? t('Đang tải…', 'Loading…')} />}>
            {route.render({ params, query, compact })}
          </Suspense>
        </RouteErrorBoundary>
      </main>
      {!compact && <SiteFooter />}
    </>
  );
}
