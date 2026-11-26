import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const TOAST_DURATION_MS = 3200;

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Thông báo ngắn, dùng chung toàn app (vùng aria-live). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback<ShowToast>((text) => {
    setMessage(text);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast" role="status" aria-live="polite" className={visible ? 'show' : undefined}>
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = (): ShowToast => useContext(ToastContext);
