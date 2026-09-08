import { CheatRuntimeUnavailableError } from './game-context.js';

export function normalizeCheatActionOutcome(value) {
  if (value === false) return Object.freeze({ ok: false, kind: 'validation' });
  if (value === true || value == null) return Object.freeze({ ok: true, kind: 'success' });
  if (typeof value === 'object') {
    const ok = value.ok !== false;
    return Object.freeze({ kind: ok ? 'success' : 'validation', ...value, ok });
  }
  return Object.freeze({ ok: true, kind: 'success', value });
}

export function normalizeCheatActionError(error) {
  const blocked = error instanceof CheatRuntimeUnavailableError;
  return Object.freeze({
    ok: false,
    kind: blocked ? 'blocked' : 'error',
    variant: blocked ? 'warning' : 'error',
    message: error?.message ?? String(error),
    error,
  });
}
