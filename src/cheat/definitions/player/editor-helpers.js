export function hydrateSelectedValue({ game, controls, path }) {
  controls.setValue('value', game.get(path(controls.value('field'))) ?? '');
}

export function setSelectedNumber({ game, controls, path, label, requireExisting = true }) {
  const field = controls.value('field');
  const value = Number(controls.value('value'));
  if (!field || !Number.isFinite(value))
    return { ok: false, kind: 'validation', message: `${label} must be a number.` };
  const target = path(field);
  if (requireExisting && !game.has(target))
    return { ok: false, kind: 'validation', message: `${label} is unavailable.` };
  game.set(target, value);
  return { ok: true, message: `${label} updated.`, refresh: true };
}

export function selectAndRefresh() {
  return { ok: true, refresh: true };
}
