import type { CameraWorkerRequest, CameraWorkerResponse } from './handCameraProtocol';
import type { HandSample } from './handGesture';

export type CameraError = 'insecure' | 'unsupported' | 'permission' | 'unavailable' | 'tracking';
const FRAME_INTERVAL_MS = 1000 / 24;
const MAX_FRAME_AGE_MS = 300;

export function trackHand(
  video: HTMLVideoElement,
  signal: AbortSignal,
  callbacks: {
    ready: () => void;
    sample: (sample: HandSample | null) => void;
    failed: (error: CameraError) => void;
  },
) {
  if (!window.isSecureContext) return callbacks.failed('insecure');
  if (!navigator.mediaDevices?.getUserMedia || typeof Worker !== 'function' ||
      typeof OffscreenCanvas !== 'function' || typeof createImageBitmap !== 'function') {
    return callbacks.failed('unsupported');
  }
  if (signal.aborted) return;

  let stream: MediaStream | undefined;
  let worker: Worker | undefined;
  let stopped = false;
  let raf = 0;
  let startupTimeout = 0;
  let inFlight = false;
  let observed = false;
  let submittedAt = -Infinity;
  let lastObservation = -Infinity;
  let ignoreFramesBefore = -Infinity;
  let videoTime = -1;

  function trackingLost() {
    ignoreFramesBefore = performance.now();
    if (observed) {
      observed = false;
      callbacks.sample(null);
    }
  }

  function cleanup() {
    stopped = true;
    signal.removeEventListener('abort', cleanup);
    document.removeEventListener('visibilitychange', trackingLost);
    cancelAnimationFrame(raf);
    window.clearTimeout(startupTimeout);
    worker?.terminate();
    for (const track of stream?.getTracks() ?? []) {
      track.removeEventListener('ended', cameraEnded);
      track.stop();
    }
    if (stream && video.srcObject === stream) {
      video.pause();
      video.srcObject = null;
    }
  }

  function fail(error: CameraError) {
    if (stopped) return;
    cleanup();
    callbacks.failed(error);
  }

  const cameraEnded = () => fail('unavailable');

  function send(message: CameraWorkerRequest, transfer: Transferable[] = []) {
    worker?.postMessage(message, transfer);
  }

  function frame(now: number) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    if (observed && now - lastObservation > MAX_FRAME_AGE_MS) trackingLost();
    if (inFlight || now - submittedAt < FRAME_INTERVAL_MS ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === videoTime) return;

    inFlight = true;
    submittedAt = now;
    videoTime = video.currentTime;
    void createImageBitmap(video).then((image) => {
      if (stopped) {
        image.close();
        return;
      }
      try {
        send({ type: 'frame', image, timestamp: now }, [image]);
      } catch {
        image.close();
        fail('tracking');
      }
    }).catch(() => fail('tracking'));
  }

  signal.addEventListener('abort', cleanup, { once: true });
  document.addEventListener('visibilitychange', trackingLost);
  void (async () => {
    try {
      const opened = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      });
      if (stopped) {
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = opened;
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', cameraEnded));
      video.srcObject = stream;
      await video.play();
    } catch (error) {
      const denied = error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      fail(denied ? 'permission' : 'unavailable');
      return;
    }
    if (stopped) return;

    try {
      worker = new Worker(new URL('./handCamera.worker.ts', import.meta.url), { type: 'module' });
      worker.onerror = () => fail('tracking');
      worker.onmessageerror = () => fail('tracking');
      worker.onmessage = ({ data }: MessageEvent<CameraWorkerResponse>) => {
        if (stopped) return;
        if (data.type === 'error') {
          fail('tracking');
        } else if (data.type === 'ready') {
          window.clearTimeout(startupTimeout);
          callbacks.ready();
          raf = requestAnimationFrame(frame);
        } else {
          inFlight = false;
          const now = performance.now();
          if (document.hidden || now - submittedAt > MAX_FRAME_AGE_MS || submittedAt < ignoreFramesBefore) {
            trackingLost();
            return;
          }
          lastObservation = now;
          observed = data.sample !== null;
          callbacks.sample(data.sample);
        }
      };
      startupTimeout = window.setTimeout(() => fail('tracking'), 60_000);
      send({ type: 'start' });
    } catch {
      fail('tracking');
    }
  })();
}
