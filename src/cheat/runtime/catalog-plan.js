export const CHEAT_SECTIONS = Object.freeze(['quick', 'stats', 'misc']);

export function compileCatalogPlan(catalog, { sections = CHEAT_SECTIONS } = {}) {
  if (!catalog?.listCheats) throw new TypeError('Cheat builder requires a catalog.');
  const descriptors = Object.freeze(catalog.listCheats());
  const bySection = new Map(
    sections.map((section) => [
      section,
      Object.freeze(
        descriptors.filter((descriptor) => descriptor.location.section === section)
      ),
    ])
  );
  return Object.freeze({
    descriptors,
    sections: Object.freeze([...sections]),
    listSection: (section) => bySection.get(section) ?? Object.freeze([]),
  });
}
