import { createCheat } from '../../create-cheat.js';

const LOCK_JOB_ID = 'world.mc-pregnancy.lock';
const lockedDays = new Map();

function holeOptions({ game }) {
  return Object.entries(game.get('sexStats') ?? {})
    .filter(([, value]) => value?.pregnancy)
    .map(([key]) => key);
}

function pregnancyOptions({ game, controls }) {
  const pregnancy = game.get(`sexStats.${controls.value('hole')}.pregnancy`);
  if (pregnancy?.type === 'parasite') {
    return Object.entries(pregnancy.fetus ?? {}).map(([key, fetus]) => ({
      value: key,
      label: fetus?.creature ?? key,
    }));
  }
  return pregnancy?.timerEnd != null ? [{ value: 'baby', label: 'Baby' }] : [];
}

function lockKey(hole, type, pregnancy) {
  return `${hole}:${type ?? 'pregnancy'}:${pregnancy}`;
}

function applyDays(game, { hole, pregnancy: selected, days }) {
  const pregnancy = game.get(`sexStats.${hole}.pregnancy`);
  if (!pregnancy) return false;
  if (pregnancy.type === 'parasite') {
    if (!pregnancy.fetus?.[selected]) return false;
    game.set(`sexStats.${hole}.pregnancy.fetus.${selected}.daysLeft`, days);
  } else {
    if (!Number.isFinite(pregnancy.timerEnd)) return false;
    game.set(`sexStats.${hole}.pregnancy.timer`, Math.max(0, pregnancy.timerEnd - days * 3));
  }
  return true;
}

function syncSchedule({ game, services }) {
  services.scheduler?.unregister(LOCK_JOB_ID, { cadence: 'frame' });
  if (!lockedDays.size) return;
  services.scheduler?.register(
    LOCK_JOB_ID,
    () => {
      for (const lock of lockedDays.values()) applyDays(game, lock);
    },
    { cadence: 'frame', cooldownMs: 100, maxFailures: 5 }
  );
}

export const mcPregnancyCheat = createCheat({
  id: 'world.mc-pregnancy',
  location: { section: 'misc', group: 'pregnancy', order: 40 },
  meta: {
    label: 'MC Pregnancy',
    controls: [
      { key: 'hole', type: 'select', options: holeOptions, action: 'select' },
      { key: 'pregnancy', type: 'select', options: pregnancyOptions, action: 'select' },
      { key: 'days', type: 'input' },
      { key: 'locked', type: 'toggle', label: 'Lock pregnancy' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['sexStats'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set(context) {
      const hole = context.controls.value('hole');
      const selected = context.controls.value('pregnancy');
      const days = Number.parseInt(context.controls.value('days'), 10);
      const type = context.game.get(`sexStats.${hole}.pregnancy.type`);
      if (
        !hole ||
        !selected ||
        Number.isNaN(days) ||
        !applyDays(context.game, { hole, pregnancy: selected, days })
      )
        return { ok: false, kind: 'validation', message: 'MC pregnancy data is unavailable.' };
      const key = lockKey(hole, type, selected);
      if (context.controls.checked('locked'))
        lockedDays.set(key, { hole, pregnancy: selected, days });
      else lockedDays.delete(key);
      syncSchedule(context);
      return { ok: true, message: 'MC pregnancy updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    const hole = controls.value('hole');
    const selected = controls.value('pregnancy');
    const pregnancy = game.get(`sexStats.${hole}.pregnancy`);
    const days =
      pregnancy?.type === 'parasite'
        ? pregnancy?.fetus?.[selected]?.daysLeft
        : Number.isFinite(pregnancy?.timerEnd - pregnancy?.timer)
        ? (pregnancy.timerEnd - pregnancy.timer) / 3
        : '';
    controls.setValue('days', days ?? '');
    controls.setValue('locked', lockedDays.has(lockKey(hole, pregnancy?.type, selected)));
  },
  onEnable(context) {
    syncSchedule(context);
    return () => context.services.scheduler?.unregister(LOCK_JOB_ID, { cadence: 'frame' });
  },
});
