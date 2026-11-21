import { useCallback, useEffect, useRef, useState } from 'react';
import { useCopy } from '../../shared/hooks/useCopy';
import { useModal } from '../../shared/ui/Modal';

/** "3x3" → "3x3x3"; "Megaminx" → "megaminx" (id puzzle của cubing.js). */
export const puzzleId = (t: string): string => (/^\dx\d$/.test(t) ? `${t[0]}x${t[0]}x${t[0]}` : t.toLowerCase());

const supportsWebGL2 = (): boolean => {
  const gl = document.createElement('canvas').getContext('webgl2');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return Boolean(gl);
};

type MountState = 'loading' | 'ready' | 'ready-2d' | 'error';

export interface PlayRequest {
  alg: string;
  puzzle?: string;
  title?: string;
  /** Trạng thái đầu; mặc định là nghịch đảo của công thức. */
  setup?: string;
}

/** Hộp thoại xem từng bước xoay bằng TwistyPlayer (cubing.js tải khi cần). */
export function AlgorithmPlayer({ alg, puzzle = '3x3', title = 'Công thức', setup }: PlayRequest) {
  const copy = useCopy();
  const mountRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MountState>('loading');

  useEffect(() => {
    let disposed = false;
    let player: HTMLElement | undefined;
    (async () => {
      try {
        const [{ TwistyPlayer }, { Alg }] = await Promise.all([import('cubing/twisty'), import('cubing/alg')]);
        if (disposed) return;
        const webgl = supportsWebGL2();
        player = new TwistyPlayer({
          puzzle: puzzleId(puzzle) as never,
          alg,
          experimentalSetupAlg: setup || new Alg(alg).invert().toString(),
          background: 'none',
          controlPanel: 'bottom-row',
          visualization: webgl ? '3D' : '2D',
          hintFacelets: 'floating',
          viewerLink: 'none',
        });
        mountRef.current?.append(player);
        setState(webgl ? 'ready' : 'ready-2d');
      } catch {
        if (!disposed) setState('error');
      }
    })();
    return () => {
      disposed = true;
      player?.remove();
    };
  }, [alg, puzzle, setup]);

  return (
    <>
      <small>THẤY TỪNG CHUYỂN ĐỘNG</small>
      <h2>{title}</h2>
      <p>
        Trạng thái đầu được dựng từ nghịch đảo công thức. Bấm Play hoặc bước từng nước để xem cách trở về trạng thái đã
        giải.
      </p>
      <div id="player-mount">
        {state === 'loading' && <p>Đang tải mô hình…</p>}
        {/* React không render con vào div này: TwistyPlayer được gắn thủ công. */}
        <div ref={mountRef} />

        {state === 'ready-2d' && (
          <p className="muted">Thiết bị không hỗ trợ WebGL: đang dùng sơ đồ 2D tương tác với cùng các bước xoay.</p>
        )}
        {state === 'error' && <p>Không tải được mô hình. Bạn vẫn có thể sao chép công thức và luyện bằng khối thật.</p>}
      </div>
      <code className="alg-large">{alg}</code>
      <button className="button secondary" id="copy-player" onClick={() => copy(alg)}>
        Sao chép
      </button>
      <p className="muted">
        Hướng nhìn có thể thay đổi khi công thức có x/y/z. Điều chỉnh U cuối cùng (AUF) theo khối thực của bạn.
      </p>
    </>
  );
}

export function usePlayAlgorithm(): (request: PlayRequest) => void {
  const modal = useModal();
  return useCallback((request: PlayRequest) => modal.open(<AlgorithmPlayer {...request} />), [modal]);
}
