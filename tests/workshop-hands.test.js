import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { solveReach } from '../src/core/workshop-hands.js';

test('the two arm segments keep their lengths for nearby and unreachable wrist targets', () => {
  const shoulder = new Vector3(.177, -.208, .018);
  const pole = new Vector3(.47, -1, .07);
  const upper = .227;
  const lower = .228;
  const elbow = new Vector3();
  const wrist = new Vector3();
  for (const goal of [
    new Vector3(.1, -.1, -.26),
    new Vector3(-8, 10, -5),
    shoulder.clone(),
    shoulder.clone().add(pole),
  ]) {
    solveReach(shoulder, goal, pole, upper, lower, elbow, wrist);
    assert.ok(Math.abs(shoulder.distanceTo(elbow) - upper) < 1e-9);
    assert.ok(Math.abs(elbow.distanceTo(wrist) - lower) < 1e-9);
  }
});
