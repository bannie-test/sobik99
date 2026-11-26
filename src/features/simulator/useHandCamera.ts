import { useEffect, useRef, useState, type RefObject } from 'react';
import type { createCube } from '../../cube-tools/components/player.js';
import { invertView, remapMove, type FaceMap } from './cubeView';
import { trackHand, type CameraError } from './handCamera';
import { createPinchGesture, type FaceTurn, type GesturePhase } from './handGesture';

type CameraState = 'off' | 'starting' | 'on' | CameraError;
type Feedback = { phase: GesturePhase; preview?: FaceTurn };
type GestureRuntime = {
  scene: ReturnType<typeof createCube>;
  view: FaceMap;
  pending: number;
  scrambleLoading: boolean;
  gestureRevision: number;
};

export function useHandCamera(
  stage: RefObject<HTMLDivElement | null>,
  game: RefObject<GestureRuntime | null>,
  onTurn: (move: FaceTurn) => void,
) {
  const video = useRef<HTMLVideoElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const controller = useRef<AbortController>(null);
  const [state, setState] = useState<CameraState>('off');
  const [feedback, setFeedback] = useState<Feedback>({ phase: 'searching' });

  useEffect(() => () => controller.current?.abort(), []);

  function clearGuide() {
    if (cursor.current) cursor.current.hidden = true;
    game.current?.scene.gesture?.preview(null);
  }

  function stop() {
    controller.current?.abort();
    controller.current = null;
    clearGuide();
    setState('off');
    setFeedback({ phase: 'searching' });
  }

  function start() {
    if (!video.current || controller.current) return;
    const session = new AbortController();
    controller.current = session;
    setState('starting');
    const gesture = createPinchGesture();
    let lastRevision = -1;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastFeedback: Feedback = { phase: 'searching' };
    trackHand(video.current, session.signal, {
      ready: () => setState('on'),
      failed: (error) => {
        controller.current = null;
        clearGuide();
        setState(error);
        setFeedback({ phase: 'searching' });
      },
      sample: (sample) => {
        const runtime = game.current;
        const canvas = stage.current;
        const marker = cursor.current;
        const guide = runtime?.scene.gesture;
        if (!runtime || !canvas || !marker || !guide) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (runtime.gestureRevision !== lastRevision || width !== lastWidth || height !== lastHeight) {
          gesture.reset();
          lastRevision = runtime.gestureRevision;
          lastWidth = width;
          lastHeight = height;
        }
        const result = gesture.update(sample, width, height,
          (x, y) => guide.pick(x, y, width, height),
          runtime.pending === 0 && !runtime.scrambleLoading,
        );
        marker.hidden = !result.point;
        if (result.point) {
          marker.style.left = `${result.point.x * 100}%`;
          marker.style.top = `${result.point.y * 100}%`;
          marker.dataset.phase = result.phase;
        }
        const preview = result.preview ? remapMove(result.preview, invertView(runtime.view)) : undefined;
        if (result.phase !== lastFeedback.phase || preview !== lastFeedback.preview) {
          guide.preview(result.preview ?? null);
          lastFeedback = { phase: result.phase, preview };
          setFeedback(lastFeedback);
        }
        if (result.orbit) runtime.scene.orbit(...result.orbit);
        if (result.commit) onTurn(result.commit);
      },
    });
  }

  return { state, feedback, video, cursor, start, stop };
}
