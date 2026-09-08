import { createCheat } from '../../create-cheat.js';

let temporaryArousal = 0;
let previousOrgasmDown = -1;

export const intenseCumCheat = createCheat({
  id: 'quick.intense-cum',
  location: { section: 'quick', group: 'unlimited', order: 80 },
  meta: {
    label: 'Intense Cum',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Intense', action: 'toggle' }],
  },
  requiredPaths: ['orgasmcurrent', 'orgasmdown', 'arousal'],
  config: ['orgasmCount', 'unlicumMode'],
  toggle: { cadence: 'frame', cooldownMs: 80, maxFailures: 5, runOnActivate: true },
  effect({ game, config }) {
    if (game.get('orgasmcurrent') != 0 && !config.get('unlicumMode')) {
      config.set('orgasmCount', 0);
      temporaryArousal = game.get('arousal');
      game.set('orgasmdown', 1000);
      previousOrgasmDown = 1000;
      config.set('unlicumMode', true);
      return;
    }
    if (game.get('orgasmdown') >= previousOrgasmDown || !config.get('unlicumMode')) return;
    previousOrgasmDown = game.get('orgasmdown');
    game.set('arousal', temporaryArousal);
    const count = config.get('orgasmCount') + 1;
    config.set('orgasmCount', count);
    if (count <= 2) return;
    config.set('unlicumMode', false);
    config.set('orgasmCount', 0);
    game.set('orgasmdown', -1);
    game.set('orgasmcurrent', 0);
    previousOrgasmDown = -1;
  },
});
