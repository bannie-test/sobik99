import { t } from '../utils/i18n.js';

const item = (id, names, notes, at, options = {}) => ({
  id, name: t(...names), note: t(...notes), at, ...options,
});

const carrier = (id, names, note) => item(id, names, note, [0, .12, 0], { model: id });
const edgeBody = carrier('edge', ['Thân và chân cạnh', 'Edge body and foot'],
  ['Chân rộng trượt dưới các viên tâm và giữ viên cạnh trong khối.', 'The broad foot slides under the centers and retains the edge.']);
const cornerBody = carrier('corner', ['Thân và chân góc', 'Corner body and foot'],
  ['Chân góc hướng về lõi, có đường dẫn cho thanh nam châm.', 'The inward-facing corner foot has a channel for the magnet rod.']);
const centerBody = carrier('center', ['Đế tâm có ống dẫn', 'Center housing'],
  ['Ống dẫn giữ chuyển động của viên tâm dọc theo trục.', 'The guide tube keeps the center moving along its axle.']);
const coreBody = carrier('core', ['Lõi sáu trục', 'Six-axis core'],
  ['Sáu trục đỡ sáu viên tâm. Vỏ cầu mang nam châm lắp quanh lõi.', 'Six axles support the centers. The magnetic ball shell fits around this core.']);

const magnet = (id, name, at, axis, polar, requires) =>
  item(id, name, ['Viên nam châm cạnh–góc. Đảo cực trước khi thả nếu đầu màu hướng sai.', 'An edge-to-corner magnet. Flip polarity before dropping if the colored end faces the wrong way.'],
    at, { model: 'magnet', axis, polar, requires });

const panel = (id, name, at, axis, color, requires) =>
  item(id, name, ['Mặt màu có ngàm. Lắp các linh kiện bên trong trước khi đóng vỏ.', 'A colored snap-fit panel. Install the internal hardware before closing the shell.'],
    at, { model: 'panel', axis, color, requires });

const coreCenterHeight = .49;
const ballRadius = .32;

export function ballCoreMagnets(half, count = 8) {
  const sign = half === 'south' ? -1 : 1;
  const label = half === 'south' ? t('dưới', 'lower') : t('trên', 'upper');
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z]) =>
    [x / Math.sqrt(3), sign / Math.sqrt(3), z / Math.sqrt(3)]);
  if (count === 20) {
    const latitude = .25;
    const horizontal = Math.sqrt(1 - latitude ** 2);
    for (let index = 0; index < 6; index++) {
      const angle = Math.PI / 6 * (2 * index + (sign > 0 ? .5 : 1.5));
      directions.push([Math.cos(angle) * horizontal, sign * latitude, Math.sin(angle) * horizontal]);
    }
  }
  return directions.map((normal, index) => {
    const [x, y, z] = normal.map(value => value * ballRadius);
    return item(`core-${half}-${index + 1}`,
      [`Nam châm lõi ${label} ${index + 1}`, `Core magnet · ${label} ${index + 1}`],
      ['Gắn nam châm vào hốc phát sáng trên nửa cầu tương ứng.', 'Seat the magnet in the glowing pocket on its matching hemisphere.'],
      [x, coreCenterHeight + y, z],
      { model: 'core-magnet', normal, requires: [half] });
  });
}

