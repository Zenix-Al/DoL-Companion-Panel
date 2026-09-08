import { bodyparts, parasitename } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

export const parasitesCheat = createCheat({
  id: 'player.parasites',
  location: { section: 'stats', group: 'player', order: 70 },
  meta: {
    label: 'Parasite',
    controls: [
      { key: 'parasite', type: 'select', options: parasitename },
      { key: 'body', type: 'select', options: bodyparts },
      { key: 'infect', type: 'button', label: 'Infect', action: 'infect' },
      { key: 'remove', type: 'button', label: 'Remove', action: 'remove' },
    ],
  },
  requiredPaths: ['parasite'],
  actions: {
    infect({ game, controls }) {
      const parasite = controls.value('parasite');
      const body = controls.value('body');
      const locations = game.get(`parasite.${parasite}`);
      if (!Array.isArray(locations) || game.get(`parasite.${body}`) == null)
        return { ok: false, kind: 'blocked', message: 'Parasite data is unavailable.' };
      if (!locations.includes(body)) game.set(`parasite.${parasite}`, [...locations, body]);
      game.set(`parasite.${body}.name`, parasite);
      return { ok: true, message: 'Parasite infected.' };
    },
    remove({ game, controls }) {
      const parasite = controls.value('parasite');
      const body = controls.value('body');
      const locations = game.get(`parasite.${parasite}`);
      if (!Array.isArray(locations))
        return { ok: false, kind: 'blocked', message: 'Parasite data is unavailable.' };
      game.set(`parasite.${body}`, []);
      game.set(
        `parasite.${parasite}`,
        locations.filter((item) => item !== body)
      );
      return { ok: true, message: 'Parasite removed.' };
    },
  },
});
