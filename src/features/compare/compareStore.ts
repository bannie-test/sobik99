import { cubes } from '../../data/cubes';
import { read, STORAGE_KEYS, write } from '../../shared/lib/storage';
import { createStore } from '../../shared/store/createStore';

export const MAX_COMPARE = 2;

const knownIds = new Set(cubes.map((c) => c.id));
const isValid = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= MAX_COMPARE && v.every((id) => typeof id === 'string' && knownIds.has(id));

export const compareStore = createStore<string[]>(read(STORAGE_KEYS.compare, [], isValid));

export type ToggleResult = 'added' | 'removed' | 'full';

/**
 * Thêm/bỏ một mẫu khỏi danh sách so sánh (tối đa 2).
 * `saved` = false khi không ghi được vào localStorage.
 */
export function toggleCompare(id: string): { result: ToggleResult; saved: boolean } {
  const current = compareStore.get();
  let result: ToggleResult;
  if (current.includes(id)) {
    compareStore.set(current.filter((x) => x !== id));
    result = 'removed';
  } else if (current.length < MAX_COMPARE) {
    compareStore.set([...current, id]);
    result = 'added';
  } else {
    return { result: 'full', saved: true };
  }
  return { result, saved: write(STORAGE_KEYS.compare, compareStore.get()) };
}
