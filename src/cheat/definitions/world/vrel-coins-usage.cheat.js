import { createCheat } from '../../create-cheat.js';

const PATH = 'featsBoosts.pointsUsed';

export const vrelCoinsUsageCheat = createCheat({
  id: 'world.vrel-coins-usage',
  location: { section: 'misc', group: 'mod-integration', order: 140 },
  meta: {
    label: 'Reset Vrel Coins Usage',
    controls: [
      { key: 'current', type: 'text' },
      { key: 'reset', type: 'button', label: 'Reset', action: 'reset' },
    ],
  },
  requiredPaths: [PATH],
  isApplicable({ game }) {
    return Number.isFinite(game.get(PATH));
  },
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    reset({ game }) {
      game.set(PATH, 0);
      return { ok: true, message: 'Vrel coins usage reset.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text('current', game.get(PATH));
  },
});
