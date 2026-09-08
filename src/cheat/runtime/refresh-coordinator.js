const DEFAULT_INTERVAL_MS = 400;

export function createUiRefreshCoordinator({
  timerApi,
  intervalMs = DEFAULT_INTERVAL_MS,
  telemetry = null,
  clock = globalThis.performance,
} = {}) {
  if (!timerApi?.setInterval || !timerApi?.clearInterval)
    throw new TypeError('UI refresh coordinator requires a window timer API.');

  const sections = new Map();
  let activeSection = null;
  let timer = null;
  let running = null;

  const stopTimer = () => {
    if (timer == null) return;
    timerApi.clearInterval(timer);
    timer = null;
  };
  const ensureTimer = () => {
    if (timer != null || sections.size === 0) return;
    timer = timerApi.setInterval(() => void tick(), intervalMs);
  };
  async function tick() {
    if (running || !activeSection) return running ?? false;
    const entry = sections.get(activeSection);
    if (!entry || !entry.isVisible()) return false;
    const startedAt = clock?.now?.() ?? Date.now();
    running = Promise.resolve(entry.refresh()).finally(() => {
      telemetry?.coordinatorTick?.(activeSection, {
        durationMs: (clock?.now?.() ?? Date.now()) - startedAt,
      });
      running = null;
    });
    await running;
    return true;
  }

  return Object.freeze({
    register(section, { refresh, isVisible }) {
      if (!section || typeof refresh !== 'function' || typeof isVisible !== 'function')
        throw new TypeError('Refresh registration requires a section, refresh, and visibility check.');
      sections.set(section, { refresh, isVisible });
      ensureTimer();
    },
    unregister(section) {
      sections.delete(section);
      if (activeSection === section) activeSection = null;
      if (sections.size === 0) stopTimer();
    },
    setActiveSection(section) {
      activeSection = sections.has(section) ? section : null;
    },
    tick,
    snapshot() {
      return Object.freeze({
        activeSection,
        registeredSections: Object.freeze([...sections.keys()]),
        timerCount: timer == null ? 0 : 1,
      });
    },
    dispose() {
      stopTimer();
      sections.clear();
      activeSection = null;
    },
  });
}
