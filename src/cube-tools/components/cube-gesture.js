import * as THREE from 'three';

/** @typedef {'L' | 'R' | 'D' | 'U' | 'B' | 'F'} Face */
/** @type {Record<'x' | 'y' | 'z', [Face, Face]>} */
const LAYERS = { x: ['L', 'R'], y: ['D', 'U'], z: ['B', 'F'] };
const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

/** Pick on the 3×3 grid, including the seams between rendered tiles. */
export function createCubeGesture(camera, root, describeMove, invalidate = () => {}) {
  const half = 1.5;
  const bounds = new THREE.Box3(
    new THREE.Vector3(-half, -half, -half),
    new THREE.Vector3(half, half, half),
  );
  const raycaster = new THREE.Raycaster();
  const ray = new THREE.Ray();
  const inverse = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const end = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  const volume = new THREE.BoxGeometry(1, 1, 1);
  const tint = new THREE.MeshBasicMaterial({ color: 0xa784ff, opacity: 0.20, transparent: true, depthWrite: false });
  const lines = new THREE.LineBasicMaterial({ color: 0x7856df });
  const outline = new THREE.EdgesGeometry(volume);
  const guide = new THREE.Group();
  guide.add(new THREE.Mesh(volume, tint), new THREE.LineSegments(outline, lines));
  guide.visible = false;
  root.add(guide);

  return {
    pick(x, y, width, height) {
      camera.updateMatrixWorld();
      root.updateWorldMatrix(true, false);
      raycaster.setFromCamera(ndc.set(x * 2 - 1, 1 - y * 2), camera);
      inverse.copy(root.matrixWorld).invert();
      ray.copy(raycaster.ray).applyMatrix4(inverse);
      if (!ray.intersectBox(bounds, point)) return null;

      // Compare the drag with the projected displacement of this hit point.
      projected.copy(point).applyMatrix4(root.matrixWorld).project(camera);
      const candidates = [];
      for (const [axis, faces] of Object.entries(LAYERS)) {
        const coord = point[axis];
        if (Math.abs(coord) >= half - 1e-6 || Math.abs(coord) < 0.5) continue;
        const move = coord > 0 ? faces[1] : faces[0];
        const angle = Math.sign(describeMove(move).angle) * 0.025;
        end.copy(point).applyAxisAngle(AXES[axis], angle).applyMatrix4(root.matrixWorld).project(camera);
        const dx = (end.x - projected.x) * width / 2;
        const dy = (projected.y - end.y) * height / 2;
        const length = Math.hypot(dx, dy);
        if (length >= 0.35) candidates.push({ move, dx: dx / length, dy: dy / length });
      }
      return candidates;
    },
    preview(move) {
      if (!move && !guide.visible) return;
      guide.visible = Boolean(move);
      if (move) {
        const { axis, layers } = describeMove(move);
        guide.position.set(0, 0, 0);
        guide.position[axis] = (layers[0] + layers.at(-1)) / 2;
        guide.scale.set(3.08, 3.08, 3.08);
        guide.scale[axis] = layers.length + 0.035;
      }
      invalidate();
    },
    dispose() {
      guide.removeFromParent();
      volume.dispose();
      outline.dispose();
      tint.dispose();
      lines.dispose();
    },
  };
}
