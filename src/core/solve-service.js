import { t as tr } from '../utils/i18n.js';
// Glue between the solver page and the engines: builds states from scrambles or painted colors,
// runs CFOP, and asks cubing.js for a short (Kociemba-style two-phase) solution.
import { apply, parse, invert, format, simplify, solvedFacelets, centers, conjugate, ORIENTATIONS, htm } from './cube.js';
import { CfopSolver, standardOrientation } from './cfop.js';
import cases from '../data/algorithms.js';

let solver;
export const cfop = () => (solver ??= new CfopSolver(cases));

/** Validates notation; returns {moves} or {error}. */
export function readScramble(text) {
  const t = String(text || '').trim();
  if (!t) return { error: tr('Hãy nhập scramble hoặc bấm “Scramble ngẫu nhiên”.', "Enter a scramble or select “Random scramble.”") };
  try { return { moves: format(parse(t)) }; } catch (e) { return { error: tr('Scramble không hợp lệ: ', "Invalid scramble: ") + e.message }; }
}

/** An algorithm that builds `state` from a solved cube held white-up, green-front (cubing.js default). */
export function setupFor(state) {
  const r = cfop().solve(state, 'all');
  if (!r.ok) return null;
  const sol = r.steps.map(s => s.moves).join(' ');
  const fix = standardOrientation(apply(state, sol));
  return format(invert(parse(`${sol} ${fix}`)));
}

/** Steps of the solution, each with the setup that shows the cube right before it. */
export function withSetups(setup, steps) {
  let before = setup;
  return steps.map(s => { const out = { ...s, setup: before }; before = `${before} ${s.moves}`.trim(); return out; });
}

/**
 * Short solution through cubing.js search. The cube is first turned yellow-up/green-front and the
 * solution is written in that grip, so it reads the same way as the CFOP one.
 */
export async function shortSolution(setup) {
  const { experimentalSolve3x3x3IgnoringCenters } = await import('cubing/search');
  const { cube3x3x3 } = await import('cubing/puzzles');
  const kp = await cube3x3x3.kpuzzle();
  const state = apply(solvedFacelets(), setup);
  const toStandard = standardOrientation(state);
  const pattern = kp.defaultPattern().applyAlg(`${setup} ${toStandard}`.trim());
  const k = parse((await experimentalSolve3x3x3IgnoringCenters(pattern)).toString());
  const yellowUp = format(conjugate(k, 'z2'));
  // One whole-cube rotation equivalent to "toStandard z2".
  const target = centers(apply(state, `${toStandard} z2`)).join('');
  const hold = ORIENTATIONS.find(o => centers(apply(state, o)).join('') === target) ?? `${toStandard} z2`;
  const steps = [];
  if (hold) steps.push({ stage: 'hold', title: tr('Cầm cube', "Hold the cube"), moves: hold, explanation: tr('Xoay cả khối để mặt vàng hướng lên, xanh lá phía trước.', "Rotate the cube so yellow faces up and green faces front.") });
  steps.push({ stage: 'short', title: tr('Lời giải ngắn', "Short solution"), moves: yellowUp, explanation: `${tr("Lời giải", "Solution:")} ${htm(k)} ${tr("bước bằng thuật toán hai pha (kiểu Kociemba). Ngắn nhưng khó nhớ — phù hợp để kiểm tra hoặc thử thách.", "moves using a Kociemba-style two-phase algorithm.")}` });
  const end = apply(apply(state, hold), yellowUp);
  return { steps, solved: cfop().analyze(end).solved };
}

export const moveCount = steps => steps.reduce((n, s) => n + htm(parse(s.moves)), 0);
export const tidy = text => format(simplify(parse(text)));
