import { createCheat } from '../../create-cheat.js';

export const randomEncountersCheat = createCheat({
  id: 'quick.random-encounters',
  location: { section: 'quick', group: 'state', order: 80 },
  meta: {
    label: 'Random Encounters',
    controls: [{ key: 'toggle', type: 'button', label: 'Enable', action: 'toggle' }],
  },
  refresh: ['mount', 'section-open', 'after-action', 'runtime-tick'],
  actions: {
    toggle({ game }) {
      const enabled = game.get('alluremod') === 0;
      game.set('alluremod', enabled ? 1 : 0);
      return {
        ok: true,
        message: `Random encounters ${enabled ? 'enabled' : 'disabled'}.`,
        refresh: true,
      };
    },
  },
  sync({ game, controls }) {
    controls.text('toggle', game.get('alluremod') === 1 ? 'Enabled' : 'Disabled');
  },
});
