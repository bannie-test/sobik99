import { useCallback } from 'react';
import { useStore } from '../../shared/store/createStore';
import { useToast } from '../../shared/ui/Toast';
import { compareStore, toggleCompare } from './compareStore';

/** Danh sách id đang so sánh + hàm bật/tắt kèm thông báo cho người dùng. */
export function useCompare() {
  const ids = useStore(compareStore);
  const toast = useToast();
  const toggle = useCallback(
    (id: string) => {
      const { result, saved } = toggleCompare(id);
      if (result === 'full') toast('Đã có 2 Rubik. Bỏ chọn một mẫu trước khi thêm mẫu khác.');
      else if (!saved) toast('Không lưu được lựa chọn. Bạn vẫn có thể so sánh trong phiên này.');
    },
    [toast],
  );
  return { ids, toggle };
}
