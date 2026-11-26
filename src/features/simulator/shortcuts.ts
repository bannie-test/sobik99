import { read } from '../../shared/lib/storage';

const FAMILIES = ['R', 'L', 'U', 'D', 'F', 'B', 'r', 'l', 'u', 'd', 'f', 'b', 'M', 'E', 'S', 'x', 'y', 'z'] as const;
const SUFFIXES = ['', "'", '2'] as const;
export type CubeMove = `${(typeof FAMILIES)[number]}${(typeof SUFFIXES)[number]}`;
export type Shortcuts = Partial<Record<CubeMove, string>>;

export const MOVE_ROWS = FAMILIES.map((family) => SUFFIXES.map((suffix): CubeMove => `${family}${suffix}`));
const MOVES = new Set<string>(MOVE_ROWS.flat());
const KEY_PATTERN = /^(?:[A-Z0-9]|Shift\+[A-Z])$/;
export const SHORTCUTS_KEY = 'sobik_simulator_shortcuts';

const FACE_KEYS = 'RLUDFBTHIJKNMESXYZ';
const HALF_TURN_KEYS = '1234567890ACGOPQVW';
const DEFAULT_SHORTCUTS = Object.fromEntries(MOVE_ROWS.flatMap((moves, index) => [
  [moves[0], FACE_KEYS[index]!],
  [moves[1], `Shift+${FACE_KEYS[index]}`],
  [moves[2], HALF_TURN_KEYS[index]!],
])) as Record<CubeMove, string>;

export function defaultShortcuts(): Shortcuts {
  return { ...DEFAULT_SHORTCUTS };
}

export function formatMoveNotation(text: string): string {
  return text.replace(/(^|\s)([rludfb])(?=[2']?(?:\s|$))/g,
    (_, prefix: string, face: string) => `${prefix}w${face.toUpperCase()}`);
}

export function isCubeMove(value: string): value is CubeMove {
  return MOVES.has(value);
}

export function parseMoveList(text: string): CubeMove[] | null {
  if (!text.trim()) return null;
  const moves = text.trim().replace(/[’′]/g, "'").split(/\s+/).map((token) =>
    token.replace(/^(?:w([RLUDFB])|([RLUDFB])w)(?=[2']?$)/,
      (_, prefixFace: string | undefined, suffixFace: string | undefined) => (prefixFace ?? suffixFace)!.toLowerCase()),
  );
  return moves.every(isCubeMove) ? moves : null;
}

export function duplicateShortcuts(shortcuts: Shortcuts): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of Object.values(shortcuts)) {
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
}

export function loadShortcuts(): Shortcuts {
  const saved = read<Shortcuts>(SHORTCUTS_KEY, {}, (value) => (
    typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.entries(value).every(([move, key]) => isCubeMove(move) && typeof key === 'string' && KEY_PATTERN.test(key)) &&
    duplicateShortcuts(value as Shortcuts).size === 0
  ));
  const result = { ...saved };
  const used = new Set(Object.values(saved));
  const moves = MOVE_ROWS.flat();
  for (const move of moves) {
    const key = DEFAULT_SHORTCUTS[move];
    if (result[move] || used.has(key)) continue;
    result[move] = key;
    used.add(key);
  }
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const available = [...letters, ...'0123456789', ...letters.map((key) => `Shift+${key}`)]
    .filter((key) => !used.has(key));
  for (const move of moves) {
    if (!result[move]) result[move] = available.shift()!;
  }
  return result;
}

export function shortcutFromEvent(event: KeyboardEvent): string | undefined {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const key = /^[a-z0-9]$/i.test(event.key) ? event.key.toUpperCase() : '';
  const shortcut = event.shiftKey ? `Shift+${key}` : key;
  return KEY_PATTERN.test(shortcut) ? shortcut : undefined;
}
