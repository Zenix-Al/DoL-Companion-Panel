import {
  BOUND_ACTIONS,
  METHOD_ACTIONS,
  NAV_ACTIONS,
  SIMPLE_UI_ACTIONS,
  TOGGLE_DEFINITIONS,
} from './legacy-action-map-fixture.js';

export const BEHAVIOR_STATUSES = Object.freeze([
  'working',
  'known-broken',
  'partially-working',
  'unverified',
]);

const EVIDENCE_BY_ACTION = Object.freeze({
  moneyset: {
    status: 'working',
    evidence: 'test/characterization/legacy-cheat-actions.test.js',
    intendedBehavior: 'A finite value entered in moneyinput replaces State.variables.money.',
  },
  unliarousal: {
    status: 'working',
    evidence: 'test/characterization/legacy-cheat-actions.test.js',
    intendedBehavior: 'Each effect run restores State.variables.arousal to 10000.',
  },
  named_npc_pregnancy_set: {
    status: 'partially-working',
    evidence: 'test/parity/pregnancy-manager-production.test.js',
    intendedBehavior:
      'Updating or unlocking one named NPC must preserve scheduling for every other locked named NPC.',
  },
});

const RETIRED_VERTICAL_SLICE_ACTIONS = Object.freeze([
  { actionKey: 'moneyset', methodName: 'moneymanager' },
  { actionKey: 'bodyset', methodName: 'bodymanager' },
  { actionKey: 'max_harmony' },
  { actionKey: 'max_Ferocity' },
]);
const RETIRED_VERTICAL_SLICE_IDS = new Set(
  RETIRED_VERTICAL_SLICE_ACTIONS.map(({ actionKey }) => actionKey)
);
const HISTORICAL_METHOD_ACTIONS = [...METHOD_ACTIONS];
HISTORICAL_METHOD_ACTIONS.unshift({ actionKey: 'max_Ferocity' });
HISTORICAL_METHOD_ACTIONS.unshift({ actionKey: 'max_harmony' });
HISTORICAL_METHOD_ACTIONS.splice(
  HISTORICAL_METHOD_ACTIONS.findIndex(({ actionKey }) => actionKey === 'sprayset'),
  0,
  { actionKey: 'moneyset', methodName: 'moneymanager' }
);
HISTORICAL_METHOD_ACTIONS.splice(
  HISTORICAL_METHOD_ACTIONS.findIndex(({ actionKey }) => actionKey === 'bodytypeset'),
  0,
  { actionKey: 'bodyset', methodName: 'bodymanager' }
);

const CLASSIFICATION_BY_ACTION = Object.freeze({
  moneyset: 'bound-editor',
  statset: 'bound-editor',
  statsete: 'bound-editor',
  charaset: 'bound-editor',
  cumset: 'bound-editor',
  milkset: 'bound-editor',
  set_fame12: 'bound-editor',
  set_animal_like: 'bound-editor',
  set_build_time: 'bound-editor',
  set_assault_time: 'bound-editor',
  set_exam: 'bound-editor',
  set_talent: 'bound-editor',
  set_school_rep: 'bound-editor',
  named_npc_pregnancy_set: 'dynamic-options-cheat',
  npc_pregnancy_set: 'dynamic-options-cheat',
  mc_pregnancy_set: 'dynamic-options-cheat',
  mc_tentacle_set: 'dynamic-options-cheat',
  mc_baby_set: 'dynamic-options-cheat',
  mc_abortion_set: 'dynamic-options-cheat',
  named_npc_abortion_set: 'dynamic-options-cheat',
  npc_abortion_set: 'dynamic-options-cheat',
  testAll: 'debug-tool',
});

function getEvidence(actionId) {
  return (
    EVIDENCE_BY_ACTION[actionId] ?? {
      status: 'unverified',
      evidence: '',
      intendedBehavior: '',
    }
  );
}

function createMethodEntry(entry) {
  const actionId = entry.actionKey;
  const methodName = entry.methodName ?? actionId;
  const evidence = getEvidence(actionId);

  return Object.freeze({
    id: actionId,
    role: 'cheat',
    classification: CLASSIFICATION_BY_ACTION[actionId] ?? 'one-shot',
    status: evidence.status,
    evidence: evidence.evidence,
    intendedBehavior: evidence.intendedBehavior,
    current: Object.freeze({
      actionId,
      methodName,
      actionMap: 'src/features/listeners/action-map-methods.js',
      implementationFacade: `src/features/actions.js#cheatActions.${methodName}`,
      metadataFiles: Object.freeze([]),
    }),
  });
}

