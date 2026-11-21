// @vitest-environment node
import { access, readFile } from 'node:fs/promises';
import { puzzles } from 'cubing/puzzles';
import { afterEach, describe, expect, it } from 'vitest';
import type { AlgorithmCase } from '../src/data/types';
import { cubeTimeline, netColors, solvedFaceCount } from '../src/features/landing/cubeEngine';
import { averageOf, effective, formatTime, statistics, type Penalty } from '../src/shared/lib/stats';
import { read, validHistory, write } from '../src/shared/lib/storage';

const solve = (ms: number, penalty: Penalty = 'none') => ({ ms, penalty });
const zero = (xs: number[]) => xs.map((x) => x || 0); // -0 → 0

describe('cube engine', () => {
  it('20 inverse turns restore every cubie position and orientation', () => {
    const t = cubeTimeline();
    expect(t.states[0]).not.toEqual(t.solved);
    t.sample(20).forEach((c, i) => {
      expect(zero(c.p)).toEqual(t.solved[i]!.p);
      expect(zero(c.m)).toEqual(t.solved[i]!.m);
    });
    for (const state of t.states) expect(new Set(state.map((c) => c.p.join(','))).size).toBe(26);
  });

  it('net shows 6 solved faces only at the end', () => {
    const t = cubeTimeline();
    expect(solvedFaceCount(netColors(t.states[20]!))).toBe(6);
    expect(solvedFaceCount(netColors(t.states[0]!))).toBeLessThan(6);
  });
});

describe('stats', () => {
  it('trimmed averages handle penalties, DNF and insufficient solves', () => {
    expect(
      averageOf(
        [10, 11, 12, 13, 14].map((x) => solve(x * 1000)),
        5,
      ),
    ).toBe(12000);
    expect(averageOf([solve(10000), solve(11000), solve(12000), solve(13000), solve(1, 'DNF')], 5)).toBe(12000);
    expect(averageOf([solve(1, 'DNF'), solve(2, 'DNF'), solve(3), solve(4), solve(5)], 5)).toBe(Infinity);
    expect(averageOf([], 12)).toBeNull();
    expect(effective(solve(1000, '+2'))).toBe(3000);
    expect(formatTime(61239)).toBe('01:01.23');
    expect(formatTime(null)).toBe('—');
    expect(formatTime(Infinity)).toBe('DNF');
    expect(statistics([]).best).toBeNull();
  });
});

describe('storage', () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('survives corrupted and unavailable storage', () => {
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: () => '{bad',
      setItem: () => {
        throw Error('quota');
      },
    };
    expect(read('x', [])).toEqual([]);
    expect(write('x', [])).toBe(false);
    expect(validHistory([{ ms: -1 }])).toBe(false);
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(read('x', [])).toEqual([]);
  });

  it('validates timer history shape', () => {
    const ok = { id: 'a', ms: 1000, scramble: 'R U', date: '2026-01-01T00:00:00.000Z', penalty: '+2' };
    expect(validHistory([ok])).toBe(true);
    expect(validHistory([{ ...ok, penalty: 'bogus' }])).toBe(false);
    expect(validHistory([null])).toBe(false);
    expect(validHistory({})).toBe(false);
  });
});

describe('CFOP data', () => {
  it('119 cases have renderable variants and consistent setup states', async () => {
    const cases = JSON.parse(
      await readFile(new URL('../src/data/algorithms.json', import.meta.url), 'utf8'),
    ) as AlgorithmCase[];
    for (const [type, n] of [
      ['f2l', 41],
      ['oll', 57],
      ['pll', 21],
    ] as const)
      expect(cases.filter((c) => c.type === type)).toHaveLength(n);
    const kp = await puzzles['3x3x3']!.kpuzzle();
    for (const c of cases) {
      expect(c.variants.length).toBeGreaterThanOrEqual(2);
      for (const v of c.variants) {
        await access(new URL('../public/' + v.image, import.meta.url));
        expect(kp.defaultPattern().applyAlg(v.setup).applyAlg(v.alg).isIdentical(kp.defaultPattern()), c.id).toBe(true);
      }
    }
  });
});
