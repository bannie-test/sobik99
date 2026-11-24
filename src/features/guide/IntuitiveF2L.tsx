import { useCallback } from 'react';
import { intuitiveF2L } from '../../cube-tools/data/f2l-intuitive.js';
import { cases } from '../../data/algorithms';
import { InteractiveView } from '../../shared/ui/InteractiveView';
import { usePlayCase } from './AlgorithmPlayer';

export function IntuitiveF2L({ compact }: { compact: boolean }) {
  const play = usePlayCase();
  const mount = useCallback((root: HTMLDivElement) => {
    root.innerHTML = intuitiveF2L('f2l-intuitive-tab', compact);
    const panel = root.querySelector<HTMLElement>('#f2l-intuitive');
    if (panel) panel.hidden = false;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const id = event.target.closest<HTMLButtonElement>('[data-f2l-demo]')?.dataset.f2lDemo;
      const item = cases.find((entry) => entry.id === id);
      if (item) play([item], 0);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [compact, play]);
  return <InteractiveView mount={mount} />;
}
