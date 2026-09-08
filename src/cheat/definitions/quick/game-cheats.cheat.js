import { createCheat } from '../../create-cheat.js';

function documentOf(controls) {
  return controls.element('open').ownerDocument;
}

export const gameCheatsCheat = createCheat({
  id: 'quick.game-cheats',
  location: { section: 'quick', group: 'state', order: 70 },
  meta: {
    label: 'In-game Cheats',
    controls: [
      { key: 'toggle', type: 'button', label: 'Enable', action: 'toggle' },
      { key: 'open', type: 'button', label: 'Open', action: 'open' },
    ],
  },
  refresh: ['mount', 'section-open', 'after-action', 'runtime-tick'],
  actions: {
    toggle({ game }) {
      const enabled = game.get('debug') !== 1;
      game.set('debug', enabled ? 1 : 0);
      return {
        ok: true,
        message: `In-game cheats ${enabled ? 'enabled' : 'disabled'}.`,
        refresh: true,
      };
    },
    open({ game, controls }) {
      const button = [
        ...(documentOf(controls)
          .getElementById('overlayButtons')
          ?.querySelectorAll?.('.link-internal') ?? []),
      ].find((candidate) => candidate.textContent?.trim() === 'CHEATS');
      if (!button) {
        return {
          ok: false,
          kind: 'blocked',
          message:
            game.get('debug') === 1
              ? 'Change passage once, then try opening cheats again.'
              : 'Enable in-game cheats first.',
        };
      }
      controls.element('open').getRootNode()?.querySelector?.('#close-modal-top')?.click();
      button.click();
      return { ok: true };
    },
  },
  sync({ game, controls }) {
    controls.text('toggle', game.get('debug') === 1 ? 'Disable' : 'Enable');
  },
});
