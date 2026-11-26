import { useMemo, useSyncExternalStore } from 'react';

export interface HashLocation {
  /** Chuỗi hash đầy đủ, ví dụ "#/catalog?type=3x3" — dùng làm key để remount trang. */
  hash: string;
  /** Phần đường dẫn, ví dụ "/catalog". */
  path: string;
  query: URLSearchParams;
}

/** "#/guide?puzzle=4x4" → { path: "/guide", query: puzzle=4x4 } */
export function parseHash(hash: string): HashLocation {
  const [path = '/', query = ''] = (hash.slice(1) || '/').split('?');
  return { hash, path, query: new URLSearchParams(query) };
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const getHash = () => window.location.hash;

/** Hash routing giúp website tĩnh chạy được ở mọi thư mục con mà không cần cấu hình server. */
export function useHashLocation(): HashLocation {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return useMemo(() => parseHash(hash), [hash]);
}
