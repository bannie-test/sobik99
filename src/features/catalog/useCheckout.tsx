import { useCallback } from 'react';
import { findCube } from '../../data/cubes';
import { useModal } from '../../shared/ui/Modal';
import { CheckoutDialog } from './CheckoutDialog';

/** Mở hộp thoại đặt hàng mô phỏng cho một mẫu. */
export function useCheckout(): (id: string) => void {
  const modal = useModal();
  return useCallback(
    (id: string) => {
      const cube = findCube(id);
      if (cube) modal.open(<CheckoutDialog cube={cube} />);
    },
    [modal],
  );
}
