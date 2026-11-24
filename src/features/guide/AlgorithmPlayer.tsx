import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import type { AlgorithmCase } from '../../data/types';
import { useCopy } from '../../shared/hooks/useCopy';
import { useModal } from '../../shared/ui/Modal';

export const puzzleId = (type: string): string =>
  (/^\dx\d$/.test(type) ? `${type[0]}x${type[0]}x${type[0]}` : type.toLowerCase());

export interface PlayRequest {
  alg: string;
  puzzle?: string;
  title?: string;
  setup?: string;
  maskLastLayer?: boolean;
}

function PlaybackModel({ alg, puzzle = '3x3', setup, maskLastLayer }: PlayRequest) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const host = ref.current!;
    const stage = document.createElement('div');
    host.append(stage);
    let active = true;
    let dispose: (() => void) | undefined;
    void (async () => {
      try {
        const [{ mountPlayer }, { Alg }] = await Promise.all([
          import('../../cube-tools/components/player.js'),
          import('cubing/alg'),
        ]);
        if (!active) return;
        const player = await mountPlayer(stage, {
          alg,
          puzzle: puzzleId(puzzle),
          setup: setup ?? new Alg(alg).invert().toString(),
          maskLastLayer,
        });
        if (!active) player?.destroy();
        else {
          dispose = player ? () => player.destroy() : undefined;
          setStatus(player ? 'ready' : 'error');
        }
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
      dispose?.();
      stage.remove();
    };
  }, [alg, maskLastLayer, puzzle, setup]);

  return <div id="player-mount" className="player-box">
    {status === 'loading' && <p role="status">{t('Đang tải mô hình…', 'Loading cube…')}</p>}
    <div ref={ref} className="playback-stage-host" />
    {status === 'error' && <p role="status">{t('Không tải được mô hình.', 'Could not load the cube.')}</p>}
  </div>;
}

function Playback({ request, previous, next, children }: {
  request: PlayRequest;
  previous?: () => void;
  next?: () => void;
  children?: React.ReactNode;
}) {
  const copy = useCopy();
  const { alg, title = t('Công thức', 'Algorithm'), setup } = request;
  return (
    <section className="algorithm-playback" aria-label={title}>
      <div className="playback-heading">
        <h2>{title}</h2>
        {(previous || next) && <div className="playback-nav">
          <button type="button" className="small-button" aria-label={t('Công thức trước', 'Previous algorithm')}
            disabled={!previous} onClick={previous}>←</button>
          <button type="button" className="small-button" aria-label={t('Công thức tiếp theo', 'Next algorithm')}
            disabled={!next} onClick={next}>→</button>
        </div>}
      </div>
      {children}
      <PlaybackModel key={`${request.puzzle}:${setup}:${alg}`} {...request} />
      <details className="playback-formula">
        <summary>{t('Công thức', 'Algorithm')}</summary>
        <div className="formula-row">
          <code>{alg}</code>
          <button className="small-button" onClick={() => copy(alg)}>{t('Sao chép', 'Copy')}</button>
        </div>
      </details>
    </section>
  );
}

function CasePlayback({ items, start, variantIndex }: {
  items: AlgorithmCase[];
  start: number;
  variantIndex: number;
}) {
  const [position, setPosition] = useState({ index: start, variantIndex });
  const item = items[position.index]!;
  const variant = item.variants[position.variantIndex]!;
  const previous = position.variantIndex > 0
    ? () => setPosition({ ...position, variantIndex: position.variantIndex - 1 })
    : position.index > 0
      ? () => setPosition({ index: position.index - 1, variantIndex: items[position.index - 1]!.variants.length - 1 })
      : undefined;
  const next = position.variantIndex < item.variants.length - 1
    ? () => setPosition({ ...position, variantIndex: position.variantIndex + 1 })
    : position.index < items.length - 1
      ? () => setPosition({ index: position.index + 1, variantIndex: 0 })
      : undefined;
  return <Playback request={{ ...variant, title: String(item.name), maskLastLayer: item.type === 'f2l' }} previous={previous} next={next}>
    <div className="playback-variant">
      <label className="variant-select">{t('Cách xoay', 'Variant')}
        <select value={position.variantIndex} onChange={(event) => setPosition({ ...position, variantIndex: Number(event.target.value) })}>
          {item.variants.map(({ label }, index) => <option key={index} value={index}>{index + 1} · {label}</option>)}
        </select>
      </label>
      <p>{t('Vàng trên, trắng dưới, xanh lá trước.', 'Yellow on top, white below, green in front.')}</p>
    </div>
  </Playback>;
}

export function AlgorithmPlayer(request: PlayRequest) {
  return <Playback request={request} />;
}

export function usePlayAlgorithm() {
  const modal = useModal();
  return useCallback((request: PlayRequest) => modal.open(<AlgorithmPlayer {...request} />), [modal]);
}

export function usePlayCase() {
  const modal = useModal();
  return useCallback((items: AlgorithmCase[], start: number, variantIndex = 0) => {
    modal.open(<CasePlayback items={items} start={start} variantIndex={variantIndex} />);
  }, [modal]);
}
