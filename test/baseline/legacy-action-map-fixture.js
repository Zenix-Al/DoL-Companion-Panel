// Frozen migration evidence for the retired pre-descriptor registries.
export const METHOD_ACTIONS = Object.freeze([
  ['vow-virgin', 'imvirgintemple'], ['arousal_player'], ['arousal_enemy'], ['sheesh', 'aezakmi'],
  ['jk-lol', 'imdonefor'], ['hesoyam'], ['kill_player'], ['statset', 'statmanager'], ['enemycalm'],
  ['kill_enemy'], ['statsete', 'statmanagere'], ['sprayset', 'sprayunlimited'],
  ['bodytypeset', 'bodytypemanager'], ['ballsset', 'ballsmanager'],
  ['virginityset', 'virginitymanager'], ['virginpure', 'virginitypure'],
  ['charaset', 'charamanager'], ['lactatingset', 'lactatingmanager'], ['cumset', 'cummanager'],
  ['milkset', 'milkmanager'], ['cumrefil', 'cumfill'], ['milkrefil', 'milkfill'],
  ['changetraitbro'], ['VrelCoinsUsage'], ['set_fame12'], ['infect'], ['desinfect'],
  ['set_animal_like'], ['set_build_time'], ['set_assault_time'], ['set_exam', 'exammanager'],
  ['set_talent', 'talentmanager'], ['clean_cum'], ['check_fruit_selling'], ['set_school_rep'],
  ['named_npc_pregnancy_set'], ['npc_pregnancy_set'], ['mc_pregnancy_set'],
  ['mc_tentacle_set'], ['mc_baby_set'], ['set_hentai_skill'], ['mc_abortion_set'],
  ['named_npc_abortion_set'], ['npc_abortion_set'], ['dirty_cum'], ['clean_cum_uretus'],
  ['in_game_cheat'], ['alt_cheat'], ['randomEncounterSet'],
  ['npc_abortion_purge', 'purgeNPCPregnancy'], ['purgeNPCBaby'], ['testAll'],
].map(([actionKey, methodName]) => Object.freeze({ actionKey, ...(methodName ? { methodName } : {}) })));

export const TOGGLE_DEFINITIONS = Object.freeze([
  ['maxchruchtask', 'daily'], ['maxanimaltask', 'daily'], ['edenshrooms', 'daily'],
  ['edengarden', 'daily'], ['edenspring', 'daily'], ['edentimer', 'daily'],
  ['invinityNPCPregnancy', 'daily'], ['virginity', 'frame'], ['purity', 'frame'],
  ['unlicum', 'frame'], ['unliarousal', 'frame'], ['everyone_horny', 'frame'],
  ['farm_safe', 'frame'], ['interact_child', 'frame', 200],
  ['pregnancy_detection', 'frame', 250], ['invincibleAngel', 'frame'],
  ['intenseCum', 'frame', 80], ['allNPCInstaPregnant', 'frame', 250],
  ['allNPCMultiplePregnancy', 'frame', 250],
].map(([id, trigger, cooldownMs]) =>
  Object.freeze({ id, trigger, ...(cooldownMs ? { cooldownMs } : {}) })
));

export const NAV_ACTIONS = Object.freeze([
  ['quick-link', 'quicklink', 'quickcontent', 'hydrateQuickSection'],
  ['stats-link', 'statlink', 'statscontent', 'hydrateStatsSection'],
  ['misc-link', 'misclink', 'misccontent', 'hydrateMiscSection'],
].map(([actionKey, navKey, contentKey, hydrateKey]) =>
  Object.freeze({ actionKey, navKey, contentKey, hydrateKey })
));

export const SIMPLE_UI_ACTIONS = Object.freeze([
  { actionKey: 'cheat-open', target: 'openModal' },
  { actionKey: 'cheat-history-backwards', target: 'cheatActions', arg: 'cheat_backwards' },
  { actionKey: 'cheat-history-forwards', target: 'cheatActions', arg: 'cheat_forwards' },
  { actionKey: 'cheat-sidebar', target: 'cheatActions', arg: 'sidebar_cheat' },
  { actionKey: 'init_interface', target: 'init_interface' },
  { actionKey: 'search123', target: 'executeSearch', arg: 'search123' },
  { actionKey: 'search456', target: 'executeSearch', arg: 'search456' },
  { actionKey: 'Enable_cheat_history', target: 'Enable_cheat_history' },
  { actionKey: 'Enable_sidebar_button', target: 'Enable_sidebar_button' },
  { actionKey: 'simple_cheat_button', target: 'simple_cheat_button' },
]);

export const BOUND_ACTIONS = Object.freeze([
  'statpick', 'statpicke', 'charapick', 'fame_name', 'select_exam', 'npcnames', 'npctraits',
  'select_talent', 'select_school_rep', 'named_npc_pregnancy_manager', 'npc_pregnancy_manager',
  'mc_pregnancy_hole', 'mc_pregnancy_manager', 'mc_tentacle_location', 'mc_tentacle_select',
  'mc_baby_action_select', 'mc_baby_select', 'mc_abortion_location',
  'named_npc_abortion_chara_select', 'npc_abortion_chara_select', 'animal_choice', 'arousal_val',
].map((actionKey) => Object.freeze({ actionKey })));
