const ink = '#292339';
const polygon = (points, fill) => `<polygon points="${points.map(point => point.join(',')).join(' ')}" fill="${fill}"/>`;
const line = (a, b) => `<path d="M${a.join(' ')}L${b.join(' ')}" fill="none"/>`;
const interpolate = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);

function cube(size) {
  const faces = [
    { transform: 'matrix(0.72 0.38 -0.72 0.38 100 22)', color: '#ffdc65' },
    { transform: 'matrix(0.72 0.38 0 0.86 28 60)', color: '#90dfb1' },
    { transform: 'matrix(0.72 -0.38 0 0.86 100 98)', color: '#ff906f' },
  ];
  const cells = 100 / size;
  const grid = Array.from({ length: size - 1 }, (_, i) => {
    const offset = (i + 1) * cells;
    return `M${offset} 0v100M0 ${offset}h100`;
  }).join('');
  return faces.map(({ transform, color }) => `<g transform="${transform}">
    <rect width="100" height="100" fill="${color}"/>
    <path d="${grid}" fill="none"/>
  </g>`).join('');
}

function triangle(a, b, c, fill) {
  return polygon([a, b, c], fill) + [1 / 3, 2 / 3].map(t =>
    line(interpolate(a, b, t), interpolate(a, c, t)) +
    line(interpolate(b, a, t), interpolate(b, c, t)) +
    line(interpolate(c, a, t), interpolate(c, b, t))
  ).join('');
}

function pyraminx() {
  const apex = [98, 23], left = [21, 147], middle = [112, 177], right = [179, 132];
  return triangle(apex, left, middle, '#ffdc65') + triangle(apex, middle, right, '#90dfb1');
}

function pentagonalFace(points, fill) {
  const center = [0, 1].map(axis => points.reduce((sum, point) => sum + point[axis], 0) / points.length);
  const inner = points.map(point => interpolate(center, point, 0.46));
  return polygon(points, fill) + polygon(inner, 'none') + points.map((point, i) => {
    const next = (i + 1) % points.length;
    return line(point, inner[i]) + line(interpolate(point, points[next], 0.5), interpolate(inner[i], inner[next], 0.5));
  }).join('');
}

function megaminx() {
  const polar = (radius, turn) => {
    const angle = (turn * 72 - 90) * Math.PI / 180;
    return [100 + radius * Math.cos(angle), 100 + radius * Math.sin(angle)].map(value => Number(value.toFixed(2)));
  };
  const center = Array.from({ length: 5 }, (_, i) => polar(47, i));
  const colors = ['#a99af6', '#80c8f6', '#90dfb1', '#ff906f', '#f6a2c7'];
  const outer = colors.map((color, i) =>
    pentagonalFace([center[i], center[(i + 1) % 5], polar(76, i + 1), polar(85, i + 0.5), polar(76, i)], color)
  ).join('');
  return outer + pentagonalFace(center, '#ffdc65');
}

export function puzzleIcon(type) {
  const model = type === 'Pyraminx' ? pyraminx() : type === 'Megaminx' ? megaminx() : cube(Number(type[0]));
  return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" stroke="${ink}" stroke-width="2" stroke-linejoin="round">${model}</svg>`;
}
