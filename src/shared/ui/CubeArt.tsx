import type { CSSProperties } from 'react';

const FACES = ['front', 'right', 'top'] as const;

/** Minh họa hình khối bằng CSS (không phải ảnh sản phẩm). */
export function CubeArt({ type = '3x3', tone = 0 }: { type?: string; tone?: number }) {
  if (type === 'Pyraminx') {
    return (
      <div className="puzzle-art pyramid" aria-label="Minh họa Pyraminx">
        <div></div>
        <span>PYRAMINX</span>
      </div>
    );
  }
  if (type === 'Megaminx') {
    return (
      <div className="puzzle-art mega" aria-label="Minh họa Megaminx">
        <div>✦</div>
        <span>MEGAMINX</span>
      </div>
    );
  }
  const n = Number(type[0]) || 3;
  const style = { '--n': n, '--art-angle': `${tone % 2 ? -28 : -35}deg` } as CSSProperties;
  return (
    <div className="puzzle-art" role="img" aria-label={`Minh họa Rubik ${type}`}>
      <div className="mini-cube" style={style}>
        {FACES.map((face) => (
          <div key={face} className={`mini-face ${face}`}>
            {Array.from({ length: n * n }, (_, i) => (
              <i key={i}></i>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
