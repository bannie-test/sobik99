import type { KPattern } from 'cubing/kpuzzle';
import { Vector3, type Quaternion } from 'three';
import type { CubeMove } from './shortcuts';

// Cubing.js orders the 3×3 center orbit U, L, F, R, B, D.
export const FACES = ['U', 'L', 'F', 'R', 'B', 'D'] as const;
export type Face = (typeof FACES)[number];
export type FaceTurn = Face | `${Face}'`;
export type FaceMap = Readonly<Record<Face, Face>>;

export const STANDARD_VIEW: FaceMap = { F: 'F', B: 'B', U: 'U', D: 'D', R: 'R', L: 'L' };
const OPPOSITE: FaceMap = { F: 'B', B: 'F', U: 'D', D: 'U', R: 'L', L: 'R' };
const NORMALS: Record<Face, Vector3> = {
  R: new Vector3(1, 0, 0),
  L: new Vector3(-1, 0, 0),
  U: new Vector3(0, 1, 0),
  D: new Vector3(0, -1, 0),
  F: new Vector3(0, 0, 1),
  B: new Vector3(0, 0, -1),
};

// A narrow band around the diagonal makes the right-face tie break usable when dragging.
const DIAGONAL_TOLERANCE = 0.02;

export function viewFromCamera(quaternion: Quaternion): FaceMap {
  const eye = new Vector3(0, 0, 1).applyQuaternion(quaternion);
  const cameraRight = new Vector3(1, 0, 0).applyQuaternion(quaternion);
  const cameraUp = new Vector3(0, 1, 0).applyQuaternion(quaternion);

  const towardViewer = (face: Face) => NORMALS[face].dot(eye);
  const best = Math.max(...FACES.map(towardViewer));
  const front = FACES.filter((face) => best - towardViewer(face) <= DIAGONAL_TOLERANCE)
    .sort((a, b) => {
      const across = NORMALS[b].dot(cameraRight) - NORMALS[a].dot(cameraRight);
      return Math.abs(across) > 1e-6 ? across : towardViewer(b) - towardViewer(a);
    })[0]!;

  const up = FACES.filter((face) => face !== front && face !== OPPOSITE[front])
    .sort((a, b) => NORMALS[b].dot(cameraUp) - NORMALS[a].dot(cameraUp))[0]!;
  const rightVector = NORMALS[up].clone().cross(NORMALS[front]);
  const right = FACES.find((face) => rightVector.equals(NORMALS[face]))!;

  return { F: front, B: OPPOSITE[front], U: up, D: OPPOSITE[up], R: right, L: OPPOSITE[right] };
}

export function invertView(view: FaceMap): FaceMap {
  return Object.fromEntries(FACES.map((face) => [view[face], face])) as FaceMap;
}

const SLICE_DIRECTION = { M: 'L', E: 'D', S: 'F' } as const;
const ROTATION_DIRECTION = { x: 'R', y: 'U', z: 'F' } as const;
const SLICE_FOR_FACE = { L: 'M', R: 'M', D: 'E', U: 'E', F: 'S', B: 'S' } as const;
const ROTATION_FOR_FACE = { L: 'x', R: 'x', D: 'y', U: 'y', F: 'z', B: 'z' } as const;

export function remapMove(move: FaceTurn, view: FaceMap): FaceTurn;
export function remapMove(move: CubeMove, view: FaceMap): CubeMove;
export function remapMove(move: CubeMove, view: FaceMap): CubeMove {
  const base = move[0]!;
  const suffix = move.slice(1);
  const outer = base.toUpperCase() as Face;
  if (FACES.includes(outer)) {
    const face = view[outer];
    return `${base === outer ? face : face.toLowerCase()}${suffix}` as CubeMove;
  }

  function withDirection(letter: string, toward: Face, positive: Face): CubeMove {
    const amount = toward === positive || suffix === '2' ? suffix : suffix === "'" ? '' : "'";
    return `${letter}${amount}` as CubeMove;
  }

  if (base === 'M' || base === 'E' || base === 'S') {
    const toward = view[SLICE_DIRECTION[base]];
    const slice = SLICE_FOR_FACE[toward];
    return withDirection(slice, toward, SLICE_DIRECTION[slice]);
  }
  const toward = view[ROTATION_DIRECTION[base as keyof typeof ROTATION_DIRECTION]];
  const rotation = ROTATION_FOR_FACE[toward];
  return withDirection(rotation, toward, ROTATION_DIRECTION[rotation]);
}

export function centerColors(pattern: KPattern): FaceMap {
  const positions = pattern.patternData.CENTERS!.pieces;
  return Object.fromEntries(FACES.map((face, i) => [face, FACES[positions[i]!]!])) as FaceMap;
}
