import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { brands, findCube } from '../../data/cubes';
import { pad2 } from '../../shared/lib/format';

const SWIPE_MIN_PX = 40;
const CLICK_SUPPRESS_MS = 400;
const POP_MS = 850;
const SMALL_ORBIT = 600;
const PARTICLES = 12;
const PARTICLE_COLORS = ['#fc7957', '#9c7ef4', '#e9f76b', '#a6dba1'];
const FACES = ['front', 'right', 'top'] as const;

const BRANDS = brands.map((b) => ({
  ...b,
  models: b.ids.map((id) => ({ id, name: findCube(id)?.name ?? id })),
}));
const COUNT = BRANDS.length;

const wrap = (n: number) => ((n % COUNT) + COUNT) % COUNT;

/** Vị trí tương đối của thẻ i so với thẻ đang chọn: -2..2 */
const offsetOf = (i: number, index: number) => {
  const d = (i - index + COUNT) % COUNT;
  return d > 2 ? d - COUNT : d;
};

function cardStyle(d: number, small: boolean, bg: string): CSSProperties {
  const a = Math.abs(d);
  const on = d === 0;
  return {
    '--brand-bg': bg,
    transform: `translateX(${d * (small ? 175 : 265)}px) translateY(${on ? -2 : 24}px) translateZ(${on ? 85 : -a * 145}px) rotateY(${-d * 23}deg) rotateZ(${on ? -3 : d * 7}deg) scale(${on ? 1.05 : 0.85})`,
    opacity: on ? '1' : a === 1 ? '.57' : '.18',
    filter: on ? 'none' : 'saturate(.6)',
    zIndex: 10 - a,
  } as CSSProperties;
}

function particleStyle(i: number): CSSProperties {
  const a = (i / PARTICLES) * Math.PI * 2;
  return {
    '--sx': `${Math.cos(a) * 110}px`,
    '--sy': `${Math.sin(a) * 110}px`,
    '--x': `${Math.cos(a) * 220}px`,
    '--y': `${Math.sin(a) * 200}px`,
    '--r': `${i * 77}deg`,
    '--color': PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  } as CSSProperties;
}

