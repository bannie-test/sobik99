import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, parse, invert, format, solvedFacelets, conjugate, centers } from '../src/core/cube.js';
import { validate, toCubie, isSolvedCubie } from '../src/core/cubie.js';
import { caseOf, caseClass, CfopSolver, Frame } from '../src/core/cfop.js';
import { setupFor, shortSolution } from '../src/core/solve-service.js';
import cases from '../src/data/algorithms.js';

const S = solvedFacelets();
const same = (a, b) => apply(S, a).join('') === apply(S, b).join('');
const FACES = 'URFDLB';
function randomAlg(n = 25, rnd = Math.random) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(FACES[(rnd() * 6) | 0] + ['', "'", '2'][(rnd() * 3) | 0]);
  return out.join(' ');
}
const seeded = (seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)(42);
const solver = new CfopSolver(cases);
const moves = steps => steps.map(s => s.moves).join(' ');

test('move engine: identities for faces, wide turns, slices and rotations', () => {
  assert.ok(same('R R R R', ''));
  assert.ok(same("(R U R' U')6", ''));
  assert.ok(same('r', "R M'") && same('Rw', 'r') && same('u', "U E'") && same('f', 'F S'));
  assert.ok(same('x', "R M' L'") && same('y', "U E' D'") && same('z', "F S B'"));
  assert.ok(same(format(invert(parse("R U2 F' x M"))), "M' x' F U2 R'"));
  assert.ok(same("[R U R' U']2", "R U R' U' R U R' U'"));
  assert.throws(() => parse('R Q'));
  // Conjugating by z2 swaps U/D and R/L and keeps the turn direction.
  const st = apply(apply(S, "R U F'"), 'z2');
  assert.equal(st.join(''), apply(apply(S, 'z2'), format(conjugate(parse("R U F'"), 'z2'))).join(''));
});

test('validator explains impossible colorings', () => {
  assert.ok(validate(S).ok);
  const swap = (s, a, b) => { const t = [...s]; [t[a], t[b]] = [t[b], t[a]]; return t; };
  assert.equal(validate(swap(S, 0, 9)).errors[0].code, 'CORNER_INVALID'); // ULB corner gets two red stickers
  const twisted = (() => { const t = [...S]; const [a, b, c] = [8, 9, 20]; [t[a], t[b], t[c]] = [t[c], t[a], t[b]]; return t; })();
  assert.deepEqual(validate(twisted).errors.map(e => e.code), ['TWIST']);
  const flipped = swap(S, 5, 10);
  assert.deepEqual(validate(flipped).errors.map(e => e.code), ['FLIP']);
  assert.ok(validate(apply(S, "R U R' U' R' F R2 U' R' U' R U R' F'")).ok); // T-perm state is legal
  const edgeSwap = swap(swap(S, 7, 5), 19, 10); // UF <-> UR edges only
  assert.ok(validate(edgeSwap).errors.some(e => e.code === 'PARITY'));
  const counts = [...S]; counts[0] = 'D';
  assert.equal(validate(counts).errors[0].code, 'COUNT');
});

test('algorithm library: 41 F2L / 57 OLL / 21 PLL, every algorithm solves its own case', () => {
  for (const [type, n] of [['f2l', 41], ['oll', 57], ['pll', 21]]) assert.equal(cases.filter(c => c.type === type).length, n, type);
  for (const c of cases) {
    assert.ok(c.algs.length >= 1, c.id);
    const ref = caseClass(c.type, c.algs[0].alg);
    for (const a of c.algs) {
      const r = caseOf(c.type, a.alg);
      assert.ok(!r.error, `${c.id}: ${a.alg} ${r.error}`);
      assert.equal(r.fix, '', `${c.id}: ${a.alg} must end in the holding orientation`);
      const cls = caseClass(c.type, a.alg);
      assert.ok([...cls].every(k => ref.has(k)), `${c.id}: ${a.alg} solves a different case`);
      // Setup + algorithm returns to solved.
      assert.ok(new Frame(apply(apply(S, r.setup), a.alg)).solved, `${c.id}: ${a.alg}`);
    }
  }
  const modern = cases.reduce((n, c) => n + c.algs.filter(a => a.source === 'modern').length, 0);
  assert.ok(modern >= 150, 'modern algorithms: ' + modern);
  assert.ok(cases.filter(c => c.type !== 'f2l').every(c => c.algs.some(a => a.source === 'modern')), 'every OLL/PLL has a modern algorithm');
});

test('CFOP solves random cubes completely, white cross on D and yellow last layer', () => {
  for (let k = 0; k < 150; k++) {
    const st = apply(S, randomAlg(25, seeded));
    const r = solver.solve(st, 'all');
    assert.ok(r.ok && r.solved, r.error);
    const end = apply(st, moves(r.steps));
    assert.ok(isSolvedCubie(toCubie(end)));
    // After holding, white sits on D and yellow on U for every later step.
    const held = apply(st, r.steps[0].stage === 'hold' ? r.steps[0].moves : '');
    assert.equal(centers(held)[3], 'U');
    assert.deepEqual(r.steps.filter(s => s.stage !== 'hold').map(s => s.stage).filter((s, i, a) => a.indexOf(s) === i), ['cross', 'f2l', 'oll', 'pll'].filter(x => r.steps.some(s => s.stage === x)));
  }
});

test('partial goals stop where asked and can be continued to a full solve', () => {
  const st = apply(S, "R U2 F' L D B2 R' U F2 D' L2 B U' R2 F D2 L' U B' R");
  const cross = solver.solve(st, 'cross');
  assert.ok(cross.ok && !cross.solved);
  assert.deepEqual(cross.remaining, ['F2L (4 cặp)', 'OLL', 'PLL']);
  assert.ok(new Frame(cross.endState).crossSolved);
  const f2l = solver.solve(cross.endState, 'f2l');
  assert.ok(f2l.ok && new Frame(f2l.endState).f2lSolved);
  const pair = solver.solve(cross.endState, 'pair');
  assert.equal(new Frame(pair.endState).solvedSlots.length >= 1, true);
  const rest = solver.solve(cross.endState, 'all');
  assert.ok(rest.solved);
  assert.match(solver.solve(st, 'oll').error, /OLL chỉ dùng/);
  assert.match(solver.solve(S, 'all').error, /đã được giải/);
});

test('painted states get a setup that rebuilds them exactly, and a short solution', async () => {
  const painted = apply(apply(S, randomAlg(20, seeded)), 'z2');
  const setup = setupFor(painted);
  assert.equal(apply(S, setup).join(''), painted.join(''));
  const short = await shortSolution(setup);
  assert.ok(short.solved);
  assert.ok(parse(short.steps.at(-1).moves).length <= 26);
});
