import { neutralizeFormula, toCsv } from '../../shared/lib/csv';
import { effective, formatTime, type Solve } from '../../shared/lib/stats';

const HEADER = ['date', 'milliseconds', 'penalty', 'display_time', 'scramble'];

/** Nội dung CSV lịch sử giải. Ô văn bản tự do được chống formula injection. */
export function historyCsv(history: readonly Solve[]): string {
  return toCsv([
    HEADER,
    ...history.map((s) => [
      neutralizeFormula(s.date),
      s.ms,
      s.penalty,
      formatTime(effective(s)),
      neutralizeFormula(s.scramble),
    ]),
  ]);
}
