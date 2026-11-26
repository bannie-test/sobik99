import { isCubeMove, type CubeMove } from './shortcuts';

const SOURCES = ['keyboard', 'camera', 'formula'] as const;
export type TurnSource = (typeof SOURCES)[number];

export interface RecordedTurn {
  move: CubeMove;
  viewMove?: CubeMove;
  source: TurnSource;
  atMs: number;
}

export interface CompletedSolve {
  id: string;
  finishedAt: string;
  scramble: CubeMove[];
  turns: RecordedTurn[];
  durationMs: number;
}

const STORE = 'solves';

function openHistory(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sobik_simulator', 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Simulator history is blocked'));
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
  });
}

async function historyRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openHistory();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error('History request aborted'));
    });
  } finally {
    db.close();
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

function validSolve(value: unknown): value is CompletedSolve {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.finishedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.finishedAt)) || typeof value.durationMs !== 'number' ||
      !Number.isFinite(value.durationMs) || value.durationMs < 0 ||
      !Array.isArray(value.scramble) || !value.scramble.length ||
      !value.scramble.every((move: unknown) => typeof move === 'string' && isCubeMove(move)) ||
      !Array.isArray(value.turns) || !value.turns.length) return false;

  const duration = value.durationMs;
  let last = 0;
  return value.turns.every((turn: unknown) => {
    if (!isRecord(turn) || typeof turn.move !== 'string' || !isCubeMove(turn.move) ||
        (turn.viewMove !== undefined && (typeof turn.viewMove !== 'string' || !isCubeMove(turn.viewMove))) ||
        !SOURCES.includes(turn.source as TurnSource) || typeof turn.atMs !== 'number' ||
        !Number.isFinite(turn.atMs) || turn.atMs < last || turn.atMs > duration) return false;
    last = turn.atMs;
    return true;
  });
}

export async function loadSolveHistory(): Promise<CompletedSolve[]> {
  const entries: unknown[] = await historyRequest('readonly', (store) => store.getAll());
  return entries.filter(validSolve);
}

export async function saveCompletedSolve(solve: CompletedSolve): Promise<void> {
  await historyRequest('readwrite', (store) => store.put(solve));
}
