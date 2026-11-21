import { useCallback, useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Theo cài đặt hệ điều hành, cho phép người dùng bật/tắt thủ công. */
export function useReducedMotion(): [boolean, () => void] {
  const [reduced, setReduced] = useState(() => matchMedia(QUERY).matches);
  useEffect(() => {
    const media = matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  const toggle = useCallback(() => setReduced((r) => !r), []);
  return [reduced, toggle];
}
