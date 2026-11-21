import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { historyCsv } from '../src/features/timer/exportCsv';
import * as timer from '../src/features/timer/timerStore';
import TimerPage from '../src/features/timer/TimerPage';
import type { Solve } from '../src/shared/lib/stats';
import { renderWithProviders } from './render';

const fakeLoader = (value: string) => () => Promise.resolve(value);

beforeEach(() => timer.resetTimerStore());

describe('timerStore', () => {
  it('generates, times and saves a solve', async () => {
    expect(await timer.generateScramble(fakeLoader("R U R' U'"))).toBe('ok');
    timer.toggleTimer(1000);
    expect(timer.timerStore.get().running).toBe(true);
    // Đang chạy thì không tạo scramble mới.
    expect(await timer.generateScramble(fakeLoader('X'))).toBe('skipped');
    timer.toggleTimer(13_450);
    const { pending } = timer.timerStore.get();
    expect(pending).toMatchObject({ ms: 12_450, scramble: "R U R' U'", penalty: 'none' });
    // Có kết quả chờ lưu → không bấm giờ tiếp được.
    timer.toggleTimer(20_000);
    expect(timer.timerStore.get().running).toBe(false);

    expect(timer.savePending()).toBe(true);
    expect(timer.timerStore.get().history).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('rubik_timer_history')!)).toHaveLength(1);
  });

  it('reports failed scrambles and shares concurrent generations', async () => {
    let calls = 0;
    const slow = () => new Promise<string>((r) => setTimeout(() => r(String(++calls)), 10));
    const [a, b] = await Promise.all([timer.generateScramble(slow), timer.generateScramble(slow)]);
    expect([a, b, calls]).toEqual(['ok', 'ok', 1]);
    expect(await timer.generateScramble(() => Promise.reject(new Error('x')))).toBe('failed');
    expect(timer.timerStore.get()).toMatchObject({ scramble: '', loading: false });
  });

  it('edits penalties, deletes and clears history', async () => {
    await timer.generateScramble(fakeLoader('R'));
    timer.toggleTimer(0);
    timer.toggleTimer(1000);
    timer.savePending();
    const id = timer.timerStore.get().history[0]!.id;
    timer.setPenalty(id, 'DNF');
    expect(timer.timerStore.get().history[0]!.penalty).toBe('DNF');
    timer.deleteSolve(id);
    expect(timer.timerStore.get().history).toEqual([]);
    timer.clearHistory();
    expect(localStorage.getItem('rubik_timer_history')).toBe('[]');
  });
});

describe('CSV export', () => {
  it('quotes values and neutralises spreadsheet formulas', () => {
    const solves: Solve[] = [
      { id: '1', ms: 12_345, scramble: '=HYPERLINK("http://evil")', date: '2026-01-01T00:00:00.000Z', penalty: '+2' },
    ];
    const csv = historyCsv(solves);
    expect(csv.startsWith('﻿"date","milliseconds"')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""http://evil"")"');
    expect(csv).toContain('"+2","00:14.34"');
  });
});

describe('TimerPage', () => {
  it('starts and stops with the Space key and saves the result', async () => {
    await timer.generateScramble(fakeLoader("R U R'"));
    renderWithProviders(<TimerPage />);
    expect(screen.getByText("R U R'")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    expect(screen.getByText('ĐANG CHẠY · SPACE HOẶC CHẠM ĐỂ DỪNG')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    expect(screen.getByText('Kết quả chưa lưu.')).toBeInTheDocument();

    // Space trong ô nhập liệu không điều khiển timer.
    const input = document.createElement('input');
    document.body.append(input);
    act(() => {
      fireEvent.keyDown(input, { code: 'Space' });
    });
    expect(screen.getByText('Kết quả chưa lưu.')).toBeInTheDocument();
    input.remove();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Lưu kết quả ↗' }));
    });
    expect(await screen.findByText('1 lần đã lưu · hiển thị tối đa 100 lần gần nhất')).toBeInTheDocument();
  });
});
