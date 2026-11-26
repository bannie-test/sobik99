import { useEffect, useRef, useState, type RefObject } from 'react';
import type { KPattern } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { createCube } from '../../cube-tools/components/player.js';
import { randomScramble3x3 } from '../../cube-tools/core/cubing-search.js';
import { centerColors, invertView, remapMove, STANDARD_VIEW, viewFromCamera, type FaceMap } from './cubeView';
import { parseMoveList, type CubeMove } from './shortcuts';
import type { CompletedSolve, RecordedTurn, TurnSource } from './solveHistory';

type Attempt = { scramble: CubeMove[]; startedAt: number | null; turns: RecordedTurn[] };
type Runtime = {
  scene: ReturnType<typeof createCube>;
  initial: KPattern;
  pattern: KPattern;
  view: FaceMap;
  attempt: Attempt | null;
  tail: Promise<void>;
  pending: number;
  revision: number;
  gestureRevision: number;
  scrambleRequest: number;
  scrambleLoading: boolean;
};

const isSolved = (pattern: KPattern) => pattern.experimentalIsSolved({
  ignorePuzzleOrientation: true,
  ignoreCenterOrientation: true,
});

function invalidateGesture(runtime: Runtime) {
  runtime.gestureRevision++;
  runtime.scene.gesture?.preview(null);
}

export function useCubeSession(
  stage: RefObject<HTMLDivElement | null>,
  onCompleted: (solve: CompletedSolve) => void,
) {
  const game = useRef<Runtime>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scrambleStatus, setScrambleStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [scramble, setScramble] = useState<CubeMove[]>([]);
  const [moves, setMoves] = useState<CubeMove[]>([]);
  const [view, setView] = useState(STANDARD_VIEW);
  const [centers, setCenters] = useState(STANDARD_VIEW);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<CompletedSolve | null>(null);

  useEffect(() => {
    let current = true;
    void cube3x3x3.kpuzzle().then((puzzle) => {
      if (!current || !stage.current) return;
      const initial = puzzle.defaultPattern();
      let lastView = STANDARD_VIEW;
      const scene = createCube(stage.current, 3, {
        gesture: true,
        onViewChange(orientation) {
          const next = viewFromCamera(orientation);
          if (next.F === lastView.F && next.U === lastView.U) return;
          lastView = next;
          if (game.current) game.current.view = next;
          setView(next);
        },
      });
      game.current = {
        scene, initial, pattern: initial, view: lastView, attempt: null,
        tail: Promise.resolve(), pending: 0, revision: 0, gestureRevision: 0, scrambleRequest: 0, scrambleLoading: false,
      };
      setStatus('ready');
    }).catch((error: unknown) => {
      if (!current) return;
      console.error('Could not initialize simulator', error);
      setStatus('error');
    });
    return () => {
      current = false;
      if (game.current) {
        game.current.revision++;
        game.current.scene.dispose();
        game.current = null;
      }
    };
  }, [stage]);

  function updatePattern(runtime: Runtime, next: KPattern) {
    const previousCenters = runtime.pattern.patternData.CENTERS!.pieces;
    runtime.pattern = next;
    if (next.patternData.CENTERS!.pieces.some((piece, i) => piece !== previousCenters[i])) {
      setCenters(centerColors(next));
    }
  }

  function resetTo(runtime: Runtime, turns: CubeMove[], pattern: KPattern) {
    runtime.revision++;
    runtime.pending = 0;
    runtime.tail = Promise.resolve();
    invalidateGesture(runtime);
    runtime.scene.reset();
    for (const move of turns) void runtime.scene.rotate(move);
    updatePattern(runtime, pattern);
    runtime.attempt = turns.length ? { scramble: turns, startedAt: null, turns: [] } : null;
    setScramble(turns);
    setMoves([]);
    setStartedAt(null);
    setResult(null);
  }

  function reset() {
    const runtime = game.current;
    if (!runtime) return;
    runtime.scrambleRequest++;
    runtime.scrambleLoading = false;
    setScrambleStatus('idle');
    resetTo(runtime, [], runtime.initial);
  }

  async function newScramble() {
    const runtime = game.current;
    if (!runtime || runtime.scrambleLoading) return;
    const request = ++runtime.scrambleRequest;
    const isCurrent = () => game.current === runtime && request === runtime.scrambleRequest;
    runtime.scrambleLoading = true;
    invalidateGesture(runtime);
    setScrambleStatus('loading');
    try {
      const text = await randomScramble3x3();
      if (!isCurrent()) return;
      const turns = parseMoveList(text);
      if (!turns) throw new Error('Invalid scramble');
      const pattern = runtime.initial.applyAlg(turns.join(' '));
      if (isSolved(pattern)) throw new Error('Scramble produced a solved cube');
      resetTo(runtime, turns, pattern);
      setScrambleStatus('idle');
      stage.current?.focus({ preventScroll: true });
    } catch {
      if (isCurrent()) setScrambleStatus('error');
    } finally {
      if (isCurrent()) runtime.scrambleLoading = false;
    }
  }

  function enqueue(turns: readonly CubeMove[], source: TurnSource): boolean {
    const runtime = game.current;
    if (!runtime || runtime.scrambleLoading || turns.length === 0) return false;
    const revision = runtime.revision;
    const acceptedAt = performance.now();
    // A queued command keeps the axes it had when submitted.
    const inputView = runtime.view;
    const inverse = source === 'camera' ? invertView(inputView) : null;
    const commands = turns.map((turn) => inverse
      ? { move: turn, viewMove: remapMove(turn, inverse) }
      : { move: remapMove(turn, inputView), viewMove: turn });
    runtime.pending++;
    invalidateGesture(runtime);
    if (runtime.attempt && runtime.attempt.startedAt === null) {
      runtime.attempt.startedAt = acceptedAt;
      setStartedAt(acceptedAt);
    }

    runtime.tail = runtime.tail.then(async () => {
      const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const { move, viewMove } of commands) {
        if (revision !== runtime.revision) return;
        const next = runtime.pattern.applyMove(move);
        if (!await runtime.scene.rotate(move, animate, 150) || revision !== runtime.revision) return;
        updatePattern(runtime, next);
        setMoves((previous) => [...previous, move]);
        const attempt = runtime.attempt;
        if (attempt && attempt.startedAt !== null) {
          attempt.turns.push({
            move, source, atMs: Math.round(acceptedAt - attempt.startedAt),
            ...(viewMove !== move && { viewMove }),
          });
        }
      }
      // A typed algorithm is one command. Only check its final state for completion.
      const attempt = runtime.attempt;
      if (!attempt || attempt.startedAt === null || !isSolved(runtime.pattern)) return;
      runtime.attempt = null;
      const solve: CompletedSolve = {
        id: crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)),
          (byte) => byte.toString(16).padStart(2, '0')).join(''),
        finishedAt: new Date().toISOString(),
        scramble: attempt.scramble,
        turns: attempt.turns,
        durationMs: Math.round(performance.now() - attempt.startedAt),
      };
      setResult(solve);
      onCompleted(solve);
    }).catch((error: unknown) => {
      if (revision !== runtime.revision) return;
      console.error('Could not turn the simulator cube', error);
      setStatus('error');
    }).finally(() => {
      if (revision === runtime.revision) runtime.pending--;
    });

    return true;
  }

  function cancelGesture() {
    if (game.current) invalidateGesture(game.current);
  }

  return { game, status, scrambleStatus, scramble, startedAt, moves, view, centers, result, newScramble, reset, enqueue, cancelGesture };
}