function createToggleEntry(entry) {
  const evidence = getEvidence(entry.id);

  return Object.freeze({
    id: entry.id,
    role: 'cheat',
    classification: entry.trigger === 'daily' ? 'daily-toggle' : 'frame-toggle',
    status: evidence.status,
    evidence: evidence.evidence,
    intendedBehavior: evidence.intendedBehavior,
    current: Object.freeze({
      actionId: entry.id,
      methodName: entry.id,
      actionMap: 'src/features/listeners/action-map-toggle.js',
      implementationFacade: `src/features/cheat/toggle-runtime.js#${entry.id}`,
      metadataFiles: Object.freeze([]),
      persistedKey: entry.id,
      trigger: entry.trigger,
      cooldownMs: entry.cooldownMs ?? 100,
    }),
  });
}

export const legacyCheatInventory = Object.freeze([
  ...HISTORICAL_METHOD_ACTIONS.map((entry) => {
    const retired = RETIRED_VERTICAL_SLICE_IDS.has(entry.actionKey);
    return Object.freeze({
      ...createMethodEntry(entry),
      retired,
      ...(retired
        ? {
            current: Object.freeze({
              actionId: entry.actionKey,
              methodName: entry.methodName ?? entry.actionKey,
              actionMap: '',
              implementationFacade: '',
              metadataFiles: Object.freeze([]),
            }),
          }
        : {}),
    });
  }),
  ...TOGGLE_DEFINITIONS.map(createToggleEntry),
]);

export const legacyUiActionInventory = Object.freeze([
  ...NAV_ACTIONS.map((entry) =>
    Object.freeze({
      id: entry.actionKey,
      role: 'modal-shell',
      classification: 'navigation',
      status: 'unverified',
      current: Object.freeze({ ...entry, actionMap: 'src/features/listeners/action-map-ui.js' }),
    })
  ),
  ...SIMPLE_UI_ACTIONS.map((entry) =>
    Object.freeze({
      id: entry.actionKey,
      role: 'application-action',
      classification: 'modal-shell',
      status: 'unverified',
      current: Object.freeze({ ...entry, actionMap: 'src/features/listeners/action-map-ui.js' }),
    })
  ),
  ...BOUND_ACTIONS.map((entry) =>
    Object.freeze({
      id: entry.actionKey,
      role: 'hydration-action',
      classification: 'legacy-refresh',
      status: 'unverified',
      current: Object.freeze({ ...entry, actionMap: 'src/features/listeners/action-map-ui.js' }),
    })
  ),
]);

export const knownBrokenUiControls = Object.freeze([
  Object.freeze({
    id: 'save_data',
    role: 'application-integration',
    classification: 'server-save',
    status: 'known-broken',
    metadataFile: 'src/ui/metadata/quick/index.js',
    observedFailure: 'The Export control has no registered dispatcher action.',
    intendedBehavior: 'Export the available server-save slots to the configured local server.',
    evidence: 'test/integration/legacy-shell-command-classification.test.js',
    verification: 'test/regression/server-save-actions.test.js',
  }),
  Object.freeze({
    id: 'load_data',
    role: 'application-integration',
    classification: 'server-save',
    status: 'known-broken',
    metadataFile: 'src/ui/metadata/quick/index.js',
    observedFailure: 'The Import control has no registered dispatcher action.',
    intendedBehavior: 'Import server-save data selected through the local-server workflow.',
    evidence: 'test/integration/legacy-shell-command-classification.test.js',
    verification: 'test/regression/server-save-actions.test.js',
  }),
]);

export function withMetadataLocations(inventory, locationsByAction) {
  return inventory.map((entry) =>
    Object.freeze({
      ...entry,
      current: Object.freeze({
        ...entry.current,
        metadataFiles: Object.freeze([...(locationsByAction.get(entry.current.actionId) ?? [])]),
      }),
    })
  );
}
