import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';

export interface ModalApi {
  /** Mở (hoặc thay nội dung) hộp thoại. Nội dung cũ bị unmount → effect cleanup chạy. */
  open(content: ReactNode): void;
  close(): void;
  isOpen(): boolean;
}

const ModalContext = createContext<ModalApi | null>(null);

/** Một <dialog> dùng chung cho toàn app, giống #modal của bản cũ. */
export function ModalProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [entry, setEntry] = useState<{ key: number; content: ReactNode } | null>(null);

  const close = useCallback(() => dialogRef.current?.close(), []);
  const api = useMemo<ModalApi>(
    () => ({
      open: (content) => setEntry((prev) => ({ key: (prev?.key ?? 0) + 1, content })),
      close,
      isOpen: () => Boolean(dialogRef.current?.open),
    }),
    [close],
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!entry || !dialog) return;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }, [entry]);

  const handleClose = () => {
    setEntry(null);
    document.body.classList.remove('modal-open');
  };

  // Bấm ra vùng nền (backdrop) để đóng.
  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    const dialog = e.currentTarget;
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  };

  return (
    <ModalContext.Provider value={api}>
      {children}
      <dialog id="modal" ref={dialogRef} onClose={handleClose} onClick={handleClick}>
        <button className="close-modal" aria-label="Đóng hộp thoại" onClick={close}>
          ×
        </button>
        <div id="modal-content" key={entry?.key}>
          {entry?.content}
        </div>
      </dialog>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalApi {
  const api = useContext(ModalContext);
  if (!api) throw new Error('useModal phải nằm trong <ModalProvider>');
  return api;
}
