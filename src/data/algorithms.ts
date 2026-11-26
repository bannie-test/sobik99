import raw from '../cube-tools/data/algorithms.js';
import { algorithmLabel, caseGroup, caseRecognition } from '../cube-tools/data/algorithm-text.js';
import { caseDiagram } from '../cube-tools/components/diagrams.js';
import { caseOf } from '../cube-tools/core/cfop.js';
import type { AlgorithmCase, CasePhase } from './types';

export const cases: AlgorithmCase[] = raw.map((entry) => {
  const type = entry.type as CasePhase;
  return {
    id: entry.id,
    name: entry.name,
    type,
    group: entry.group,
    group_vi: caseGroup(entry),
    recognition: caseRecognition(entry),
    moves: entry.algs.map(({ alg }) => alg),
    source: entry.algs[0]?.source ?? '',
    variants: entry.algs.map((algorithm) => {
      const classified = caseOf(type, algorithm.alg);
      const setup: string = 'setup' in classified ? classified.setup : entry.setup;
      return {
        alg: algorithm.alg,
        label: algorithmLabel(algorithm),
        setup: `z2 ${setup}`,
        image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(caseDiagram(entry, setup)),
      };
    }),
  };
});
