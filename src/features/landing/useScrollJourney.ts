import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { LAST_CHAPTER } from './content';
import { toMatrix3d, type CubeTimeline } from './cubeEngine';

/** Tỉ lệ cuộn dành cho việc giải (phần còn lại: xoay mừng + thoát cảnh). */
const SOLVE_END = 0.8;
const VICTORY_SPAN = 0.12;
const EXIT_START = 0.94;
const EASING = 0.14;
const MOBILE_STAGE = 651;

const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));

export interface JourneyRefs {
  journey: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  scene: RefObject<HTMLDivElement | null>;
  cube: RefObject<HTMLDivElement | null>;
  disc: RefObject<HTMLDivElement | null>;
  track: RefObject<HTMLDivElement | null>;
  cubies: RefObject<(HTMLDivElement | null)[]>;
}

interface Options {
  timeline: CubeTimeline;
  reduced: boolean;
  onChapter: (chapter: number) => void;
  /** Số bước giải đã hoàn thành (0–20), chỉ đổi khi sang bước mới. */
  onStep: (step: number) => void;
}

/**
 * Hoạt cảnh theo cuộn: transform được ghi trực tiếp vào DOM mỗi frame
 * (không qua React state) để mượt; chỉ chương và bước giải được đẩy lên React.
 */
export function useScrollJourney(refs: JourneyRefs, { timeline, reduced, onChapter, onStep }: Options) {
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const callbacks = useRef({ onChapter, onStep });
  callbacks.current = { onChapter, onStep };

  const span = useCallback(
    () => (refs.journey.current?.offsetHeight ?? 0) - (refs.stage.current?.offsetHeight ?? 0),
    [refs],
  );
  const top = useCallback(() => {
    const journey = refs.journey.current;
    if (!journey) return 0;
    const nav = document.querySelector<HTMLElement>('.site-nav');
    return journey.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight ?? 0);
  }, [refs]);

  const draw = useCallback(
    (p: number) => {
      const isReduced = reducedRef.current;
      const solve = clamp(p / SOLVE_END) * timeline.turns.length;
      const t = isReduced ? Math.floor(solve) : solve;
      const state = timeline.sample(t);
      callbacks.current.onChapter(Math.min(LAST_CHAPTER, Math.floor((p / SOLVE_END) * LAST_CHAPTER)));

      state.forEach((c, i) => {
        const el = refs.cubies.current[i];
        if (el)
          el.style.transform = `translate3d(${76 + c.p[0]! * 60}px,${76 + c.p[1]! * 60}px,${c.p[2]! * 60}px) matrix3d(${toMatrix3d(c.m)})`;
      });

      const victory = clamp((p - SOLVE_END) / VICTORY_SPAN);
      const wobble = isReduced ? 0 : Math.sin(p * 7) * 9;
      const spin = isReduced ? 0 : p * 75 + victory * 360;
      if (refs.cube.current)
        refs.cube.current.style.transform = `rotateX(${-23 + wobble}deg) rotateY(${-33 + spin}deg)`;

      const exit = clamp((p - EXIT_START) / (1 - EXIT_START));
      const mobile = (refs.stage.current?.clientWidth ?? 0) < MOBILE_STAGE;
      const scene = refs.scene.current;
      if (scene) {
        scene.style.transform = `translateY(${-9 - exit * 110}px) scale(${(mobile ? 0.68 : 1) * (1 - exit * 0.5)})`;
        scene.style.opacity = String(1 - exit * 0.7);
      }
      if (refs.disc.current) refs.disc.current.style.transform = `rotate(${p * 160}deg) scale(${1 - exit * 0.4})`;
      if (refs.track.current) refs.track.current.style.width = `${p * 100}%`;
      callbacks.current.onStep(Math.min(timeline.turns.length, Math.floor(t)));
    },
    [refs, timeline],
  );

  const anim = useRef({ current: 0, target: 0, raf: 0 });

  const update = useCallback(() => {
    const a = anim.current;
    a.target = clamp((window.scrollY - top()) / span());
    if (a.raf) return;
    const frame = () => {
      a.current = reducedRef.current ? a.target : a.current + (a.target - a.current) * EASING;
      if (Math.abs(a.target - a.current) < 0.0001) a.current = a.target;
      draw(a.current);
      a.raf = a.current !== a.target ? requestAnimationFrame(frame) : 0;
    };
    a.raf = requestAnimationFrame(frame);
  }, [draw, span, top]);

  // Vẽ trạng thái đầu trước khi trình duyệt paint.
  useLayoutEffect(() => draw(0), [draw]);

  useEffect(() => {
    window.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    if (refs.stage.current) observer.observe(refs.stage.current);
    const a = anim.current;
    return () => {
      window.removeEventListener('scroll', update);
      observer.disconnect();
      cancelAnimationFrame(a.raf);
      a.raf = 0;
    };
  }, [refs, update]);

  // Bật/tắt giảm chuyển động → vẽ lại ngay.
  useEffect(() => update(), [reduced, update]);

  const behavior = (): ScrollBehavior => (reducedRef.current ? 'instant' : 'smooth');
  const goToChapter = useCallback(
    (i: number) =>
      window.scrollTo({ top: top() + span() * (i === LAST_CHAPTER ? 0.84 : i * 0.16), behavior: behavior() }),
    [span, top],
  );
  const goToEnd = useCallback(
    () => window.scrollTo({ top: top() + (refs.journey.current?.offsetHeight ?? 0), behavior: behavior() }),
    [refs, top],
  );

  return { goToChapter, goToEnd };
}
