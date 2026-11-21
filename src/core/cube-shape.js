import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Dimensions in units of one cubie pitch, estimated from the reference photos.
export const GAN = Object.freeze({ shellWidth: 0.92, faceOffset: 0.479, capHalf: 0.485 });
export const FACE_COLORS = Object.freeze({
  U: 0xf8fbff, D: 0xffdc18, F: 0x0caf5b, B: 0x2464ec, R: 0xe92a36, L: 0xff8b18,
});
const AXES = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1],
  B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};
const NORMAL = new THREE.Vector3(0, 0, 1);
const VERTICAL = new THREE.Vector3(0, 1, 0);

function capGeometry(inner, outer, half = GAN.capHalf) {
  const h = half;
  const s = new THREE.Shape();
  s.moveTo(-h + outer, -h);
  s.lineTo(h - outer, -h);
  s.quadraticCurveTo(h, -h, h, -h + outer);
  s.lineTo(h, h - inner);
  s.quadraticCurveTo(h, h, h - inner, h);
  s.lineTo(-h + inner, h);
  s.quadraticCurveTo(-h, h, -h, h - inner);
  s.lineTo(-h, -h + outer);
  s.quadraticCurveTo(-h, -h, -h + outer, -h);
  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: 0.024, bevelSize: 0.01, bevelThickness: 0.012,
    bevelSegments: 4, curveSegments: 16,
  });
  // Miter the underside where two perpendicular caps meet on the same cubie.
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const limit = GAN.faceOffset + positions.getZ(i) - 0.0008;
    positions.setXY(i, THREE.MathUtils.clamp(positions.getX(i), -limit, limit),
      THREE.MathUtils.clamp(positions.getY(i), -limit, limit));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function studioEnvironment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#d7e3f9');
  sky.addColorStop(0.53, '#54637b');
  sky.addColorStop(1, '#9499a1');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#fff';
  ctx.fillRect(54, 30, 135, 78);
  ctx.fillRect(338, 42, 68, 113);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  try {
    return pmrem.fromEquirectangular(texture);
  } finally {
    texture.dispose();
    pmrem.dispose();
  }
}

// Blue center mark traced as three panels from the supplied reference.
function markGeometry() {
  const panels = [
    [[0, 18], [12, 7], [10, 5], [3, 11], [-2, 7], [6, 0], [-1, -6], [-14, 5]],
    [[-15, 3], [-2, -8], [-2, -24], [-6, -21], [-6, -16], [-11, -12], [-11, -17], [-15, -14]],
    [[1, -8], [5, -4], [11, -9], [11, 3], [15, 7], [15, -15], [12, -18], [5, -12], [5, -21], [1, -24]],
  ];
  const shapes = panels.map(points => {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x / 62, (y + 3) / 62)));
    shape.closePath();
    return shape;
  });
  const cutout = new THREE.Path([[-11, -5], [-6, -9], [-6, -13], [-11, -9]]
    .map(([x, y]) => new THREE.Vector2(x / 62, (y + 3) / 62)));
  cutout.closePath();
  shapes[1].holes.push(cutout);
  return new THREE.ShapeGeometry(shapes);
}

export function createGanFactory(renderer, size = 3) {
  const outer = (size - 1) / 2;
  const environment = renderer ? studioEnvironment(renderer) : null;
  const envMap = environment?.texture ?? null;
  const caps = Object.fromEntries(Object.entries(FACE_COLORS).map(([face, color]) => [face,
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, clearcoat: 0.72, clearcoatRoughness: 0.15, envMap, envMapIntensity: 0.78 }),
  ]));
  const masked = new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.38, clearcoat: 0.2, envMap });
  const shell = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.52, envMap, envMapIntensity: 0.37 });
  const collar = new THREE.MeshPhysicalMaterial({ color: 0x121821, roughness: 0.34, clearcoat: 0.24, envMap });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9d2df, metalness: 0.8, roughness: 0.26, envMap });
  const lime = new THREE.MeshStandardMaterial({ color: 0xb6d91c, metalness: 0.22, roughness: 0.26, envMap });
  const ink = new THREE.MeshBasicMaterial({ color: 0x0869cb });
  const body = new RoundedBoxGeometry(GAN.shellWidth, GAN.shellWidth, GAN.shellWidth, 4, 0.105);
  const skins = [null, capGeometry(0.37, 0.37, 0.452), capGeometry(0.31, 0.029), capGeometry(0.032, 0.032)];
  const seat = new THREE.CylinderGeometry(0.119, 0.137, 0.038, 26);
  const disk = new THREE.CylinderGeometry(0.077, 0.077, 0.022, 26);
  const ring = new THREE.TorusGeometry(0.091, 0.013, 8, 28);
  const mark = markGeometry();

  function makePiece(x, y, z) {
    const coord = new THREE.Vector3(x, y, z);
    const faces = Object.keys(AXES).filter(face => coord.dot(new THREE.Vector3(...AXES[face])) === outer);
    if (!faces.length) return null;

    const group = new THREE.Group();
    group.position.copy(coord);
    group.userData = { coord: [x, y, z], faces, facelets: [] };
    group.add(new THREE.Mesh(body, shell));

    for (const face of faces) {
      const normal = new THREE.Vector3(...AXES[face]);
      const frame = new THREE.Group();
      frame.position.copy(normal).multiplyScalar(GAN.faceOffset);
      frame.quaternion.setFromUnitVectors(NORMAL, normal);
      if (faces.length === 2) {
        const otherFace = faces.find(candidate => candidate !== face);
        const inward = new THREE.Vector3(...AXES[otherFace]).negate().applyQuaternion(frame.quaternion.clone().invert());
        frame.rotateZ(Math.atan2(inward.y, inward.x) - Math.PI / 2);
      }
      const cap = new THREE.Mesh(skins[faces.length], caps[face]);
      frame.add(cap);
      group.userData.facelets.push({ face, cap });
      group.add(frame);
      if (size === 3 && faces.length === 1 && face === 'U') {
        const logo = new THREE.Mesh(mark, ink);
        logo.position.z = 0.037;
        frame.add(logo);
      }
    }

    if (size === 3 && faces.length > 1) {
      for (const normal of Object.values(AXES).map(axis => new THREE.Vector3(...axis))) {
        const outward = coord.dot(normal);
        if (faces.length === 2 ? outward !== 0 : outward !== -1) continue;
        const pod = new THREE.Group();
        pod.position.copy(normal).multiplyScalar(0.461);
        pod.quaternion.setFromUnitVectors(VERTICAL, normal);
        const base = new THREE.Mesh(seat, collar);
        const metal = new THREE.Mesh(disk, faces.length === 2 ? lime : steel);
        metal.position.y = 0.017;
        const rim = new THREE.Mesh(ring, faces.length === 2 ? lime : steel);
        rim.rotation.x = -Math.PI / 2;
        rim.position.y = 0.027;
        pod.add(base, metal, rim);
        group.add(pod);
      }
    }
    return group;
  }

  function maskLastLayer(group, enabled) {
    const hide = enabled && group.userData.faces.includes('D');
    for (const { face, cap } of group.userData.facelets) {
      cap.material = hide ? masked : caps[face];
    }
  }

  function dispose() {
    [body, ...skins.slice(1), seat, disk, ring, mark].forEach(geometry => geometry.dispose());
    [...Object.values(caps), masked, shell, collar, steel, lime, ink].forEach(material => material.dispose());
    environment?.dispose();
  }

  return { makePiece, maskLastLayer, dispose };
}
