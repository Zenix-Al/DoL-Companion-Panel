import { createCheat } from '../../create-cheat.js';

const STATS = Object.freeze([
  'pain',
  'arousal',
  'tiredness',
  'stress',
  'trauma',
  'control',
  'drunk',
  'drugged',
  'hallucinogen',
]);
export const playerStatsCheat = createCheat({
  id: 'player.stats',
  location: { section: 'stats', group: 'player', order: 1 },
  meta: {
    label: 'Player Stats',
    controls: [
      { key: 'stat', type: 'select', options: STATS, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: STATS,
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set({ game, controls }) {
      const value = Number.parseFloat(controls.value('value'));
      if (Number.isNaN(value))
        return { ok: false, kind: 'validation', message: 'Value is not a number.' };
      game.set(controls.value('stat'), value);
      return { ok: true, message: 'Player stat updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.setValue('value', game.get(controls.value('stat')));
  },
});
