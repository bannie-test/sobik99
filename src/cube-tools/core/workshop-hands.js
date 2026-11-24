import * as THREE from 'three';
import anatomy from '../assets/workshop-arms.json' with { type: 'json' };

const Y = new THREE.Vector3(0, 1, 0);
const lengthEpsilon = .0005;

// Fixed-length two-bone IK. Clamp the goal before solving the elbow from the
// intersection of the shoulder and wrist spheres.
export function solveReach(shoulder, goal, pole, upper, lower, elbow, wrist) {
  const direction = wrist.subVectors(goal, shoulder);
  const distance = THREE.MathUtils.clamp(direction.length(),
    Math.abs(upper - lower) + lengthEpsilon, upper + lower - lengthEpsilon);
  if (!direction.lengthSq()) direction.set(0, 0, -1);
  direction.normalize();
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  elbow.copy(pole).addScaledVector(direction, -pole.dot(direction));
  if (elbow.lengthSq() < 1e-8) {
    if (Math.abs(direction.y) < .8) elbow.set(0, 1, 0);
    else elbow.set(1, 0, 0);
    elbow.addScaledVector(direction, -elbow.dot(direction));
  }
  elbow.normalize().multiplyScalar(bend).addScaledVector(direction, along).add(shoulder);
  wrist.multiplyScalar(distance).add(shoulder);
}

function buildArm(data, side, material) {
  const base = data.bones.map(([, , head, tail]) => ({
    head: new THREE.Vector3(...head), tail: new THREE.Vector3(...tail),
  }));
  const bones = data.bones.map(([name]) => Object.assign(new THREE.Bone(), { name }));
  const byName = Object.fromEntries(bones.map((bone, index) => [bone.name, index]));
  data.bones.forEach(([, parent], index) => {
    bones[index].position.copy(base[index].head);
    if (parent < 0) return;
    bones[index].position.sub(base[parent].head);
    bones[parent].add(bones[index]);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(data.joints, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(data.weights, 4));
  geometry.setIndex(data.indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.add(bones[0]);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.normalizeSkinWeights();

  const restUpper = base[1].head.clone().normalize();
  const restLower = new THREE.Vector3().subVectors(base[2].head, base[1].head).normalize();
  const root = new THREE.Vector3(side * .177, -.208, .018);
  const pole = new THREE.Vector3(side * .47, -1, .07);
  const upperLength = base[1].head.length();
  const lowerLength = base[2].head.distanceTo(base[1].head);
  const middle = base[byName['finger3-1']].head;
  const index = base[byName['finger2-1']].head;
  const little = base[byName['finger5-1']].head;
  const handForward = new THREE.Vector3().subVectors(middle, base[2].head).normalize();
  const handBack = new THREE.Vector3().subVectors(little, index).cross(handForward).normalize();
  if (handBack.y < 0) handBack.negate();
  const curlAxes = bones.flatMap((bone, i) => {
    if (!bone.name.startsWith('finger')) return [];
    const direction = base[i].tail.clone().sub(base[i].head).normalize();
    return [{ bone, axis: direction.cross(handBack).negate().normalize(), digit: Number(bone.name[6]) }];
  });
  const wrist = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const goal = new THREE.Vector3(side * .16, -.16, -.39);
  const desired = goal.clone();
  const direction = new THREE.Vector3();
  const restHand = new THREE.Quaternion();
  const lower = new THREE.Quaternion();
  const rotation = new THREE.Quaternion();
  const frameX = new THREE.Vector3(), frameY = new THREE.Vector3();
  const frame = new THREE.Matrix4();
  function handFrame(forward, back, result) {
    frameX.crossVectors(back, forward).normalize();
    frameY.crossVectors(forward, frameX).normalize();
    frame.makeBasis(frameX, frameY, forward);
    return result.setFromRotationMatrix(frame);
  }
  handFrame(handForward, handBack, restHand).invert();

  function update(x, y, reach, grip, viewportWidth, viewportHeight, blend) {
    const depth = .43;
    desired.set(
      reach ? THREE.MathUtils.clamp(x * viewportWidth + .045, -.145, .255) : side * .162,
      reach ? THREE.MathUtils.clamp(y * viewportHeight - .055, -.17, -.017) : -.169,
      reach ? -depth : -.375
    );
    goal.lerp(desired, blend);
    solveReach(root, goal, pole, upperLength, lowerLength, elbow, wrist);
    bones[0].position.copy(root);
    direction.subVectors(elbow, root).normalize();
    bones[0].quaternion.setFromUnitVectors(restUpper, direction);
    direction.subVectors(wrist, elbow).normalize();
    lower.setFromUnitVectors(restLower, direction);
    bones[1].quaternion.copy(bones[0].quaternion).invert().multiply(lower);

    direction.set(reach ? x * .16 - .04 : -side * .16, reach ? .55 : .24, -1).normalize();
    handFrame(direction, Y, rotation).multiply(restHand);
    bones[2].quaternion.copy(lower).invert().multiply(rotation);
    for (const { bone, axis, digit } of curlAxes) {
      const curl = digit === 1 ? .025 + .31 * grip : digit === 2 ? -.035 + .33 * grip : -.02 + .57 * grip;
      rotation.setFromAxisAngle(axis, curl);
      bone.quaternion.slerp(rotation, blend);
    }
  }

  return { mesh, update };
}

export function createWorkshopHands() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, .015, 2);
  scene.add(new THREE.HemisphereLight(0xfff2e5, 0x625766, 2));
  const key = new THREE.DirectionalLight(0xffebd8, 1.8);
  key.position.set(-.4, .8, .4);
  scene.add(key);
  const skin = new THREE.MeshStandardMaterial({ color: 0xb5785c, roughness: .82 });
  const left = buildArm(anatomy.L, -1, skin);
  const right = buildArm(anatomy.R, 1, skin);
  scene.add(left.mesh, right.mesh);
  let previous = 0;

  return {
    render(renderer, worldCamera, pointer, reaching, holding, now) {
      if (camera.aspect !== worldCamera.aspect) {
        camera.aspect = worldCamera.aspect;
        camera.fov = Math.max(46, THREE.MathUtils.radToDeg(2 * Math.atan(.53 / camera.aspect)));
        camera.updateProjectionMatrix();
      }
      const blend = previous ? 1 - Math.exp(-Math.min(now - previous, 80) / 65) : 1;
      previous = now;
      const height = .43 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const width = height * camera.aspect;
      left.update(0, 0, false, 0, width, height, blend);
      right.update(pointer.x, pointer.y, reaching, holding ? 1 : 0, width, height, blend);
      renderer.clearDepth();
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = autoClear;
    },
    dispose() {
      for (const { mesh } of [left, right]) {
        mesh.geometry.dispose();
        mesh.skeleton.dispose();
      }
      skin.dispose();
    },
  };
}
