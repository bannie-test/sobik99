import type { AlgorithmCase, CasePhase } from '../../data/types';

export const CASES_PER_PAGE = 12;

export interface CaseFilters {
  phase: CasePhase;
  term: string;
  group: string;
  onlyUnlearned: boolean;
}

/** Lọc case theo giai đoạn, nhóm, trạng thái đã học và từ khóa (tên, nhóm, công thức). */
export function filterCases(
  cases: readonly AlgorithmCase[],
  learned: readonly string[],
  { phase, term, group, onlyUnlearned }: CaseFilters,
): AlgorithmCase[] {
  const needle = term.trim().toLowerCase();
  return cases.filter(
    (c) =>
      c.type === phase &&
      (!group || c.group === group) &&
      (!onlyUnlearned || !learned.includes(c.id)) &&
      `${c.type} ${c.name} ${c.group} ${c.group_vi} ${c.moves.join(' ')}`.toLowerCase().includes(needle),
  );
}

/** Danh sách nhóm (giá trị = tên gốc, nhãn = tiếng Việt) theo thứ tự xuất hiện. */
export function groupsOf(cases: readonly AlgorithmCase[], phase: CasePhase): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const c of cases) if (c.type === phase && !seen.has(c.group)) seen.set(c.group, c.group_vi);
  return [...seen].map(([value, label]) => ({ value, label }));
}

/** Chia trang; tự kéo trang hiện tại về trang hợp lệ cuối cùng. */
export function paginate<T>(list: readonly T[], page: number, size = CASES_PER_PAGE) {
  const total = Math.ceil(list.length / size);
  const current = Math.min(page, Math.max(0, total - 1));
  return { total, page: current, items: list.slice(current * size, current * size + size) };
}
