import { useSyncExternalStore } from 'react';

/**
 * Store tối giản (pattern "external store"): state sống ngoài component nên
 * vẫn còn khi chuyển trang — giống biến cấp module của bản cũ — và component
 * đọc qua useSyncExternalStore.
 */
export interface Store<S> {
  get(): S;
  set(next: S | ((prev: S) => S)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (prev: S) => S)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<S>(store: Store<S>): S {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
