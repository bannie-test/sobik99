import { useCallback, useEffect, useState } from 'react';
import { loadSolveHistory, saveCompletedSolve, type CompletedSolve } from './solveHistory';

type SaveStatus = 'saving' | 'saved' | 'failed';

export interface SolveHistoryEntry {
  solve: CompletedSolve;
  status: SaveStatus;
}

export function useSolveHistory() {
  const [entries, setEntries] = useState<Record<string, SolveHistoryEntry>>({});
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let current = true;
    void loadSolveHistory().then((stored) => {
      if (!current) return;
      const saved = Object.fromEntries(stored.map((solve) => [solve.id, { solve, status: 'saved' as const }]));
      setEntries((previous) => ({ ...saved, ...previous }));
      setLoadStatus('ready');
    }, () => {
      if (current) setLoadStatus('failed');
    });
    return () => { current = false; };
  }, []);

  const save = useCallback((solve: CompletedSolve) => {
    const update = (status: SaveStatus) => setEntries((previous) => ({ ...previous, [solve.id]: { solve, status } }));
    update('saving');
    void saveCompletedSolve(solve).then(() => update('saved'), () => update('failed'));
  }, []);

  const history = Object.values(entries).sort((a, b) => b.solve.finishedAt.localeCompare(a.solve.finishedAt));
  return { history, loadStatus, save };
}
