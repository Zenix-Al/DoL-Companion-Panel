import { createCheat } from '../../create-cheat.js';

function locationOptions({ game }) {
  return Object.entries(game.get('container') ?? {})
    .filter(([, value]) => value?.creatures)
    .map(([key]) => key);
}

function creatureOptions({ game, controls }) {
  return Object.entries(game.get(`container.${controls.value('location')}.creatures`) ?? {})
    .filter(([, creature]) => creature)
    .map(([key, creature]) => ({ value: key, label: creature.creature ?? key }));
}

export const mcTentacleCheat = createCheat({
  id: 'world.mc-tentacle',
  location: { section: 'misc', group: 'offspring', order: 50 },
  meta: {
    label: 'MC Tentacle Pregnancy',
    controls: [
      { key: 'location', type: 'select', options: locationOptions, action: 'select' },
      { key: 'creature', type: 'select', options: creatureOptions, action: 'select' },
      { key: 'speed', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['container'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set({ game, controls }) {
      const path = `container.${controls.value('location')}.creatures.${controls.value(
        'creature'
      )}.stats.speed`;
      const speed = Number.parseInt(controls.value('speed'), 10);
      if (!game.has(path) || Number.isNaN(speed))
        return { ok: false, kind: 'validation', message: 'Tentacle data is unavailable.' };
      game.set(path, speed);
      return { ok: true, message: 'Tentacle pregnancy speed updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.setValue(
      'speed',
      game.get(
        `container.${controls.value('location')}.creatures.${controls.value(
          'creature'
        )}.stats.speed`
      ) ?? ''
    );
  },
});
