export function hydrateInput({ game, controls, control = 'value', path }) {
  controls.setValue(control, game.get(path) ?? '');
}

export function setInteger({ game, controls, path, label, control = 'value' }) {
  const raw = controls.value(control);
  const value = Number(raw);
  if (String(raw).trim() === '' || !Number.isInteger(value))
    return { ok: false, kind: 'validation', message: `${label} must be an integer.` };
  if (!game.has(path))
    return { ok: false, kind: 'validation', message: `${label} is unavailable.` };
  game.set(path, value);
  return { ok: true, message: `${label} updated.`, refresh: true };
}

export function selectAndRefresh() {
  return { ok: true, refresh: true };
}
