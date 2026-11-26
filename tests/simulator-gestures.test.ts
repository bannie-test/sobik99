import { Group, PerspectiveCamera, Vector3 } from 'three';
import { expect, test } from 'vitest';
import { createCubeGesture } from '../src/cube-tools/components/cube-gesture.js';
import { createPinchGesture, matchTurn, sampleHand, type TurnDirection } from '../src/features/simulator/handGesture';

test('projects clockwise drag directions for all six faces', () => {
  const size = 400;
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  const spins = { L: 1, R: -1, D: 1, U: -1, B: 1, F: -1 };
  const guide = createCubeGesture(camera, new Group(), (move: keyof typeof spins) => ({ angle: spins[move] }));

  const moves = [
    { move: 'R', tile: [1, 0, 1.5], drag: [0, -40] },
    { move: 'L', tile: [-1, 0, 1.5], drag: [0, 40] },
    { move: 'U', tile: [0, 1, 1.5], drag: [-40, 0] },
    { move: 'D', tile: [0, -1, 1.5], drag: [40, 0] },
    { move: 'F', tile: [0, 1.5, 1], drag: [40, 0] },
    { move: 'B', tile: [0, 1.5, -1], drag: [-40, 0] },
  ] as const;
  for (const { move, tile, drag: [dx, dy] } of moves) {
    camera.position.set(0, tile[1] === 1.5 ? 9 : 0, tile[1] === 1.5 ? 0 : 9);
    camera.up.set(0, tile[1] === 1.5 ? 0 : 1, tile[1] === 1.5 ? -1 : 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const ndc = new Vector3(...tile).project(camera);
    const directions = guide.pick((ndc.x + 1) / 2, (1 - ndc.y) / 2, size, size);
    expect(directions).not.toBeNull();
    expect(matchTurn(directions!, dx, dy)).toBe(move);
    expect(matchTurn(directions!, -dx, -dy)).toBe(`${move}'`);
  }
  expect(guide.pick(0.02, 0.02, size, size)).toBeNull();
  guide.dispose();
});

test('pinch release commits once and a tracking loss cancels the next turn', () => {
  const gesture = createPinchGesture();
  const directions: TurnDirection[] = [{ move: 'R', dx: 0, dy: -1 }];
  const origin = { x: 0.62, y: 0.55, pinch: 0.65 };
  const closed = { ...origin, pinch: 0.15 };
  const dragged = { ...closed, y: 0.30 };
  const opened = { ...dragged, pinch: 0.7 };
  const update = (sample: typeof origin | null) => gesture.update(sample, 400, 320, () => directions, true);

  update(origin);
  update(origin);
  update(closed);
  update(closed);
  expect(update(dragged)).toMatchObject({ phase: 'turn', preview: 'R' });
  expect(update(opened).commit).toBeUndefined();
  expect(update(opened).commit).toBe('R');
  expect(update(opened).commit).toBeUndefined();

  update(closed);
  update(closed);
  expect(update(dragged).preview).toBe('R');
  expect(update(null).phase).toBe('searching');
  expect(update(dragged).phase).toBe('release');
  update(opened);
  expect(update(opened).commit).toBeUndefined();
});

test('rejects diagonal ambiguity and background drags orbit without turns', () => {
  expect(matchTurn([{ move: 'R', dx: 0, dy: -1 }, { move: 'U', dx: -1, dy: 0 }], -40, -40)).toBeNull();
  const gesture = createPinchGesture();
  const update = (x: number, pinch: number) => gesture.update({ x, y: 0.6, pinch }, 400, 400, () => null, true);
  update(0.2, 0.7);
  update(0.2, 0.7);
  update(0.2, 0.2);
  update(0.2, 0.2);
  expect(update(0.36, 0.2)).toMatchObject({ phase: 'orbit', orbit: [expect.any(Number), 0] });
  update(0.36, 0.7);
  expect(update(0.36, 0.7).commit).toBeUndefined();
});

test('mirrors the pointer and normalizes pinch distance against hand size', () => {
  const hand = Array.from({ length: 21 }, () => ({ x: 0.3, y: 0.4, z: 0 }));
  hand[0] = { x: 0.3, y: 0.6, z: 0 };
  hand[9] = { x: 0.3, y: 0.42, z: 0 };
  hand[4] = { x: 0.32, y: 0.4, z: 0 };
  const sample = sampleHand(hand, 4 / 3);
  expect(sample?.x).toBeCloseTo(0.75);
  expect(sample?.pinch).toBeCloseTo(0.148);
  expect(sampleHand(undefined, 4 / 3)).toBeNull();
});
