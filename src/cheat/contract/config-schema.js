const entry = (path, type, defaultValue, description, migrationAliases = []) =>
  Object.freeze({ path, type, scope: 'save', defaultValue, description, migrationAliases });

export const CHEAT_CONFIG_SCHEMA = Object.freeze([
  entry('angel', 'number', 0, 'Saved angel-stat baseline.'),
  entry('angelMode', 'boolean', true, 'Whether angel baseline restoration is active.'),
  entry('toggles', 'object', {}, 'Active stable toggle IDs.'),
  entry('storedNPCs', 'object', {}, 'CheatPlus-managed overflow NPC pregnancy data.'),
  entry('storedNPCsDate', 'number', 0, 'Last game day overflow NPC data was processed.'),
  entry('storedNPCsPriority', 'number', 0, 'Overflow NPC processing priority.'),
  entry('trueDivine', 'string', '', 'Remembered demon/angel transformation branch.'),
  entry('orgasmCount', 'number', 0, 'Intense-cum toggle counter.'),
  entry('baseNpcPregnancyChance', 'number-or-null', null, 'Baseline restored by NPC toggle.'),
  entry('unlicumMode', 'boolean', false, 'Intense-cum toggle phase.'),
]);

export const CHEAT_CONFIG_DEFAULTS = Object.freeze(
  Object.fromEntries(CHEAT_CONFIG_SCHEMA.map(({ path, defaultValue }) => [path, defaultValue]))
);

export const CHEAT_CONFIG_CLASSIFICATION = Object.freeze({
  saveBackedConfig: Object.freeze(CHEAT_CONFIG_SCHEMA.map(({ path }) => path)),
  transientRuntimeState: Object.freeze([
    'scheduler callbacks',
    'failure counters',
    'cooldown timestamps',
    'mounted controls',
    'AbortController instances',
  ]),
  gameState: Object.freeze([
    'money',
    'arousal',
    'date',
    'player',
    'NPCName',
    'storedNPCs (base-game path)',
    'pregnancy',
    'setup',
  ]),
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isCheatConfigValueValid(definition, value) {
  if (definition.type === 'number') return Number.isFinite(value);
  if (definition.type === 'number-or-null') return value === null || Number.isFinite(value);
  if (definition.type === 'boolean') return typeof value === 'boolean';
  if (definition.type === 'string') return typeof value === 'string';
  if (definition.type === 'object') return isPlainObject(value);
  return false;
}

function cloneDefault(value) {
  return isPlainObject(value) ? { ...value } : value;
}

export function normalizeCheatConfig(input, { baseNpcPregnancyChance = null } = {}) {
  const source = isPlainObject(input) ? input : {};
  const normalized = {};
  for (const definition of CHEAT_CONFIG_SCHEMA) {
    let value = source[definition.path];
    if (value === undefined) {
      for (const alias of definition.migrationAliases) {
        if (source[alias] !== undefined) {
          value = source[alias];
          break;
        }
      }
    }
    if (!isCheatConfigValueValid(definition, value)) value = cloneDefault(definition.defaultValue);
    normalized[definition.path] = value;
  }
  if (normalized.baseNpcPregnancyChance === null && Number.isFinite(baseNpcPregnancyChance)) {
    normalized.baseNpcPregnancyChance = baseNpcPregnancyChance;
  }
  return normalized;
}

export function resetCheatConfig(options) {
  return normalizeCheatConfig({}, options);
}

export function serializeCheatConfig(input) {
  return normalizeCheatConfig(input);
}