/** Carousel 3D 5 thương hiệu: bấm, phím mũi tên, vuốt. */
export function BrandOrbit({ reduced }: { reduced: boolean }) {
  const [index, setIndex] = useState(0);
  const [small, setSmall] = useState(false);
  const [pop, setPop] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);

  const orbitalRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressUntil = useRef(0);
  const popTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = orbitalRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSmall(el.clientWidth < SMALL_ORBIT));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => window.clearTimeout(popTimer.current), []);

  const select = (n: number): number => {
    const next = wrap(n);
    if (next === index) return next;
    window.clearTimeout(popTimer.current);
    setIndex(next);
    if (!reduced) setBurst((b) => b + 1);
    setPop(next);
    popTimer.current = window.setTimeout(() => setPop(null), POP_MS);
    return next;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = select(index + (e.key === 'ArrowRight' ? 1 : -1));
    cardRefs.current[next]?.focus({ preventScroll: true });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button === 0) gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
      suppressUntil.current = performance.now() + CLICK_SUPPRESS_MS;
      select(index + (dx < 0 ? 1 : -1));
    }
  };
  const cancelGesture = () => {
    gesture.current = null;
  };

  const active = BRANDS[index]!;

  return (
    <section className="brand-gallery" onKeyDown={onKeyDown}>
      <div className="gallery-intro">
        <div>
          <small>GIẢI XONG MỘT KHỐI. MỞ RA MỘT THẾ GIỚI.</small>
          <h2>
            Đúng gu.
            <br />
            <span>Đúng vòng xoay.</span>
          </h2>
        </div>
        <p>
          Những thương hiệu quen thuộc của cộng đồng cubing.
          <br />
          Chạm, vuốt, chọn một cá tính.
        </p>
      </div>
      <div
        className="orbital"
        role="region"
        aria-roledescription="carousel"
        aria-label="Thương hiệu Rubik"
        ref={orbitalRef}
        style={{ backgroundColor: active.stage }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={cancelGesture}
        onPointerLeave={cancelGesture}
        onClickCapture={(e) => {
          // Vừa vuốt xong thì bỏ qua click để không chọn nhầm thẻ.
          if (performance.now() < suppressUntil.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="orbit-halo" aria-hidden="true"></div>
        <span className="orbit-decor od1" aria-hidden="true"></span>
        <span className="orbit-decor od2" aria-hidden="true">
          ✳
        </span>
        <span className="orbit-decor od3" aria-hidden="true"></span>
        <span className="orbit-decor od4" aria-hidden="true"></span>
        <span className="orbit-note">THE CUBE CLUB / BRAND EDITION</span>
        <div className="orbit-scene">
          {BRANDS.map((b, i) => {
            const d = offsetOf(i, index);
            const on = d === 0;
            return (
              <button
                key={b.name}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`brand-card cursor-interaction${on ? ' active' : ''}${pop === i ? ' pop' : ''}`}
                style={cardStyle(d, small, b.bg)}
                aria-label={`Chọn ${b.name}`}
                aria-pressed={on}
                inert={Math.abs(d) > 1}
                onClick={() => select(i)}
              >
                <span className="selected-tag">✦ NHÂN VẬT CHÍNH ✦</span>
                <span className="brand-surface">
                  <span className="brand-no">CUBE CLUB / {pad2(i + 1)}</span>
                  <span className="brand-art">
                    <i className="shape-ring"></i>
                    <span className="shape-star">✳</span>
                    <span className="mini-cube">
                      {FACES.map((face) => (
                        <span key={face} className={`mini-face ${face}`}>
                          {Array.from({ length: 9 }, (_, j) => (
                            <i key={j}></i>
                          ))}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="brand-copy">
                    <small>{b.tag}</small>
                    <strong style={b.name.length > 10 ? { fontSize: '26px' } : undefined}>{b.name}</strong>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <span className="orbit-caption">VUỐT ĐỂ XOAY · CHẠM ĐỂ CHỌN</span>
        {burst > 0 &&
          !reduced &&
          Array.from({ length: PARTICLES }, (_, i) => (
            <i
              key={`${burst}-${i}`}
              className="orbit-particle"
              aria-hidden="true"
              style={particleStyle(i)}
              onAnimationEnd={i === PARTICLES - 1 ? () => setBurst(0) : undefined}
            />
          ))}
      </div>
      <div className="orbit-controls">
        <div className="orbit-dots" aria-label="Chọn thương hiệu">
          {BRANDS.map((b, i) => (
            <button
              key={b.name}
              className="cursor-interaction"
              aria-label={`Chọn ${b.name}`}
              aria-current={String(i === index) as 'true' | 'false'}
              onClick={() => select(i)}
            />
          ))}
        </div>
        <span className="orbit-status" aria-live="polite">
          {pad2(index + 1)} / 05 — {active.name}
        </span>
        <div>
          <button className="orbit-prev" aria-label="Thương hiệu trước" onClick={() => select(index - 1)}>
            ←
          </button>
          <button className="orbit-next" aria-label="Thương hiệu tiếp" onClick={() => select(index + 1)}>
            →
          </button>
        </div>
      </div>
      <div className="model-detail" aria-live="polite">
        <div>
          <small>MỘT VÀI MẪU TIÊU BIỂU</small>
          <h3 className="brand-name">{active.name}</h3>
        </div>
        <div className="model-list">
          {active.models.map((m, i) => (
            <a key={m.id} href={`#/cube/${m.id}`}>
              <small>MẪU {pad2(i + 1)}</small>
              <strong>{m.name} ↗</strong>
            </a>
          ))}
        </div>
      </div>
      <p className="source-note">
        Minh họa hình học, không phải ảnh sản phẩm. Danh sách chọn lọc, không phải bảng xếp hạng.
      </p>
      <a className="button primary" href="#/catalog">
        Cả một thế giới Rubik ↗
      </a>
    </section>
  );
}
