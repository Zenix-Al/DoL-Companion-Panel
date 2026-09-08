import { CHEAT_CONFIG_SCHEMA } from './contract/config-schema.js';

const FIELDS = new Set([
  'id',
  'location',
  'meta',
  'actions',
  'sync',
  'refresh',
  'toggle',
  'effect',
  'isApplicable',
  'requiredPaths',
  'onEnable',
  'onDisable',
  'dispose',
  'config',
  'diagnostics',
]);
const SECTIONS = new Set(['quick', 'stats', 'misc']);
const CONTROLS = new Set(['button', 'input', 'range', 'select', 'text', 'toggle']);
const REFRESH = new Set(['mount', 'section-open', 'after-action', 'runtime-tick', 'manual']);
const CADENCES = new Set(['frame', 'daily']);
const CONTROL_INTENTS = new Set(['confirmation', 'status']);
const CONFIG_PATHS = new Set(CHEAT_CONFIG_SCHEMA.map(({ path }) => path));

export const CHEAT_CONTRACT_CONSTANTS = Object.freeze({
  sections: Object.freeze([...SECTIONS]),
  controlTypes: Object.freeze([...CONTROLS]),
  refreshReasons: Object.freeze([...REFRESH]),
  toggleCadences: Object.freeze([...CADENCES]),
});

const plain = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value) => typeof value === 'string' && value.trim() !== '';

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => !text(item))) {
    throw new TypeError(`${label} must be an array of non-empty strings.`);
  }
  const seen = new Set();
  for (const item of value) {
    if (seen.has(item)) throw new Error(`${label} contains duplicate "${item}".`);
    seen.add(item);
  }
}