export function assembly(kind, mechanism, magnetCount) {
  switch (kind) {
    case 'edge': return [
      edgeBody,
      magnet('edge-a', ['Nam châm cạnh A', 'Edge magnet A'], [-.26, .65, 0], 'z', 0, ['edge']),
      { ...magnet('edge-b', ['Nam châm cạnh B', 'Edge magnet B'], [.26, .65, 0], 'z', 1, ['edge']), initialFlip: 1 },
      panel('edge-top', ['Vỏ trắng', 'White panel'], [0, .76, 0], 'y', 2, ['edge-a', 'edge-b']),
      panel('edge-front', ['Vỏ xanh lá', 'Green panel'], [0, .55, .29], 'z', 4, ['edge-a', 'edge-b']),
    ];
    case 'corner': return [
      cornerBody,
      magnet('corner-a', ['Nam châm góc A', 'Corner magnet A'], [-.23, .68, 0], 'z', 1, ['corner']),
      magnet('corner-b', ['Nam châm góc B', 'Corner magnet B'], [.09, .68, .08], 'x', 0, ['corner']),
      magnet('corner-c', ['Nam châm góc C', 'Corner magnet C'], [.17, .68, -.18], 'y', 1, ['corner']),
      item('rod', ['Thanh nam châm chân góc', 'Corner magnet rod'],
        ['Tương tác với lõi cầu. Xoay 60° để mô phỏng thao tác khóa thanh kiểu GAN17.', 'Interacts with the ball core. Rotate 60° to model the GAN17-style rod lock.'],
        [0, .36, .04], { model: 'rod', lock: 60, requires: ['corner'] }),
      panel('corner-top', ['Vỏ trắng', 'White panel'], [0, .78, 0], 'y', 2, ['corner-a', 'corner-b', 'corner-c', 'rod']),
      panel('corner-front', ['Vỏ xanh lá', 'Green panel'], [0, .55, .29], 'z', 4, ['corner-a', 'corner-b', 'corner-c', 'rod']),
      panel('corner-side', ['Vỏ đỏ', 'Red panel'], [.29, .55, 0], 'x', 0, ['corner-a', 'corner-b', 'corner-c', 'rod']),
    ];
    case 'center': {
      const maglev = mechanism === 'maglev';
      const tension = maglev ? [
        item('lower', ['Vòng MagLev dưới', 'Lower MagLev ring'], ['Mặt đánh dấu hướng lên để đẩy vòng phía trên.', 'The marked face points up to repel the upper ring.'],
          [0, .42, 0], { model: 'ring', polar: 0, requires: ['center'] }),
        item('upper', ['Vòng MagLev trên', 'Upper MagLev ring'], ['Vòng trên đã được đặt đúng chiều trong khay. Khi lắp, hai mặt cùng cực hướng vào nhau.', 'The upper ring is pre-oriented in the tray. Once installed, matching poles face each other.'],
          [0, .57, 0], { model: 'ring', polar: 1, initialFlip: 1, requires: ['lower'] }),
      ] : [
        item('spring', ['Lò xo nén', 'Compression spring'], ['Lò xo bao quanh trục và đẩy tâm trở về sau khi nén.', 'The spring surrounds the axle and pushes the center back after compression.'],
          [0, .42, 0], { model: 'spring', requires: ['center'] }),
      ];
      return [
        centerBody, ...tension,
        item('collar', ['Vòng chỉnh lực nén', 'Compression dial'], ['Vòng có nấc để thay đổi lực nén ban đầu.', 'A stepped dial changes the initial compression.'],
          [0, .68, 0], { model: 'collar', requires: [tension.at(-1).id] }),
        item('axle', ['Chốt trục tâm', 'Center axle pin'], ['Chốt giữ cụm trên trục và giới hạn hành trình tâm.', 'The pin retains the stack and limits center travel.'],
          [0, .75, 0], { model: 'axle', requires: ['collar'] }),
        panel('center-cap', ['Nắp tâm đỏ', 'Red center cap'], [0, .9, 0], 'y', 0, ['axle']),
      ];
    }
    case 'core': return [
      coreBody,
      item('north', ['Bán cầu từ trên', 'Upper magnetic hemisphere'], ['Các hốc theo đường chéo hướng về chân góc để hỗ trợ căn tầng.', 'Diagonal pockets face the corner feet to help align layers.'],
        [0, coreCenterHeight, 0], { model: 'hemisphere', requires: ['core'] }),
      item('south', ['Bán cầu từ dưới', 'Lower magnetic hemisphere'], ['Hai bán cầu ghép quanh tâm lõi, chừa lối cho sáu trục.', 'The halves meet around the hub, leaving room for all six axles.'],
        [0, coreCenterHeight, 0], { model: 'hemisphere', axis: 'down', requires: ['core'] }),
      ...ballCoreMagnets('north', magnetCount),
      ...ballCoreMagnets('south', magnetCount),
    ];

  }
}

export const faces = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const colorNames = [
  t('Đỏ', 'Red'), t('Cam', 'Orange'), t('Trắng', 'White'),
  t('Vàng', 'Yellow'), t('Xanh lá', 'Green'), t('Xanh dương', 'Blue'),
];

export const cubies = [-1, 0, 1].flatMap(x => [-1, 0, 1].flatMap(y => [-1, 0, 1].flatMap(z => {
  const count = Math.abs(x) + Math.abs(y) + Math.abs(z);
  if (!count) return [];
  const coordinate = [x, y, z];
  const colors = faces.flatMap(([a, b, c], index) => a * x + b * y + c * z === 1 ? [index] : []);
  return [{
    id: coordinate.join(','), coordinate, colors, kind: ['center', 'edge', 'corner'][count - 1],
    name: colors.map(color => colorNames[color]).join(' · '),
  }];
})));

export function coloredAssembly(cubie, mechanism) {
  let index = 0;
  return assembly(cubie.kind, mechanism).map(part => {
    if (part.model !== 'panel') return part;
    const color = cubie.colors[index++];
    return { ...part, color, name: t('Vỏ', 'Panel') + ' · ' + colorNames[color] };
  });
}
