import { useLayoutEffect, useRef } from 'react';
import { bindUi } from '../../cube-tools/utils/ui.js';
import { useCopy } from '../hooks/useCopy';
import { t } from '../../cube-tools/utils/i18n.js';
import { useToast } from './Toast';

type Dispose = () => void;
type Mount = (root: HTMLDivElement, isCurrent: () => boolean) => void | Dispose | Promise<void | Dispose>;

/** Gives a cube renderer an isolated node and ties its resources to the React lifecycle. */
export function InteractiveView({ mount }: { mount: Mount }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current!;
    const view = document.createElement('div');
    root.replaceChildren(view);
    let current = true;
    let dispose: void | Dispose;
    const result = mount(view, () => current);
    if (result instanceof Promise) {
      void result.then((cleanup) => {
        if (current) dispose = cleanup;
        else cleanup?.();
      }).catch((error: unknown) => {
        console.error(error);
        if (current) view.textContent = t('Không tải được nội dung.', 'Could not load this content.');
      });
    } else {
      dispose = result;
    }
    return () => {
      current = false;
      dispose?.();
      view.remove();
    };
  }, [mount]);
  return <div ref={ref} />;
}

export function CubeToolsUi() {
  const toast = useToast();
  const copy = useCopy();
  useLayoutEffect(() => bindUi({ toast, copy }), [toast, copy]);
  return null;
}
