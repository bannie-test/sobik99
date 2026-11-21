import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { CHAPTERS, LAST_CHAPTER, stories } from './content';
import {
  cubeTimeline,
  FACE_COLORS,
  FACE_LABELS,
  FACE_NORMALS,
  INNER_COLOR,
  isOutside,
  netColors,
  solvedFaceCount,
} from './cubeEngine';
import { useScrollJourney, type JourneyRefs } from './useScrollJourney';

const HALF = 29;
const FACE_TRANSFORMS = [
  `translateZ(${HALF}px)`,
  `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
];

interface Props {
  chapter: number;
  onChapter: (chapter: number) => void;
  reduced: boolean;
  onToggleMotion: () => void;
}

/** Sơ đồ trải phẳng 6 mặt theo bước giải hiện tại. */
function CubeNet({ colors }: { colors: string[][] }) {
  return (
    <div className="net" aria-label={`${solvedFaceCount(colors)}/6 mặt đã hoàn thành`}>
      {colors.map((face, i) => (
        <div key={FACE_LABELS[i]} className="net-face">
          {face.map((color, j) => (
            <i key={j} style={{ background: color }}></i>
          ))}
          <span>{FACE_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** Phần "sân khấu" dính màn hình: Rubik được giải dần theo cuộn qua 6 chương. */
export function CubeJourney({ chapter, onChapter, reduced, onToggleMotion }: Props) {
  const timeline = useMemo(() => cubeTimeline(), []);
  const [step, setStep] = useState(0);

  const journey = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const cube = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cubies = useRef<(HTMLDivElement | null)[]>([]);
  const refs = useMemo<JourneyRefs>(() => ({ journey, stage, scene, cube, disc, track, cubies }), []);

  const { goToChapter, goToEnd } = useScrollJourney(refs, { timeline, reduced, onChapter, onStep: setStep });

  const net = useMemo(() => netColors(timeline.states[step]!), [timeline, step]);
  const done = chapter === LAST_CHAPTER;
  const total = timeline.turns.length;
  const storyNodes = stories({ goToChapter, goToEnd });

  return (
    <div className="journey" ref={journey}>
      <div className="stage" ref={stage}>
        <div className="stage-top">
          <span>THE CUBE CLUB / TỪ HÌNH HỌC ĐẾN TỐC ĐỘ</span>
          <button className="motion" aria-pressed={reduced} onClick={onToggleMotion}>
            {reduced ? 'Bật chuyển động' : 'Giảm chuyển động'}
          </button>
        </div>
        <div className="stage-body">
          <div className="stories">
            {storyNodes.map((node, i) => (
              <article key={i} className="story" hidden={i !== chapter}>
                {node}
              </article>
            ))}
          </div>
          <div className="visual" role="img" aria-label="Rubik xáo trộn được giải dần theo cuộn">
            <div className="disc" ref={disc}></div>
            <div className="orbit orbit-a"></div>
            <div className="orbit orbit-b"></div>
            <span className="spark s1" aria-hidden="true">
              ✳
            </span>
            <span className="spark s2" aria-hidden="true">
              +
            </span>
            <span className="spark s3" aria-hidden="true">
              ✦
            </span>
            <div className="scene" ref={scene}>
              <div className="cube" ref={cube}>
                {timeline.solved.map((c, i) => (
                  <div
                    key={i}
                    className="cubie"
                    ref={(el) => {
                      cubies.current[i] = el;
                    }}
                  >
                    {FACE_NORMALS.map((_, f) => (
                      <div
                        key={f}
                        className="face"
                        style={
                          {
                            transform: FACE_TRANSFORMS[f],
                            '--fc': isOutside(c.home, f) ? FACE_COLORS[f] : INNER_COLOR,
                          } as CSSProperties
                        }
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <span className="floating-label label-a">
              {done ? '✦ HOÀN THÀNH 6 MẶT ✦' : 'MỖI VÒNG XOAY · MỘT BƯỚC TIẾN'}
            </span>
            <span className="floating-label label-b">{done ? 'CUỘN TIẾP → CUBE CLUB' : 'CUỘN XUỐNG ĐỂ GIẢI'}</span>
            <span className="era" aria-hidden="true">
              {step === total ? '6 / 6 · SOLVED' : `${step} / ${total} VÒNG XOAY`}
            </span>
            <CubeNet colors={net} />
          </div>
        </div>
        <div className="chapter-bar">
          <span className="chapter-count">0{chapter + 1} / 06</span>
          <div className="chapters" aria-label="Chọn chương">
            {CHAPTERS.map((label, i) => (
              <button key={label} aria-current={i === chapter ? 'step' : undefined} onClick={() => goToChapter(i)}>
                {label}
              </button>
            ))}
          </div>
          <span className="scroll-hint">CUỘN ĐỂ XOAY ↓</span>
        </div>
        <div className="scroll-track">
          <div ref={track}></div>
        </div>
      </div>
    </div>
  );
}
