import { cubes } from '../../data/cubes';
import type { Cube } from '../../data/types';
import { money } from '../../shared/lib/format';
import { CubeArt } from '../../shared/ui/CubeArt';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { CompareButton } from '../compare/CompareButton';
import { useCheckout } from './useCheckout';

export function ProductCard({ cube }: { cube: Cube }) {
  const checkout = useCheckout();
  const index = cubes.indexOf(cube);
  const href = `#/cube/${cube.id}`;
  const source = cube.sources[0];
  return (
    <article className="product-card">
      <a href={href} className={`product-image tone-${index % 5}`}>
        <CubeArt type={cube.type} tone={index} />
        <span className="type-chip">{cube.type}</span>
      </a>
      <div className="product-info">
        <small>{cube.brand}</small>
        <a href={href}>
          <h3>{cube.name}</h3>
        </a>
        <p>{cube.summary}</p>
        <div className="product-tags">
          {cube.specs.maglev && <span>MagLev</span>}
          {cube.specs.core_magnets && <span>Lõi từ</span>}
          {cube.specs.magnetic && <span>Nam châm</span>}
        </div>
        <div className="price">
          {money(cube.price_fake)} <small>DEMO</small>
        </div>
        <div className="product-actions">
          <CompareButton id={cube.id} className="small-button" />
          <button className="small-button primary" onClick={() => checkout(cube.id)}>
            Mua demo ↗
          </button>
        </div>
        <ExternalLink className="source-link" href={source.url}>
          ⓘ Nguồn: {source.name}
        </ExternalLink>
      </div>
    </article>
  );
}
