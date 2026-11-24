import { useCallback } from 'react';
import { solvePage } from '../../cube-tools/pages-solve.js';
import { InteractiveView } from '../../shared/ui/InteractiveView';

export default function SolvePage({ query }: { query: URLSearchParams }) {
  const search = query.toString();
  const mount = useCallback((root: HTMLDivElement) => solvePage(root, new URLSearchParams(search)), [search]);
  return <InteractiveView mount={mount} />;
}
