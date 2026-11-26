import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import { Quaternion, Vector3 } from 'three';
import { expect, test } from 'vitest';
import { ORIENTATIONS } from '../src/cube-tools/core/cube.js';
import { parseMove } from '../src/cube-tools/components/player.js';
import { centerColors, invertView, remapMove, STANDARD_VIEW, viewFromCamera } from '../src/features/simulator/cubeView';
import { defaultShortcuts, formatMoveNotation, loadShortcuts, MOVE_ROWS, parseMoveList, SHORTCUTS_KEY } from '../src/features/simulator/shortcuts';

const pitch = (angle: number) => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle);
const yaw = (angle: number) => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angle);

test('chooses the front, top and sides from the camera pose', () => {
  expect(viewFromCamera(new Quaternion())).toEqual(STANDARD_VIEW);
  expect(viewFromCamera(pitch(-Math.PI / 2))).toEqual({
    F: 'U', B: 'D', U: 'B', D: 'F', L: 'L', R: 'R',
  });
  expect(viewFromCamera(pitch(Math.PI / 2))).toEqual({
    F: 'D', B: 'U', U: 'F', D: 'B', L: 'L', R: 'R',
  });
  expect(viewFromCamera(yaw(Math.PI / 2))).toMatchObject({ F: 'R', L: 'F', B: 'L', R: 'B' });
  const roll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
  expect(viewFromCamera(roll)).toMatchObject({ F: 'F', U: 'L', R: 'U' });
});

test('between two visible faces, uses the one on the right as F', () => {
  expect(viewFromCamera(yaw(Math.PI / 4)).F).toBe('R');
  expect(viewFromCamera(yaw(-Math.PI / 4)).F).toBe('F');
  expect(viewFromCamera(yaw(Math.PI / 4 - 0.01)).F).toBe('R');
  expect(viewFromCamera(yaw(Math.PI / 4 - 0.04)).F).toBe('F');
});

test('conjugates face, wide, slice, and whole-cube moves in all 24 orientations', async () => {
  const puzzle = await cube3x3x3.kpuzzle();
  expect(ORIENTATIONS).toHaveLength(24);
  for (const rotation of ORIENTATIONS) {
    const undo = new Alg(rotation).invert().toString();
    const view = invertView(centerColors(puzzle.defaultPattern().applyAlg(rotation)));
    for (const move of MOVE_ROWS.flat()) {
      const expected = puzzle.algToTransformation(`${undo} ${move} ${rotation}`);
      const mapped = remapMove(move, view);
      expect(puzzle.moveToTransformation(mapped).isIdentical(expected), `${rotation} maps ${move} to ${mapped}`).toBe(true);
      expect(remapMove(mapped, invertView(view))).toBe(move);
    }
  }
});

test('assigns distinct default keys to all moves and accepts both wide spellings', () => {
  const defaults = defaultShortcuts();
  expect(Object.keys(defaults)).toHaveLength(54);
  expect(new Set(Object.values(defaults)).size).toBe(54);
  expect(parseMoveList("wR wU' Rw2 r")).toEqual(['r', "u'", 'r2', 'r']);
  expect(formatMoveNotation("r u' r2")).toBe("wR wU' wR2");
});

test('fills a saved partial keymap without changing its custom bindings', () => {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify({ R: 'T', "L'": 'Shift+F' }));
  const shortcuts = loadShortcuts();
  expect(shortcuts).toMatchObject({ R: 'T', "L'": 'Shift+F' });
  expect(Object.keys(shortcuts)).toHaveLength(54);
  expect(new Set(Object.values(shortcuts)).size).toBe(54);
});

test('wR rotates the middle and right layers with the same sign as R', () => {
  const [wide] = parseMoveList('wR')!;
  const layers = [-1, 0, 1];
  const right = parseMove('R', 3, layers);
  expect(parseMove(wide!, 3, layers)).toEqual({ ...right, layers: [1, 0] });
  expect(parseMove('x', 3, layers).layers).toEqual(layers);
});
