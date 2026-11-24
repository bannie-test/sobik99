export async function loadCubingSearch() {
  const search = await import('cubing/search');
  // Vite emits the worker with a hashed name. Use cubing.js's bundler-aware lookup first.
  if (import.meta.env?.PROD) {
    search.setSearchDebug({ prioritizeEsbuildWorkaroundForWorkerInstantiation: true });
  }
  return search;
}

export async function randomScramble3x3() {
  await loadCubingSearch();
  const { randomScrambleForEvent } = await import('cubing/scramble');
  return (await randomScrambleForEvent('333')).toString();
}
