import { useState } from 'react';
import type { AlgorithmCase } from '../../data/types';
import { useCopy } from '../../shared/hooks/useCopy';
import { t } from '../../cube-tools/utils/i18n.js';

interface Props {
  item: AlgorithmCase;
  learned: boolean;
  onPlay: (variant: number) => void;
  onToggleLearned: (id: string) => void;
}

export function CaseCard({ item, learned, onToggleLearned, onPlay }: Props) {
  const copy = useCopy();
  const [variantIndex, setVariantIndex] = useState(0);
  const variant = item.variants[variantIndex] ?? item.variants[0]!;
  const name = String(item.name);

  return (
    <article id={`case-${item.id}`} className="algorithm-card">
      <div className="case-heading">
        <strong>{name}</strong>
        <button
          className="learn-toggle"
          aria-pressed={learned}
          aria-label={`${t("Đánh dấu đã học", "Mark learned")} ${item.id}`}
          onClick={() => onToggleLearned(item.id)}
        >
          {learned ? '✓' : '○'}
        </button>
      </div>
      <img src={variant.image} alt={`${name} · ${t("Sơ đồ 2D, mặt vàng ở trên", "2D diagram, yellow on top")}`} loading="lazy" />
      <div className="case-recognition">
        <small>{item.group_vi}</small>
        {item.recognition && <details>
          <summary>{t('Cách nhận diện', 'Recognition')}</summary>
          <p>{item.recognition}</p>
        </details>}
      </div>
      <label className="variant-label">
        {t("Cách giải", "Variant")}
        <select value={variantIndex} onChange={(e) => setVariantIndex(Number(e.target.value))}>
          {item.variants.map((v, i) => (
            <option key={i} value={i}>
              {i + 1} · {v.label}
            </option>
          ))}
        </select>
      </label>
      <code>{variant.alg}</code>
      <div className="actions">
        <button className="small-button" onClick={() => copy(variant.alg)}>
          {t("Sao chép", "Copy")}
        </button>
        <button
          className="small-button primary"
          onClick={() => onPlay(variantIndex)}
        >
          {t("▶ Xem cách xoay", "▶ Watch algorithm")}
        </button>
      </div>
    </article>
  );
}
