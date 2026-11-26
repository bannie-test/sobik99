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

  it('resolves the catalog and newly added routes', () => {
    expect(resolveRoute('/catalog').route.title).toBe('Thư viện Rubik');
    expect(resolveRoute('/cube/gan/gan-17-magdrive').params).toEqual({ brand: 'gan', id: 'gan-17-magdrive' });
    expect(resolveRoute('/cube/gan17').params).toEqual({ id: 'gan17' });
    expect(resolveRoute('/solve').route.title).toBe('Giải Rubik');
    expect(resolveRoute('/workshop').route.title).toBe('Xưởng Rubik');
    expect(resolveRoute('/nope').route.path).toBe('*');
  });
});
