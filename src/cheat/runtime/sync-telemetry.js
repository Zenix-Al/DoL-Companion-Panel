function developmentBuild() {
  try {
    return typeof __DOL_DEBUG__ !== 'undefined' && Boolean(__DOL_DEBUG__);
  } catch {
    return false;
  }
}

export function createSyncTelemetry({ enabled = true } = {}) {
  const sections = new Map();
  const entry = (section) => {
    if (!sections.has(section)) {
      sections.set(section, {
        calls: 0,
        durationMs: 0,
        skippedHidden: 0,
        suppressedWrites: 0,
        coordinatorTicks: 0,
        coordinatorDurationMs: 0,
      });
    }
    return sections.get(section);
  };
  return Object.freeze({
    record(section, { durationMs = 0, suppressedWrites = 0 } = {}) {
      if (!enabled) return;
      const metrics = entry(section);
      metrics.calls += 1;
      metrics.durationMs += durationMs;
      metrics.suppressedWrites += suppressedWrites;
    },
    hidden(section) {
      if (enabled) entry(section).skippedHidden += 1;
    },
    coordinatorTick(section, { durationMs = 0 } = {}) {
      if (!enabled) return;
      const metrics = entry(section);
      metrics.coordinatorTicks += 1;
      metrics.coordinatorDurationMs += durationMs;
    },
    snapshot() {
      return Object.freeze(
        Object.fromEntries([...sections].map(([section, metrics]) => [section, { ...metrics }]))
      );
    },
    reset() {
      sections.clear();
    },
  });
}

export const syncTelemetry = createSyncTelemetry({ enabled: developmentBuild() });
