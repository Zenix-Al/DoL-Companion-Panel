import { collectGroupTails, placeDescriptorRoot } from './descriptor-placement.js';
import { createBuilderHealth, describeBuilderFailure } from './builder-health.js';

export function createSectionOrchestrator({
  plan,
  document,
  adapter,
  config,
  dispatchShellAction,
  feedback,
  services,
  logger,
  mountDescriptor,
  renderShell,
  teardownShell,
  refreshCoordinator,
}) {
  const mounted = new Map();
  const failures = new Map();
  const definitions = new Map();
  const mountedSections = new Set();
  const generations = new Map();
  let disposed = false;
  let lifecycleGeneration = 0;

  function defineSection(section, container, rows = []) {
    if (!plan.sections.includes(section)) throw new Error(`Unknown cheat section "${section}".`);
    if (!container) throw new TypeError(`Cheat section "${section}" requires a container.`);
    disposed = false;
    definitions.set(section, { container, rows });
  }

  async function disposeSection(section) {
    refreshCoordinator.unregister(section);
    const ids = new Set(plan.listSection(section).map(({ id }) => id));
    for (const [id, instance] of [...mounted]) {
      if (!ids.has(id)) continue;
      await instance.dispose();
      mounted.delete(id);
    }
    mountedSections.delete(section);
  }

  async function mountSection(section, container, rows = []) {
    if (disposed) throw new DOMException('Cheat builder is disposed.', 'AbortError');
    const generation = (generations.get(section) ?? 0) + 1;
    generations.set(section, generation);
    defineSection(section, container, rows);
    await disposeSection(section);
    teardownShell(container);
    const shell = renderShell({
      section,
      rows,
      container,
      document,
      dispatchAction: dispatchShellAction,
    });
    const groupTails = collectGroupTails(shell.root);
    let fallbackTail = null;
    for (const descriptor of plan.listSection(section)) {
      try {
        const instance = await mountDescriptor({
          descriptor,
          document,
          parent: shell.root,
          adapter,
          config,
          feedback,
          services,
        });
        if (disposed || generations.get(section) !== generation) {
          await instance.dispose();
          break;
        }
        fallbackTail = placeDescriptorRoot({
          root: instance.root,
          descriptor,
          shellRoot: shell.root,
          groupTails,
          fallbackTail,
        });
        mounted.set(descriptor.id, instance);
        failures.delete(descriptor.id);
      } catch (error) {
        const failure = describeBuilderFailure(descriptor, 'mount', error);
        failures.set(descriptor.id, failure);
        logger?.error?.('Cheat descriptor mount failed.', failure);
      }
    }
    if (disposed || generations.get(section) !== generation) {
      return health();
    }
    mountedSections.add(section);
    const tickingIds = plan
      .listSection(section)
      .filter(({ refresh }) => refresh?.includes('runtime-tick'))
      .map(({ id }) => id);
    if (tickingIds.length) {
      refreshCoordinator.register(section, {
        isVisible: () =>
          container.isConnected &&
          !container.hidden &&
          container.getAttribute('aria-hidden') !== 'true' &&
          container.style.display !== 'none' &&
          container.classList.contains('active'),
        refresh: () =>
          Promise.all(tickingIds.map((id) => mounted.get(id)?.runtimeTick())).then(() => true),
      });
    }
    return health();
  }

  async function openSection(section) {
    if (disposed) return false;
    const openingGeneration = lifecycleGeneration;
    if (!mountedSections.has(section)) {
      const definition = definitions.get(section);
      if (!definition) return false;
      await mountSection(section, definition.container, definition.rows);
    }
    if (disposed || lifecycleGeneration !== openingGeneration) return false;
    refreshCoordinator.setActiveSection(section);
    await Promise.all(
      plan
        .listSection(section)
        .map(({ id }) => mounted.get(id))
        .filter(Boolean)
        .map((instance) => instance.sectionOpened())
    );
    return true;
  }

  async function teardown() {
    if (disposed) return false;
    disposed = true;
    lifecycleGeneration += 1;
    for (const section of plan.sections) {
      generations.set(section, (generations.get(section) ?? 0) + 1);
    }
    refreshCoordinator.dispose();
    const instances = [...mounted.values()];
    mounted.clear();
    await Promise.all(instances.map((instance) => instance.dispose()));
    for (const { container } of definitions.values()) teardownShell(container);
    definitions.clear();
    mountedSections.clear();
    failures.clear();
    return instances.length > 0;
  }

  const health = () =>
    createBuilderHealth({
      descriptors: plan.descriptors,
      mounted,
      failures,
      mountedSections,
    });

  return Object.freeze({
    defineSection,
    mountSection,
    openSection,
    disposeSection,
    teardown,
    health,
    getMounted: (id) => mounted.get(id) ?? null,
  });
}
