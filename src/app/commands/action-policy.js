export const START_MENU_ACTION_ALLOWLIST = new Set(['save_data', 'load_data', 'VrelCoinsUsage']);

export const DESTRUCTIVE_ACTIONS = new Set([
  'mc_abortion_set',
  'named_npc_abortion_set',
  'npc_abortion_set',
  'npc_abortion_purge',
  'purgeNPCPregnancy',
  'purgeNPCBaby',
]);

export const DESTRUCTIVE_ACTION_CONFIRMATION_MESSAGE =
  'This action is destructive and cannot be undone. Continue?';
