import { useCompare } from './useCompare';

/** Nút "＋ So sánh" / "✓ Đã chọn" — trạng thái đồng bộ ở mọi nơi qua compareStore. */
export function CompareButton({ id, className }: { id: string; className: string }) {
  const { ids, toggle } = useCompare();
  const selected = ids.includes(id);
  return (
    <button className={className} aria-pressed={selected} onClick={() => toggle(id)}>
      {selected ? '✓ Đã chọn' : '＋ So sánh'}
    </button>
  );
}
