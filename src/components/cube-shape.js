import { DirectionalLight, ExtrudeGeometry, HemisphereLight, MeshPhysicalMaterial, Shape } from 'three';

function roundedSquare(upperRadius, lowerRadius) {
  const shape = new Shape();
  const h = 0.493;
  shape.moveTo(-h + lowerRadius, -h);
  shape.lineTo(h - lowerRadius, -h);
  shape.quadraticCurveTo(h, -h, h, -h + lowerRadius);
  shape.lineTo(h, h - upperRadius);
  shape.quadraticCurveTo(h, h, h - upperRadius, h);
  shape.lineTo(-h + upperRadius, h);
  shape.quadraticCurveTo(-h, h, -h, h - upperRadius);
  shape.lineTo(-h, -h + lowerRadius);
  shape.quadraticCurveTo(-h, -h, -h + lowerRadius, -h);
  return shape;
}

function bevel(shape) {
  return new ExtrudeGeometry(shape, {
    depth: 0.018, bevelThickness: 0.012, bevelSize: 0.009,
    bevelSegments: 4, curveSegments: 16,
  });
}

export function makeCubeFaceGeometry() {
  const center = new Shape();
  center.absarc(0, 0, 0.478, 0, Math.PI * 2, false);
  return {
    CENTERS: bevel(center),
    EDGES: bevel(roundedSquare(0.24, 0.025)),
    CORNERS: bevel(roundedSquare(0.035, 0.035)),
  };
}

export function lightCube(cube) {
  const ambient = new HemisphereLight(0xfff5e9, 0xa6b4cb, 1.05);
  const key = new DirectionalLight(0xfff3df, 2.0);
  key.position.set(-4, 7, 5);
  const fill = new DirectionalLight(0xd9e8ff, 0.55);
  fill.position.set(5, 2, -5);
  cube.add(ambient, key, fill);
}

export function cubePlastic(color, polished) {
  const material = new MeshPhysicalMaterial({
    roughness: polished ? 0.33 : 0.62,
    clearcoat: polished ? 0.28 : 0,
    clearcoatRoughness: 0.32,
  });
  // Cubing.js outputs LinearSRGB directly, so these are already display values.
  material.color.setRGB((color >> 16) / 255, (color >> 8 & 255) / 255, (color & 255) / 255);
  return material;
}
