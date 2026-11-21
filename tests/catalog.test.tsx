import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { cubes } from '../src/data/cubes';
import { CatalogPage } from '../src/features/catalog/CatalogPage';
import { CubeDetailPage } from '../src/features/catalog/CubeDetailPage';
import { EMPTY_FILTERS, filterCubes } from '../src/features/catalog/filterCubes';
import { compareStore } from '../src/features/compare/compareStore';
import { SiteHeader } from '../src/features/layout/SiteHeader';
import { renderWithProviders } from './render';

beforeEach(() => compareStore.set([]));

describe('filterCubes', () => {
  it('keeps featured order and filters by brand/type/term', () => {
    expect(filterCubes(cubes, EMPTY_FILTERS)).toEqual(cubes);
    expect(filterCubes(cubes, { ...EMPTY_FILTERS, type: '4x4' }).map((c) => c.id)).toEqual(['mgc4']);
    expect(filterCubes(cubes, { ...EMPTY_FILTERS, brand: 'MoYu' }).map((c) => c.id)).toEqual(['rs3m-v5']);
    expect(filterCubes(cubes, { ...EMPTY_FILTERS, query: 'MAGLEV' }).length).toBeGreaterThan(0);
  });

  it('sorts by demo price', () => {
    const asc = filterCubes(cubes, { ...EMPTY_FILTERS, sort: 'asc' }).map((c) => c.price_fake);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = filterCubes(cubes, { ...EMPTY_FILTERS, sort: 'desc' }).map((c) => c.price_fake);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });
});

describe('CatalogPage', () => {
  it('reads type from the URL and ignores unknown values', () => {
    renderWithProviders(<CatalogPage query={new URLSearchParams('type=3x3&brand=<script>')} />);
    expect(screen.getByText('7 Rubik để khám phá')).toBeInTheDocument();
    expect(screen.getByLabelText('Thương hiệu')).toHaveValue('');
  });

  it('clears filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage query={new URLSearchParams('type=4x4')} />);
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByText(`${cubes.length} Rubik để khám phá`)).toBeInTheDocument();
  });

  it('allows at most 2 cubes in comparison and syncs the header counter', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SiteHeader currentPath="/catalog" />
        <CatalogPage query={new URLSearchParams()} />
      </>,
    );
    const buttons = screen.getAllByRole('button', { name: '＋ So sánh' });
    await user.click(buttons[0]!);
    await user.click(buttons[1]!);
    await user.click(buttons[2]!);
    expect(screen.getAllByRole('button', { name: '✓ Đã chọn' })).toHaveLength(2);
    expect(screen.getByText('Đã có 2 Rubik. Bỏ chọn một mẫu trước khi thêm mẫu khác.')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: 'Mở so sánh' })).getByText('2')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('sobik_compare')!)).toEqual([cubes[0]!.id, cubes[1]!.id]);

    await user.click(screen.getByRole('button', { name: 'Mở so sánh' }));
    expect(screen.getByRole('heading', { name: 'Khác nhau ở đâu?' })).toBeInTheDocument();
  });
});

describe('CubeDetailPage', () => {
  it('renders specs and the not-found state', () => {
    const { unmount } = renderWithProviders(<CubeDetailPage id="gan16" />);
    expect(screen.getByRole('heading', { level: 1, name: 'GAN16 MagLev MAX' })).toBeInTheDocument();
    expect(screen.getAllByText('64 g').length).toBeGreaterThan(0);
    expect(screen.getByText('Hai thế hệ, hai hệ từ trường.')).toBeInTheDocument();
    unmount();
    renderWithProviders(<CubeDetailPage id="nope" />);
    expect(screen.getByText('Không tìm thấy Rubik.')).toBeInTheDocument();
  });

  it('runs the demo checkout without collecting data', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    renderWithProviders(<CubeDetailPage id="gan12" />);
    await user.click(screen.getByRole('button', { name: 'Mua (Demo) ↗' }));
    const confirm = screen.getByRole('button', { name: 'Xác nhận đặt hàng (Demo)' });
    expect(document.querySelectorAll('#modal input')).toHaveLength(0);
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    expect(await screen.findByText('Đơn demo đã được xác nhận!', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
