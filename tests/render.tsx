import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ModalProvider } from '../src/shared/ui/Modal';
import { ToastProvider } from '../src/shared/ui/Toast';

export function renderWithProviders(ui: ReactNode) {
  return render(
    <ToastProvider>
      <ModalProvider>{ui}</ModalProvider>
    </ToastProvider>,
  );
}
