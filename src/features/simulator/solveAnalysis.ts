import { apply, format, orientationFor, parse, simplify, solvedFacelets } from '../../cube-tools/core/cube.js';
import { Frame } from '../../cube-tools/core/cfop.js';
import type { CompletedSolve } from './solveHistory';

export function analyzeSolve({ turns }: CompletedSolve) {
  const algorithm = turns.map(({ move }) => move).join(' ');
  const moves = parse(algorithm);
  const shortened = simplify(moves);
  const reductions: { first: number; last: number; before: string; after: string }[] = [];

  for (let start = 0; start < moves.length;) {
    let end = start + 1;
    while (end < moves.length && moves[end]!.base === moves[start]!.base) end++;
    if (end > start + 1) {
      const segment = moves.slice(start, end);
      reductions.push({ first: start + 1, last: end, before: format(segment), after: format(simplify(segment)) });
    }
    start = end;
  }

  const pauses = turns.flatMap((turn, i) => {
    const previous = turns[i - 1];
    const gap = previous ? turn.atMs - previous.atMs : 0;
    return gap >= 1000 ? [{ before: i + 1, move: turn.move, gap }] : [];
  }).sort((a, b) => b.gap - a.gap);

  return {
    algorithm,
    shortened: format(shortened),
    savedMoves: moves.length - shortened.length,
    reductions,
    pauses,
  };
}

const PHASES = ['Cross', 'F2L', 'OLL', 'PLL'] as const;

export function cfopMilestones(solve: CompletedSolve) {
  let state = apply(solvedFacelets(), solve.scramble.join(' '));
  const lastIncomplete = [-1, -1, -1, -1];
  const frames = [null, ...solve.turns];

  frames.forEach((turn, index) => {
    if (turn) state = apply(state, turn.move);
    const orientation = orientationFor(state, 'D', 'F');
    if (orientation === null) return;
    const frame = new Frame(apply(state, orientation));
    [frame.crossSolved, frame.f2lSolved, frame.ollSolved, frame.solved].forEach((done, phase) => {
      if (!done) lastIncomplete[phase] = index;
    });
  });

  // A phase ends at the earliest step after which it stays complete for this solve.
  return PHASES.map((phase, i) => {
    const step = lastIncomplete[i]! + 1;
    return { phase, step, atMs: solve.turns[step - 1]?.atMs ?? 0 };
  });
}
