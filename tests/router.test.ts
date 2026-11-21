import { describe, expect, it } from 'vitest';
import { matchPath, parseHash } from '../src/app/router';
import { resolveRoute } from '../src/app/routes';

describe('hash router', () => {
  it('parses path and query from the hash', () => {
    const loc = parseHash('#/guide?puzzle=4x4');
    expect(loc.path).toBe('/guide');
    expect(loc.query.get('puzzle')).toBe('4x4');
    expect(parseHash('').path).toBe('/');
    expect(parseHash('#').path).toBe('/');
  });

  it('matches params', () => {
    expect(matchPath('/cube/:id', '/cube/gan12')).toEqual({ id: 'gan12' });
    expect(matchPath('/cube/:id', '/catalog')).toBeNull();
    expect(matchPath('/', '/')).toEqual({});
  });

  it('resolves titles like the original site', () => {
    const title = (hash: string) => {
      const loc = parseHash(hash);
      const { route, params } = resolveRoute(loc.path);
      return route.title({ params, query: loc.query });
    };
    expect(title('#/')).toBe('SOBIK99 — Cube Club');
    expect(title('#/catalog')).toBe('Bộ sưu tập — SOBIK99');
    expect(title('#/cube/gan12')).toBe('GAN12 MagLev — SOBIK99');
    expect(title('#/cube/unknown')).toBe('Rubik — SOBIK99');
    expect(title('#/guide?puzzle=5x5')).toBe('Học cách xoay — SOBIK99');
    expect(title('#/timer')).toBe('Timer — SOBIK99');
    expect(title('#/sources')).toBe('Nguồn dữ liệu — SOBIK99');
    expect(title('#/nope')).toBe('Không tìm thấy trang — SOBIK99');
  });
});
