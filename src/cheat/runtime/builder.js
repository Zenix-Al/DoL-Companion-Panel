import { renderSectionShell, teardownSectionShell } from '../../ui/shell/renderer.js';

import { compileCatalogPlan } from './catalog-plan.js';
import { createBuilderLifecycleHandle } from './builder-contract.js';
import { mountCheatDescriptor } from './renderer.js';
import { createUiRefreshCoordinator } from './refresh-coordinator.js';
import { createSectionOrchestrator } from './section-orchestrator.js';
import { syncTelemetry } from './sync-telemetry.js';

export function createCheatRuntimeBuilder({
  catalog,
  adapter,
  config,
  document,
  dispatchShellAction,
  feedback = {},
  services = {},
  logger = console,
  mountDescriptor = mountCheatDescriptor,
  renderShell = renderSectionShell,
  teardownShell = teardownSectionShell,
  createRefreshCoordinator = createUiRefreshCoordinator,
  timerApi = document?.defaultView,
  clock = globalThis.performance,
  scheduler = services.scheduler,
}) {
  if (!adapter) throw new TypeError('Cheat builder requires the active runtime adapter.');
  if (!document) throw new TypeError('Cheat builder requires a document.');
  const plan = compileCatalogPlan(catalog);
  const runtimeServices = Object.freeze({ ...services, clock, scheduler });
  const refreshCoordinator = createRefreshCoordinator({
    timerApi,
    clock,
    telemetry: services.syncTelemetry ?? syncTelemetry,
  });
  const sections = createSectionOrchestrator({
    plan,
    document,
    adapter,
    config,
    dispatchShellAction,
    feedback,
    services: runtimeServices,
    logger,
    mountDescriptor,
    renderShell,
    teardownShell,
    refreshCoordinator,
  });
  let compiled = false;

  function compile() {
    if (compiled) return false;
    compiled = true;
    return true;
  }

  function defineSection(section, container, shellRows = []) {
    if (!compiled) compile();
    sections.defineSection(section, container, shellRows);
  }

  function configureSections(sectionDefinitions) {
    for (const [section, definition] of Object.entries(sectionDefinitions ?? {})) {
      defineSection(section, definition.container, definition.rows ?? []);
    }
  }

  async function mountSection(section, container, shellRows = []) {
    if (!compiled) compile();
    return sections.mountSection(section, container, shellRows);
  }

  return createBuilderLifecycleHandle({
    compile,
    defineSection,
    configureSections,
    mountSection,
    sectionOpened: sections.openSection,
    teardown: sections.teardown,
    health: sections.health,
    listCompiled: () => [...plan.descriptors],
    getMounted: sections.getMounted,
    refreshCoordinator,
  });
}
