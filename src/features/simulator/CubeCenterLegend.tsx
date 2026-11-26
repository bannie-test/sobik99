import { FACE_COLORS } from '../../cube-tools/core/cube-shape.js';
import { t } from '../../cube-tools/utils/i18n.js';
import { FACES, type FaceMap } from './cubeView';

const POSITION = {
  F: t('mặt trước', 'front'),
  B: t('mặt sau', 'back'),
  L: t('mặt trái', 'left'),
  R: t('mặt phải', 'right'),
  U: t('mặt trên', 'up'),
  D: t('mặt dưới', 'down'),
};
const COLOR = {
  U: t('trắng', 'white'),
  L: t('cam', 'orange'),
  F: t('xanh lá', 'green'),
  R: t('đỏ', 'red'),
  B: t('xanh dương', 'blue'),
  D: t('vàng', 'yellow'),
};

export function CubeCenterLegend({ view, centers }: { view: FaceMap; centers: FaceMap }) {
  return <figure className="simulator-center-legend">
    <figcaption>{t('Màu tâm theo góc nhìn', 'Centers in this view')}</figcaption>
    <div className="simulator-center-net">
      {FACES.map((face) => {
        const center = centers[view[face]];
        const label = `${face} · ${POSITION[face]} · ${COLOR[center]}`;
        return <div key={face} className="simulator-center-face" style={{ gridArea: face }}
          role="img" aria-label={label} title={label}>
          {Array.from({ length: 9 }, (_, index) => index === 4
            ? <span key={index} className="simulator-center-sticker" aria-hidden="true"
                style={{
                  backgroundColor: `#${FACE_COLORS[center].toString(16).padStart(6, '0')}`,
                  color: center === 'B' ? '#fff' : '#17151c',
                }}>
                {face}
              </span>
            : <span key={index} aria-hidden="true" />)}
        </div>;
      })}
    </div>
  </figure>;
}
