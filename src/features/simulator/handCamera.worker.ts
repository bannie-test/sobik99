import { HandLandmarker } from '@mediapipe/tasks-vision';
import wasmLoader from '@mediapipe/tasks-vision/vision_wasm_module_internal.js?url&no-inline';
import wasmBinary from '@mediapipe/tasks-vision/vision_wasm_module_internal.wasm?url&no-inline';
import model from './assets/hand_landmarker.task?url&no-inline';
import type { CameraWorkerRequest, CameraWorkerResponse } from './handCameraProtocol';
import { sampleHand } from './handGesture';

let landmarker: HandLandmarker | undefined;
const report = (message: CameraWorkerResponse) => self.postMessage(message);
const absolute = (url: string) => new URL(url, self.location.href).href;

self.addEventListener('message', async (event: MessageEvent<CameraWorkerRequest>) => {
  const message = event.data;
  if (message.type === 'start') {
    try {
      landmarker = await HandLandmarker.createFromOptions({
        wasmLoaderPath: absolute(wasmLoader),
        wasmBinaryPath: absolute(wasmBinary),
      }, {
        baseOptions: { modelAssetPath: absolute(model), delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
      report({ type: 'ready' });
    } catch (error) {
      console.error('Hand Landmarker initialization failed', error);
      report({ type: 'error' });
    }
    return;
  }
  const { image, timestamp } = message;
  try {
    const result = landmarker?.detectForVideo(image, timestamp);
    report({ type: 'sample', sample: sampleHand(result?.landmarks[0], image.width / image.height) });
  } catch (error) {
    console.error('Hand tracking failed', error);
    report({ type: 'error' });
  } finally {
    image.close();
  }
});
