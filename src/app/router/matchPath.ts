export type RouteParams = Record<string, string>;

/**
 * So khớp đường dẫn với mẫu có tham số dạng ":id".
 * matchPath('/cube/:id', '/cube/gan12') → { id: 'gan12' }; không khớp → null.
 */
export function matchPath(pattern: string, path: string): RouteParams | null {
  const expected = pattern.split('/');
  const actual = path.split('/');
  if (expected.length !== actual.length) return null;
  const params: RouteParams = {};
  for (let i = 0; i < expected.length; i++) {
    const want = expected[i] as string;
    const got = actual[i] as string;
    if (want.startsWith(':')) params[want.slice(1)] = got;
    else if (want !== got) return null;
  }
  return params;
}
