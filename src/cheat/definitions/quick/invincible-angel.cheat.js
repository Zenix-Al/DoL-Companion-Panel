import { createCheat } from '../../create-cheat.js';

export const invincibleAngelCheat = createCheat({
  id: 'quick.invincible-angel',
  location: { section: 'quick', group: 'unlimited', order: 100 },
  meta: {
    label: 'Invincible Angel',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Protect',
        action: 'toggle',
        tooltip:
          'Prevents angel build from falling and helps prevent becoming a fallen angel. Combine it with Maintain Purity.',
      },
    ],
  },
  requiredPaths: ['penisstate', 'vaginastate', 'angel', 'angelbuild'],
  config: ['angel', 'angelMode'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 1, runOnActivate: true },
  effect({ game, config, feedback }) {
    if (game.get('demon') > 0) feedback.warning?.('You are currently a demon.');
    if (game.get('fallenangel') > 0) {
      throw new Error('Invincible Angel is unavailable after becoming a fallen angel.');
    }
    const transformed = game.get('penisstate') != 0 || game.get('vaginastate') != 0;
    if (transformed) {
      if (!config.get('angelMode')) return;
      config.set('angel', game.get('angel'));
      game.set('angel', 0);
      game.set('angelbuild', 100);
      config.set('angelMode', true);
    } else if (!config.get('angelMode')) {
      game.set('angel', config.get('angel'));
    }
  },
});
