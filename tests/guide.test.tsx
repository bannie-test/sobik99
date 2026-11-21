import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { cases } from '../src/data/algorithms';
import { puzzleId } from '../src/features/guide/AlgorithmPlayer';
import { filterCases, groupsOf, paginate } from '../src/features/guide/filterCases';
import GuidePage from '../src/features/guide/GuidePage';
import { learnedStore } from '../src/features/guide/learnedStore';
import { renderWithProviders } from './render';

beforeEach(() => learnedStore.set([]));

describe('case filtering', () => {
  it('filters by phase, term, group and learned state', () => {
    const base = { phase: 'oll' as const, term: '', group: '', onlyUnlearned: false };
    expect(filterCases(cases, [], base)).toHaveLength(57);
    expect(filterCases(cases, [], { ...base, term: 'OLL 27' }).map((c) => c.id)).toContain('oll-27');
    const [first] = groupsOf(cases, 'oll');
    expect(filterCases(cases, [], { ...base, group: first!.value }).every((c) => c.group === first!.value)).toBe(true);
    expect(filterCases(cases, ['oll-1'], { ...base, onlyUnlearned: true })).toHaveLength(56);
  });

  it('paginates 12 per page and clamps the page', () => {
    const list = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(list, 0)).toMatchObject({ total: 3, page: 0 });
    expect(paginate(list, 9)).toMatchObject({ total: 3, page: 2, items: [24] });
    expect(paginate([], 3)).toMatchObject({ total: 0, page: 0, items: [] });
  });

  it('maps puzzle names to cubing.js ids', () => {
    expect(puzzleId('3x3')).toBe('3x3x3');
    expect(puzzleId('Megaminx')).toBe('megaminx');
  });
});

describe('GuidePage', () => {
  it('falls back to 3x3 for unknown or prototype puzzle names', () => {
    renderWithProviders(<GuidePage query={new URLSearchParams('puzzle=constructor')} />);
    expect(screen.getByText('CUBE SCHOOL / 3x3')).toBeInTheDocument();
  });

  it('shows practice algorithms for non-3x3 puzzles', () => {
    renderWithProviders(<GuidePage query={new URLSearchParams('puzzle=4x4')} />);
    expect(screen.getByText('OLL parity · một cặp cạnh lật tại UF')).toBeInTheDocument();
    expect(screen.queryByText('119 CASE')).not.toBeInTheDocument();
  });

  it('switches phases, paginates and persists learned cases', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuidePage query={new URLSearchParams()} />);
    expect(
      screen.getByText('Cross là bài toán lập kế hoạch, không phải danh sách công thức cố định.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OLL · 57' }));
    expect(screen.getByText('57 case · 0 đã đánh dấu học')).toBeInTheDocument();
    expect(screen.getByText('Trang 1 / 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tiếp →' }));
    expect(screen.getByText('Trang 2 / 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đánh dấu đã học oll-13' }));
    expect(screen.getByText('57 case · 1 đã đánh dấu học')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('sobik_learned')!)).toEqual(['oll-13']);

    await user.click(screen.getByLabelText('Chưa đánh dấu đã học'));
    expect(screen.getByText('56 case · 1 đã đánh dấu học')).toBeInTheDocument();
    expect(screen.getByText('Trang 1 / 5')).toBeInTheDocument();
  });

  it('changes the image and formula when another variant is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuidePage query={new URLSearchParams()} />);
    await user.click(screen.getByRole('button', { name: 'PLL · 21' }));
    const pll = cases.find((c) => c.type === 'pll')!;
    const select = screen.getAllByLabelText('Cách giải')[0]!;
    await user.selectOptions(select, '1');
    const card = select.closest('article')!;
    expect(card.querySelector('code')).toHaveTextContent(pll.variants[1]!.alg);
    expect(card.querySelector('img')!.getAttribute('src')).toContain(pll.variants[1]!.image);
  });
});
