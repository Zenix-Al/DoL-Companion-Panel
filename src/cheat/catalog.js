import { CHEAT_CONFIG_SCHEMA } from './contract/config-schema.js';
import { validateCheatDefinition } from './create-cheat.js';

const SECTION_ORDER = ['quick', 'stats', 'misc'];

export function createCheatCatalog(
  descriptors,
  { configPaths = CHEAT_CONFIG_SCHEMA.map(({ path }) => path) } = {}
) {
  if (!Array.isArray(descriptors)) throw new TypeError('Cheat catalog input must be an array.');
  const paths = new Set(configPaths),
    byId = new Map(),
    placements = new Map();
  for (const descriptor of descriptors) {
    validateCheatDefinition(descriptor);
    if (byId.has(descriptor.id))
      throw new Error(`Duplicate cheat descriptor id "${descriptor.id}".`);
    const placement = `${descriptor.location.section}:${descriptor.location.group ?? ''}:${
      descriptor.location.order
    }`;
    if (placements.has(placement))
      throw new Error(
        `Duplicate cheat placement "${placement}" for "${placements.get(placement)}" and "${
          descriptor.id
        }".`
      );
    for (const path of descriptor.config ?? [])
      if (!paths.has(path))
        throw new Error(`Cheat "${descriptor.id}" references unknown config path "${path}".`);
    placements.set(placement, descriptor.id);
    byId.set(descriptor.id, descriptor);
  }
  const ordered = [...byId.values()].sort(
    (a, b) =>
      SECTION_ORDER.indexOf(a.location.section) - SECTION_ORDER.indexOf(b.location.section) ||
      a.location.order - b.location.order ||
      (a.location.group ?? '').localeCompare(b.location.group ?? '') ||
      a.id.localeCompare(b.id)
  );
  return Object.freeze({
    listCheats: () => [...ordered],
    getCheat: (id) => byId.get(id) ?? null,
    listCheatsForSection: (section) =>
      ordered.filter((cheat) => cheat.location.section === section),
  });
}
