import type { HandSample } from './handGesture';

export type CameraWorkerRequest =
  | { type: 'start' }
  | { type: 'frame'; image: ImageBitmap; timestamp: number };

export type CameraWorkerResponse =
  | { type: 'ready' }
  | { type: 'sample'; sample: HandSample | null }
  | { type: 'error' };
