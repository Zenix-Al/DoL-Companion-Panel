import { createCheat } from '../../create-cheat.js';

function percentage(controls) {
  const value = Number(controls.value('percentage'));
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

export const arousalCheat = createCheat({
  id: 'quick.arousal',
  location: { section: 'quick', group: 'state', order: 10 },
  meta: {
    label: 'Arousal',
    controls: [
      { key: 'percentage', type: 'range', value: 0, action: 'preview', event: 'input' },
      { key: 'current', type: 'text', label: '0%', intent: 'status' },
      { key: 'player', type: 'button', label: 'Player', action: 'player' },
      { key: 'enemy', type: 'button', label: 'Enemy', action: 'enemy' },
    ],
  },
  refresh: ['mount', 'section-open'],
  actions: {
    preview() {
      return { ok: true, refresh: true };
    },
    player({ game, controls }) {
      const value = percentage(controls);
      if (value == null)
        return { ok: false, kind: 'validation', message: 'Arousal must be a number.' };
      game.set('arousal', Math.trunc((10000 * value) / 100));
      return { ok: true, message: 'Player arousal updated.', refresh: true };
    },
    enemy({ game, controls }) {
      const value = percentage(controls);
      if (value == null)
        return { ok: false, kind: 'validation', message: 'Arousal must be a number.' };
      game.set('enemyarousal', Math.trunc(((game.get('enemyarousalmax') || 0) * value) / 100));
      return { ok: true, message: 'Enemy arousal updated.', refresh: true };
    },
  },
  sync({ controls }) {
    controls.text('current', `${controls.value('percentage')}%`);
  },
});
