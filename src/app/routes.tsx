import { lazy, type ReactNode } from 'react';
import { t } from '../cube-tools/utils/i18n.js';
import { NotFoundPage } from '../features/layout/NotFoundPage';
import { matchPath, type RouteParams } from './router';

const GuidePage = lazy(() => import('../features/guide/GuidePage'));
const LandingPage = lazy(() => import('../features/landing/InteractiveLanding'));
const CatalogPage = lazy(() => import('../features/catalog/InteractiveCatalog'));
const SolvePage = lazy(() => import('../features/solve/SolvePage'));
const WorkshopPage = lazy(() => import('../features/workshop/WorkshopPage'));
const SourcesPage = lazy(() => import('../features/sources/PhotoCredits'));
const TimerPage = lazy(() => import('../features/timer/TimerPage'));

interface RouteContext {
  params: RouteParams;
  query: URLSearchParams;
  compact?: boolean;
}

interface RouteDef {
  path: string;
  title: string;
  render: (ctx: RouteContext) => ReactNode;
  loading?: string;
}

export const ROUTES: RouteDef[] = [
  { path: '/', title: 'SOBIK99', render: () => <LandingPage /> },
  {
    path: '/catalog', title: t('Thư viện Rubik', 'Cube Library'),
    render: ({ query }) => <CatalogPage query={query} />,
  },
  {
    path: '/cube/:brand/:id', title: 'Rubik',
    render: ({ params }) => <CatalogPage brand={params.brand} id={params.id} />,
  },
  {
    path: '/cube/:id', title: 'Rubik',
    render: ({ params }) => <CatalogPage id={params.id} />,
  },
  {
    path: '/guide', title: t('Học cách xoay', 'Learn'),
    render: ({ query, compact }) => <GuidePage query={query} compact={compact} />,
  },
  { path: '/solve', title: t('Giải Rubik', 'Solve'), render: ({ query }) => <SolvePage query={query} /> },
  { path: '/workshop', title: t('Xưởng Rubik', 'Cube Workshop'), render: () => <WorkshopPage /> },
  { path: '/timer', title: 'Timer', render: () => <TimerPage /> },
  { path: '/sources', title: t('Nguồn hình ảnh', 'Photo credits'), render: () => <SourcesPage /> },
];

const NOT_FOUND: RouteDef = {
  path: '*',
  title: t('Không tìm thấy trang', 'Page not found'),
  render: () => <NotFoundPage />,
};

export function resolveRoute(path: string): { route: RouteDef; params: RouteParams } {
  for (const route of ROUTES) {
    const params = matchPath(route.path, path);
    if (params) return { route, params };
  }
  return { route: NOT_FOUND, params: {} };
}
