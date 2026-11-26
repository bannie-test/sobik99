import type { Face, FaceTurn } from './cubeView';

export type { FaceTurn } from './cubeView';
type Point = { x: number; y: number };
type Landmark = Point & { z: number };
export type HandSample = Point & { pinch: number };

export function sampleHand(landmarks: readonly Landmark[] | undefined, aspect: number): HandSample | null {
  const wrist = landmarks?.[0];
  const thumb = landmarks?.[4];
  const index = landmarks?.[8];
  const palm = landmarks?.[9];
  if (!wrist || !thumb || !index || !palm || !Number.isFinite(aspect) || aspect <= 0) return null;

  const distance = (a: Landmark, b: Landmark) =>
    Math.hypot((a.x - b.x) * aspect, a.y - b.y, (a.z - b.z) * aspect * 0.45);
  const size = distance(wrist, palm);
  const pinch = distance(thumb, index) / size;
  if (size < 0.035 || ![pinch, index.x, index.y].every(Number.isFinite)) return null;

  // The central 80% of the image covers the stage, so a hand can reach the edges.
  const map = (coordinate: number) => Math.min(1, Math.max(0, (coordinate - 0.1) / 0.8));
  return { x: map(1 - index.x), y: map(index.y), pinch };
}

export interface TurnDirection {
  move: Face;
  dx: number;
  dy: number;
}

export function matchTurn(directions: readonly TurnDirection[], dx: number, dy: number): FaceTurn | null {
  const length = Math.hypot(dx, dy);
  if (!length) return null;
  let best = 0;
  let runnerUp = 0;
  let move: FaceTurn | null = null;
  for (const direction of directions) {
    const alignment = (dx * direction.dx + dy * direction.dy) / length;
    const score = Math.abs(alignment);
    if (score > best) {
      runnerUp = best;
      best = score;
      move = alignment > 0 ? direction.move : `${direction.move}'`;
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }
  return best >= 0.78 && best - runnerUp >= 0.14 ? move : null;
}

export type GesturePhase = 'searching' | 'release' | 'pointing' | 'busy' | 'drag' | 'edge' | 'turn' | 'orbit';
export interface GestureUpdate {
  point: Point | null;
  phase: GesturePhase;
  preview?: FaceTurn;
  commit?: FaceTurn;
  orbit?: [number, number];
}

interface Grab {
  origin: Point;
  last: Point;
  directions: readonly TurnDirection[] | null;
  preview: FaceTurn | null;
  rotatingView: boolean;
}

const CLOSE_PINCH = 0.34;
const OPEN_PINCH = 0.49;

export function createPinchGesture() {
  let pointer: Point | null = null;
  let start: Point | null = null;
  let grab: Grab | null = null;
  let armed = false;
  let openFrames = 0;

  function clearGrip() {
    start = grab = null;
    armed = false;
    openFrames = 0;
  }

  return {
    reset() {
      clearGrip();
      pointer = null;
    },
    update(
      sample: HandSample | null,
      width: number,
      height: number,
      pick: (x: number, y: number) => readonly TurnDirection[] | null,
      enabled: boolean,
    ): GestureUpdate {
      if (!sample || width <= 0 || height <= 0) {
        clearGrip();
        pointer = null;
        return { point: null, phase: 'searching' };
      }

      const point = pointer ? {
        x: pointer.x + 0.58 * (sample.x - pointer.x),
        y: pointer.y + 0.58 * (sample.y - pointer.y),
      } : { x: sample.x, y: sample.y };
      pointer = point;
      if (!enabled) {
        clearGrip();
        return { point, phase: 'busy' };
      }

      const open = sample.pinch >= OPEN_PINCH;
      if (!armed) {
        openFrames = open ? openFrames + 1 : 0;
        if (openFrames >= 2) {
          armed = true;
          openFrames = 0;
        }
        return { point, phase: armed ? 'pointing' : 'release' };
      }

      if (!grab) {
        if (sample.pinch > CLOSE_PINCH) {
          start = null;
          return { point, phase: 'pointing' };
        }
        if (!start) {
          start = point;
          return { point, phase: 'pointing' };
        }
        grab = { origin: start, last: start, directions: pick(start.x, start.y), preview: null, rotatingView: false };
        start = null;
      }

      // Use the last closed frame for selection, since opening moves the index fingertip.
      if (open && ++openFrames >= 2) {
        const commit = grab.preview ?? undefined;
        grab = null;
        openFrames = 0;
        return { point, phase: 'pointing', commit };
      }
      if (!open) {
        openFrames = 0;
        const dx = (point.x - grab.origin.x) * width;
        const dy = (point.y - grab.origin.y) * height;
        if (grab.directions === null) {
          if (Math.hypot(dx, dy) >= 10) grab.rotatingView = true;
          if (grab.rotatingView) {
            const orbit: [number, number] = [(point.x - grab.last.x) * width, (point.y - grab.last.y) * height];
            grab.last = point;
            return { point, phase: 'orbit', orbit };
          }
        } else {
          const dragThreshold = Math.max(16, 0.045 * Math.min(width, height));
          grab.preview = Math.hypot(dx, dy) >= dragThreshold ? matchTurn(grab.directions, dx, dy) : null;
        }
      }

      if (grab.directions === null) return { point, phase: 'orbit' };
      if (!grab.directions.length) return { point, phase: 'edge' };
      if (grab.preview) return { point, phase: 'turn', preview: grab.preview };
      return { point, phase: 'drag' };
    },
  };
}
