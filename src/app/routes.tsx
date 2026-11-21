import { lazy, type ReactNode } from 'react';
import { findCube } from '../data/cubes';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { CubeDetailPage } from '../features/catalog/CubeDetailPage';
import { LandingPage } from '../features/landing/LandingPage';
import { NotFoundPage } from '../features/layout/NotFoundPage';
import { SourcesPage } from '../features/sources/SourcesPage';
import { matchPath, type RouteParams } from './router';

// Trang nặng (cubing.js) được tách chunk và chỉ tải khi mở.
const GuidePage = lazy(() => import('../features/guide/GuidePage'));
const TimerPage = lazy(() => import('../features/timer/TimerPage'));

interface RouteContext {
  params: RouteParams;
  query: URLSearchParams;
}

export interface RouteDef {
  path: string;
  title: (ctx: RouteContext) => string;
  render: (ctx: RouteContext) => ReactNode;
  /** Thông báo khi đang tải chunk (route lazy). */
  loading?: string;
}

const SUFFIX = ' — SOBIK99';

/** Thêm trang mới: thêm một dòng vào bảng này. */
export const ROUTES: RouteDef[] = [
  { path: '/', title: () => 'SOBIK99 — Cube Club', render: () => <LandingPage /> },
  { path: '/catalog', title: () => 'Bộ sưu tập' + SUFFIX, render: ({ query }) => <CatalogPage query={query} /> },
  {
    path: '/cube/:id',
    title: ({ params }) => (findCube(params.id ?? '')?.name || 'Rubik') + SUFFIX,
    render: ({ params }) => <CubeDetailPage id={params.id ?? ''} />,
  },
  {
    path: '/guide',
    title: () => 'Học cách xoay' + SUFFIX,
    render: ({ query }) => <GuidePage query={query} />,
    loading: 'Đang mở lớp học…',
  },
  { path: '/timer', title: () => 'Timer' + SUFFIX, render: () => <TimerPage />, loading: 'Đang mở phòng luyện tập…' },
  { path: '/sources', title: () => 'Nguồn dữ liệu' + SUFFIX, render: () => <SourcesPage /> },
];

const NOT_FOUND: RouteDef = {
  path: '*',
  title: () => 'Không tìm thấy trang' + SUFFIX,
  render: () => <NotFoundPage />,
};

export function resolveRoute(path: string): { route: RouteDef; params: RouteParams } {
  for (const route of ROUTES) {
    const params = matchPath(route.path, path);
    if (params) return { route, params };
  }
  return { route: NOT_FOUND, params: {} };
}
