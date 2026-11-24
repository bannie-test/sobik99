export type PuzzleType = '2x2' | '3x3' | '4x4' | '5x5' | '6x6' | '7x7' | 'Megaminx' | 'Pyraminx';

export type CasePhase = 'f2l' | 'oll' | 'pll';

export interface CaseVariant {
  alg: string;
  setup: string;
  image: string;
  label: string;
}

export interface AlgorithmCase {
  id: string;
  name: number | string;
  type: CasePhase;
  group: string;
  group_vi: string;
  recognition?: string;
  moves: string[];
  source: string;
  rotatedAlternative?: boolean;
  variants: CaseVariant[];
}
