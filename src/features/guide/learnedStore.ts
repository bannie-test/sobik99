import { isStringArray, read, STORAGE_KEYS, write } from '../../shared/lib/storage';
import { createStore } from '../../shared/store/createStore';

export const learnedStore = createStore<string[]>(read(STORAGE_KEYS.learned, [], isStringArray));

/** Đánh dấu / bỏ đánh dấu một case đã học. Trả false nếu không lưu được. */
export function toggleLearned(id: string): boolean {
  learnedStore.set((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  return write(STORAGE_KEYS.learned, learnedStore.get());
}
