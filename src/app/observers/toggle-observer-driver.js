import { SECONDS_PER_DAY } from '../../core/time.js';

function gameDay(timestamp) {
  const value = Number(timestamp);
  return Number.isFinite(value) ? Math.floor(value / SECONDS_PER_DAY) : null;
}

export function createToggleObserverDriver({
  scheduler,
  toggleRuntime,
  getTimestamp,
  logger = console,
} = {}) {
  if (!scheduler?.runFrame || !scheduler?.runDaily || !scheduler?.reset)
    throw new TypeError('Toggle observer driver requires a runnable scheduler.');
  if (!toggleRuntime?.restore)
    throw new TypeError('Toggle observer driver requires the descriptor toggle runtime.');

  let currentDay = gameDay(getTimestamp?.());
  let restoring = null;

  async function restore(reason = 'runtime-restore') {
    if (restoring) return restoring;
    restoring = Promise.resolve()
      .then(() => scheduler.reset())
      .then(() => toggleRuntime.restore())
      .then(() => {
        currentDay = gameDay(getTimestamp?.());
        return true;
      })
      .catch((error) => {
        logger?.error?.('Descriptor toggle restoration failed.', {
          reason,
          errorType: error?.name ?? 'Error',
        });
        return false;
      })
      .finally(() => {
        restoring = null;
      });
    return restoring;
  }

  function notifyInteraction({ isLoad = false } = {}) {
    if (isLoad || restoring) return false;
    const started = scheduler.runFrame({
      isLoad: false,
      onWatchdogRestore: () => void restore('watchdog'),
    });
    const nextDay = gameDay(getTimestamp?.());
    if (nextDay != null && currentDay == null) currentDay = nextDay;
    else if (nextDay != null && nextDay !== currentDay) {
      currentDay = nextDay;
      scheduler.runDaily();
    }
    return started;
  }

  return Object.freeze({
    notifyInteraction,
    restore,
    disable(id) {
      return toggleRuntime.setEnabledById?.(id, false) ?? false;
    },
    isEnabled(id) {
      return toggleRuntime.isEnabled?.(id) ?? false;
    },
    stop() {
      scheduler.reset();
    },
  });
}
