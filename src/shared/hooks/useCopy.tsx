import { useCallback, useEffect, useRef } from 'react';
import { useModal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

function CopyFallback({ text }: { text: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.select(), []);
  return (
    <>
      <h2>Sao chép công thức</h2>
      <textarea ref={ref} readOnly aria-label="Công thức" defaultValue={text} />
    </>
  );
}

/** Sao chép vào clipboard; nếu trình duyệt chặn thì mở hộp thoại để người dùng tự chép. */
export function useCopy(): (text: string) => Promise<void> {
  const toast = useToast();
  const modal = useModal();
  return useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast('Đã sao chép công thức.');
      } catch {
        modal.open(<CopyFallback text={text} />);
      }
    },
    [toast, modal],
  );
}