export function validateCheatDefinition(definition) {
  if (!plain(definition)) throw new TypeError('Cheat definition must be a plain object.');
  for (const key of Object.keys(definition)) {
    if (!FIELDS.has(key)) throw new Error(`Unknown cheat descriptor field "${key}".`);
  }
  if (!text(definition.id)) throw new TypeError('Cheat id must be a non-empty string.');
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(definition.id)) {
    throw new Error(`Cheat id "${definition.id}" must be a lowercase namespaced id.`);
  }
  if (!plain(definition.location))
    throw new TypeError(`Cheat "${definition.id}" location must be a plain object.`);
  if (!SECTIONS.has(definition.location.section))
    throw new Error(`Cheat "${definition.id}" has unsupported section.`);
  if (!Number.isFinite(definition.location.order))
    throw new TypeError(`Cheat "${definition.id}" location.order must be finite.`);
  if (definition.location.group != null && !text(definition.location.group))
    throw new TypeError(`Cheat "${definition.id}" location.group must be a non-empty string.`);
  if (!plain(definition.meta) || !text(definition.meta.label))
    throw new TypeError(`Cheat "${definition.id}" meta.label must be a non-empty string.`);
  if (definition.meta.confirmation != null && !text(definition.meta.confirmation))
    throw new TypeError(`Cheat "${definition.id}" meta.confirmation must be a non-empty string.`);
  if (!Array.isArray(definition.meta.controls) || definition.meta.controls.length === 0)
    throw new TypeError(`Cheat "${definition.id}" meta.controls must be a non-empty array.`);

  if (definition.actions != null && !plain(definition.actions))
    throw new TypeError(`Cheat "${definition.id}" actions must be a plain object.`);
  for (const [name, action] of Object.entries(definition.actions ?? {})) {
    if (!text(name) || typeof action !== 'function')
      throw new TypeError(`Cheat "${definition.id}" action "${name}" must be a function.`);
  }
  const keys = new Set();
  for (const control of definition.meta.controls) {
    if (!plain(control) || !text(control.key))
      throw new TypeError(`Cheat "${definition.id}" control key must be a non-empty string.`);
    if (keys.has(control.key))
      throw new Error(`Cheat "${definition.id}" has duplicate control key "${control.key}".`);
    keys.add(control.key);
    if (!CONTROLS.has(control.type))
      throw new Error(`Cheat "${definition.id}" control "${control.key}" has invalid type.`);
    if (control.intent != null && !CONTROL_INTENTS.has(control.intent))
      throw new Error(`Cheat "${definition.id}" control "${control.key}" has invalid intent.`);
    if (control.intent === 'confirmation' && control.type !== 'toggle')
      throw new Error(`Cheat "${definition.id}" confirmation control must be a toggle.`);
    if (control.intent === 'status' && control.type !== 'text')
      throw new Error(`Cheat "${definition.id}" status control must be text.`);
    if (
      control.action &&
      !(control.action === 'toggle' && definition.toggle) &&
      typeof definition.actions?.[control.action] !== 'function'
    )
      throw new Error(
        `Cheat "${definition.id}" control "${control.key}" references missing local action "${control.action}".`
      );
    if (control.binding != null && (!plain(control.binding) || !text(control.binding.path)))
      throw new TypeError(
        `Cheat "${definition.id}" control binding path must be a non-empty string.`
      );
    if (control.binding?.writeOn != null && !['input', 'change'].includes(control.binding.writeOn))
      throw new Error(
        `Cheat "${definition.id}" control "${control.key}" has invalid binding writeOn event.`
      );
    if (
      control.options != null &&
      !Array.isArray(control.options) &&
      typeof control.options !== 'function'
    )
      throw new TypeError(
        `Cheat "${definition.id}" control "${control.key}" options must be an array or function.`
      );
    if (control.fallbackOptions != null && !Array.isArray(control.fallbackOptions))
      throw new TypeError(
        `Cheat "${definition.id}" control "${control.key}" fallbackOptions must be an array.`
      );
  }
  if (definition.refresh != null) {
    stringArray(definition.refresh, `Cheat "${definition.id}" refresh`);
    for (const reason of definition.refresh)
      if (!REFRESH.has(reason))
        throw new Error(`Cheat "${definition.id}" has invalid refresh reason "${reason}".`);
  }
  if (definition.toggle != null) {
    if (!plain(definition.toggle) || !CADENCES.has(definition.toggle.cadence))
      throw new Error(`Cheat "${definition.id}" has invalid toggle cadence.`);
    if (typeof definition.effect !== 'function')
      throw new TypeError(`Cheat "${definition.id}" toggle requires effect().`);
    if (!definition.meta.controls.some(({ type }) => type === 'toggle'))
      throw new Error(`Cheat "${definition.id}" toggle requires a toggle control.`);
    if (
      definition.toggle.cooldownMs != null &&
      (!Number.isFinite(definition.toggle.cooldownMs) || definition.toggle.cooldownMs < 0)
    )
      throw new TypeError(`Cheat "${definition.id}" toggle cooldownMs must be non-negative.`);
    if (
      definition.toggle.maxFailures != null &&
      (!Number.isInteger(definition.toggle.maxFailures) || definition.toggle.maxFailures < 1)
    )
      throw new TypeError(
        `Cheat "${definition.id}" toggle maxFailures must be a positive integer.`
      );
    if (
      definition.toggle.runOnActivate != null &&
      typeof definition.toggle.runOnActivate !== 'boolean'
    )
      throw new TypeError(`Cheat "${definition.id}" toggle runOnActivate must be boolean.`);
  } else if (definition.effect != null)
    throw new Error(`Cheat "${definition.id}" effect requires toggle configuration.`);
  for (const key of ['sync', 'isApplicable', 'onEnable', 'onDisable', 'dispose'])
    if (definition[key] != null && typeof definition[key] !== 'function')
      throw new TypeError(`Cheat "${definition.id}" ${key} must be a function.`);
  for (const key of ['requiredPaths', 'config'])
    if (definition[key] != null) stringArray(definition[key], `Cheat "${definition.id}" ${key}`);
  if (definition.diagnostics != null && !plain(definition.diagnostics))
    throw new TypeError(`Cheat "${definition.id}" diagnostics must be a plain object.`);
  for (const path of definition.config ?? [])
    if (!CONFIG_PATHS.has(path))
      throw new Error(`Cheat "${definition.id}" references unknown config path "${path}".`);
  if (
    !Object.keys(definition.actions ?? {}).length &&
    typeof definition.effect !== 'function' &&
    typeof definition.sync !== 'function'
  )
    throw new Error(`Cheat "${definition.id}" requires actions, effect, or sync.`);
  return definition;
}

function freezeOwned(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeOwned(child);
  return Object.freeze(value);
}

export function createCheat(definition) {
  validateCheatDefinition(definition);
  return freezeOwned(definition);
}
