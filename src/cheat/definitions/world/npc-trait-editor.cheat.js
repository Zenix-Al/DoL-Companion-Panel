import { npctrait } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

function npcOptions({ game }) {
  const configured = game.setup('NPCNameList');
  const names = Array.isArray(configured)
    ? configured
    : (game.get('NPCName') ?? []).map(({ nam, description }) => nam ?? description);
  return names.map((name) => ({ value: name, label: name }));
}

function selectedNpc({ game, controls }) {
  const list = game.get('NPCName') ?? [];
  const selectedName = controls.value('npc');
  const index = list.findIndex(
    ({ nam, description }) => nam === selectedName || description === selectedName
  );
  return { index, npc: list[index] };
}

export const npcTraitEditorCheat = createCheat({
  id: 'world.npc-trait-editor',
  location: { section: 'misc', group: 'npc', order: 5 },
  meta: {
    label: 'NPC Manager',
    controls: [
      {
        key: 'npc',
        type: 'select',
        options: npcOptions,
        fallbackOptions: [{ value: '', label: 'No NPC data' }],
        action: 'select',
      },
      { key: 'trait', type: 'select', options: npctrait, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['NPCName'],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set(context) {
      const { index, npc } = selectedNpc(context);
      const trait = context.controls.value('trait');
      const value = Number.parseInt(context.controls.value('value'), 10);
      if (!npc || !Object.hasOwn(npc, trait))
        return { ok: false, kind: 'validation', message: 'NPC trait is unavailable.' };
      if (Number.isNaN(value))
        return { ok: false, kind: 'validation', message: 'Input is not a number.' };
      context.game.set(`NPCName.${index}.${trait}`, value);
      return { ok: true, message: 'NPC trait updated.', refresh: true };
    },
  },
  sync(context) {
    const { npc } = selectedNpc(context);
    const trait = context.controls.value('trait');
    context.controls.setValue('value', npc?.[trait] ?? '');
  },
});
