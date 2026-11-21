import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ModalProvider } from './shared/ui/Modal';
import { ToastProvider } from './shared/ui/Toast';
import './styles/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Thiếu phần tử #root');

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </ToastProvider>
  </StrictMode>,
);
