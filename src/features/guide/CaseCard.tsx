import { useState } from 'react';
import type { AlgorithmCase } from '../../data/types';
import { useCopy } from '../../shared/hooks/useCopy';
import { usePlayAlgorithm } from './AlgorithmPlayer';

interface Props {
  item: AlgorithmCase;
  learned: boolean;
  onToggleLearned: (id: string) => void;
}

const assetUrl = (path: string) => import.meta.env.BASE_URL + path;

export function CaseCard({ item, learned, onToggleLearned }: Props) {
  const copy = useCopy();
  const play = usePlayAlgorithm();
  const [variantIndex, setVariantIndex] = useState(0);
  const variant = item.variants[variantIndex] ?? item.variants[0]!;
  const name = `${item.type.toUpperCase()} ${item.name}`;

  return (
    <article className="algorithm-card">
      <div className="case-heading">
        <strong>{name}</strong>
        <button
          className="learn-toggle"
          aria-pressed={learned}
          aria-label={`Đánh dấu đã học ${item.id}`}
          onClick={() => onToggleLearned(item.id)}
        >
          {learned ? '✓' : '○'}
        </button>
      </div>
      <img src={assetUrl(variant.image)} alt={`Trạng thái ${name}, mặt U ở trên`} loading="lazy" />
      <small>{item.group_vi}</small>
      <label className="variant-label">
        Cách giải
        <select value={variantIndex} onChange={(e) => setVariantIndex(Number(e.target.value))}>
          {item.variants.map((v, i) => (
            <option key={i} value={i}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <code>{variant.alg}</code>
      <div className="actions">
        <button className="small-button" onClick={() => copy(variant.alg)}>
          Sao chép
        </button>
        <button
          className="small-button primary"
          onClick={() =>
            play({ alg: variant.alg, puzzle: '3x3', title: `${name} · ${variant.label}`, setup: variant.setup })
          }
        >
          ▶ Xem cách xoay
        </button>
      </div>
    </article>
  );
}
