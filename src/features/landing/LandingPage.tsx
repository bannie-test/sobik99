import { useState, type CSSProperties } from 'react';
import { BrandOrbit } from './BrandOrbit';
import { PALETTES } from './content';
import { CubeJourney } from './CubeJourney';
import { HomeExplore } from './HomeExplore';
import { useReducedMotion } from './useReducedMotion';

/** Trang chủ: hành trình cuộn giải Rubik → carousel thương hiệu → lối vào các trang. */
export function LandingPage() {
  const [reduced, toggleMotion] = useReducedMotion();
  const [chapter, setChapter] = useState(0);
  const [page, disc] = PALETTES[chapter]!;

  return (
    <div
      id="sobik-orbit"
      className={reduced ? 'reduced' : undefined}
      style={{ '--page': page, '--disc': disc } as CSSProperties}
    >
      <div className="window">
        <CubeJourney chapter={chapter} onChapter={setChapter} reduced={reduced} onToggleMotion={toggleMotion} />
        <BrandOrbit reduced={reduced} />
        <HomeExplore />
      </div>
    </div>
  );
}
