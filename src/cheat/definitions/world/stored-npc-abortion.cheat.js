import { createCheat } from '../../create-cheat.js';

import {
  confirmed,
  destructiveConfirmation,
  fetusOptions,
  removeFetus,
} from './pregnancy-editor-helpers.js';

function entries(context) {
  const gameEntries = Object.entries(context.game.get('storedNPCs') ?? {}).map(([key, npc]) => ({
    source: 'game',
    key,
    npc,
  }));
  const configEntries = Object.entries(context.config.get('storedNPCs') ?? {}).map(
    ([key, npc]) => ({ source: 'config', key, npc })
  );
  return [...gameEntries, ...configEntries].filter(({ npc }) =>
    Array.isArray(npc?.pregnancy?.fetus)
  );
}

function npcOptions(context) {
  return entries(context).map(({ source, key, npc }, index) => ({
    value: `${source}:${key}`,
    label: `${index + 1}. ${npc.pregnancy.fetus[0]?.mother ?? key}`,
  }));
}

function selection(context) {
  const [source, ...keyParts] = context.controls.value('npc').split(':');
  const key = keyParts.join(':');
  const store =
    source === 'config' ? context.config.get('storedNPCs') : context.game.get('storedNPCs');
  return { source, key, store: store ?? {}, npc: store?.[key] };
}

function options(context) {
  return fetusOptions(selection(context).npc?.pregnancy);
}

export const storedNpcAbortionCheat = createCheat({
  id: 'world.stored-npc-abortion',
  location: { section: 'misc', group: 'pregnancy-removal', order: 90 },
  meta: {
    label: 'Stored NPC Pregnancy Removal',
    controls: [
      { key: 'npc', type: 'select', options: npcOptions, action: 'select' },
      { key: 'fetus', type: 'select', options, action: 'select' },
      { key: 'confirm', type: 'toggle', label: 'Confirm', intent: 'confirmation' },
      { key: 'remove', type: 'button', label: 'Remove', action: 'remove' },
      { key: 'purge', type: 'button', label: 'Purge All', action: 'purge' },
    ],
  },
  requiredPaths: ['storedNPCs'],
  config: ['storedNPCs'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    remove(context) {
      if (!confirmed(context.controls))
        return { ok: false, kind: 'blocked', message: destructiveConfirmation };
      const { source, key, store, npc } = selection(context);
      if (!key || !removeFetus(npc?.pregnancy, context.controls.value('fetus')))
        return { ok: false, kind: 'validation', message: 'No fetus is available.' };
      if (npc.pregnancy.fetus.length === 0) delete store[key];
      if (source === 'config') context.config.set('storedNPCs', { ...store });
      else context.game.set('storedNPCs', { ...store });
      context.controls.setValue('confirm', false);
      return { ok: true, message: 'Stored NPC pregnancy removed.', refresh: true };
    },
    purge(context) {
      if (!confirmed(context.controls))
        return { ok: false, kind: 'blocked', message: destructiveConfirmation };
      context.game.set('storedNPCs', {});
      context.config.set('storedNPCs', {});
      context.controls.setValue('confirm', false);
      return { ok: true, message: 'Stored NPC pregnancies purged.', refresh: true };
    },
  },
});
