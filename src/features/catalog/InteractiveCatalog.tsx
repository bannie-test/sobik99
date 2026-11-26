import { useCallback } from 'react';
import { catalog, detail, getJSON } from '../../cube-tools/pages-catalog.js';
import { InteractiveView } from '../../shared/ui/InteractiveView';

const legacyProducts = new Map<string, readonly [string, string]>([
  ['gan17', ['gan', 'gan-17-magdrive']],
  ['gan16', ['gan', 'gan-16-maglev']],
  ['gan12', ['gan', 'gan-12-maglev']],
  ['rs3m-v5', ['moyu', 'moyu-rs3m-v5']],
  ['tornado-v3', ['x-man-design', 'x-man-tornado-v3-3x3-premium-pioneer-uv']],
  ['guhong-pro', ['dayan', 'dayan-guhong-pro-plus-maglev']],
  ['gan251', ['gan', 'gan-251m-pro']],
  ['gan-mega', ['gan', 'gan-megaminx-maglev']],
  ['gan-pyra', ['gan', 'gan-pyraminx-m']],
] as const);

export default function InteractiveCatalog({ query, brand, id }: {
  query?: URLSearchParams;
  brand?: string;
  id?: string;
}) {
  const search = query?.toString();
  const mount = useCallback(async (root: HTMLDivElement, isCurrent: () => boolean) => {
    if (!id) return catalog(root, new URLSearchParams(search));
    if (brand) return detail(root, brand, id, isCurrent);
    const alias = legacyProducts.get(id);
    if (alias) return detail(root, ...alias, isCurrent);
    // Resolve bookmarks from the original single-segment product route.
    const rows: { id: string; brand: string }[] = await getJSON('catalog/search.json');
    const match = rows.find((row) => row.id === id);
    if (isCurrent()) await detail(root, match?.brand ?? '', id, isCurrent);
  }, [brand, id, search]);
  return <InteractiveView mount={mount} />;
}
