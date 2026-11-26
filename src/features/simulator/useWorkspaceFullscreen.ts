import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';

export function useWorkspaceFullscreen(
  workspace: RefObject<HTMLDivElement | null>,
  stage: RefObject<HTMLDivElement | null>,
) {
  const [mode, setMode] = useState<'native' | 'expanded' | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const requesting = useRef(false);
  const exitRequested = useRef(false);
  const wasActive = useRef(false);
  const active = mode !== null;

  useEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const sync = () => {
      setMode((previous) => document.fullscreenElement === element ? 'native' : previous === 'native' ? null : previous);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {});
    };
  }, [workspace]);

  useLayoutEffect(() => {
    if (active) stage.current?.focus({ preventScroll: true });
    else if (wasActive.current) button.current?.focus({ preventScroll: true });
    wasActive.current = active;
  }, [active, stage]);

  useEffect(() => {
    if (mode !== 'expanded') return;
    document.body.classList.add('simulator-expanded');
    return () => document.body.classList.remove('simulator-expanded');
  }, [mode]);

  function exit() {
    exitRequested.current = true;
    if (document.fullscreenElement === workspace.current && workspace.current) {
      void document.exitFullscreen().catch(() => {});
    } else {
      setMode(null);
    }
  }

  async function toggle() {
    const element = workspace.current;
    if (!element || requesting.current) return;
    if (active || document.fullscreenElement === element) {
      exit();
      return;
    }
    exitRequested.current = false;

    requesting.current = true;
    try {
      if (document.fullscreenEnabled !== false && typeof element.requestFullscreen === 'function') {
        await element.requestFullscreen();
        if (exitRequested.current && document.fullscreenElement === element) exit();
        return;
      }
    } catch {
      // An embedded or unsupported browser can still expand within its own viewport.
    } finally {
      requesting.current = false;
    }
    if (element.isConnected && !exitRequested.current) setMode('expanded');
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (mode !== 'expanded') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      exit();
      return;
    }
    if (event.key !== 'Tab') return;

    const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, input, summary, [tabindex]'))
      .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey ? event.target === first : event.target === last) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }

  return { active, mode, button, toggle, exit, onKeyDown };
}
