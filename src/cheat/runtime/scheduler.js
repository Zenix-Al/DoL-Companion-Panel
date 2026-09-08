// Lightweight Toggle Scheduler service
// Provides register/unregister and run utilities for regular and daily toggle functions.
import debugLog from '../../core/logger.js';

const functionMap = new Map();
const dailyMap = new Map();

const DEFAULT_COOLDOWN_MS = 100; // default per-toggle cooldown to avoid frame pressure
const DEFAULT_MAX_FAILURES = 5;
let scheduledRun = false;
let frameExpected = 0;
let frameProgress = 0;
let frameFailures = 0;
let framePending = new Set();
let frameLastProgressKey = null;

function resetFrameState() {
  frameExpected = 0;
  frameProgress = 0;
  frameFailures = 0;
  framePending = new Set();
  frameLastProgressKey = null;
}

function getFramePendingSample(limit = 8) {
  if (!framePending || framePending.size === 0) return [];
  const out = [];
  for (const key of framePending) {
    out.push(key);
    if (out.length >= limit) break;
  }
  return out;
}

function runEntriesSequentially(entries, { onProgress = null, onDone = null, daily = false } = {}) {
  let index = 0;
  function step() {
    if (index >= entries.length) {
      if (typeof onDone === 'function') onDone();
      debugLog(
        'toggle:scheduler',
        `${daily ? 'Daily' : 'Regular'} batch complete (${index} entries)`
      );
      return;
    }

    const [key, meta] = entries[index++];
    const now = Date.now();
    if (!meta) {
      if (typeof onProgress === 'function') onProgress(key);
      return requestAnimationFrame(step);
    }

    if (!daily && now - (meta.lastRun || 0) < (meta.cooldownMs || DEFAULT_COOLDOWN_MS)) {
      debugLog(
        'toggle:scheduler',
        `Skipping ${key}: cooldown not ready (${now - (meta.lastRun || 0)}ms < ${
          meta.cooldownMs || DEFAULT_COOLDOWN_MS
        }ms)`
      );
      if (typeof onProgress === 'function') onProgress(key);
      return requestAnimationFrame(step);
    }

    try {
      if (typeof meta.fn === 'function') {
        debugLog('toggle:scheduler', `Executing ${daily ? 'daily' : 'regular'} toggle: ${key}`);
        meta.fn();
        if (!daily) meta.lastRun = Date.now();
        meta.failureCount = 0;
      }
    } catch (e) {
      meta.failureCount = (meta.failureCount || 0) + 1;
      debugLog(
        'toggle:scheduler',
        `Error executing ${daily ? 'daily' : 'regular'} toggle: ${key} (failure #${
          meta.failureCount
        })`,
        {
          data: e,
          level: 'error',
        }
      );

      if (meta.failureCount >= (meta.maxFailures || DEFAULT_MAX_FAILURES)) {
        if (daily) {
          dailyMap.delete(key);
          debugLog(
            'toggle:scheduler',
            `Unregistered daily toggle: ${key} after ${meta.failureCount} failures`,
            {
              level: 'warn',
            }
          );
        } else {
          functionMap.delete(key);
          debugLog(
            'toggle:scheduler',
            `Unregistered regular toggle: ${key} after ${meta.failureCount} failures`,
            {
              level: 'warn',
            }
          );
        }
        if (typeof meta.onFailureThreshold === 'function') {
          meta.onFailureThreshold({ id: key, failures: meta.failureCount, error: e, daily });
        }
      }
    }

    if (typeof onProgress === 'function') onProgress(key);
    requestAnimationFrame(step);
  }

  step();
}

export const ToggleScheduler = {
  register(
    id,
    fn,
    {
      daily = false,
      cooldownMs = DEFAULT_COOLDOWN_MS,
      maxFailures = DEFAULT_MAX_FAILURES,
      onFailureThreshold = null,
    } = {}
  ) {
    if (!id) return;
    debugLog('toggle:scheduler', `Registering ${daily ? 'daily' : 'regular'} toggle: ${id}`, {
      data: { cooldownMs, maxFailures, fnExists: typeof fn === 'function' },
    });
    const meta = {
      fn,
      lastRun: 0,
      failureCount: 0,
      cooldownMs,
      maxFailures,
      onFailureThreshold,
    };
    if (daily) dailyMap.set(id, meta);
    else functionMap.set(id, meta);
  },

  unregister(id, { daily = false } = {}) {
    if (!id) return;
    debugLog('toggle:scheduler', `Unregistering ${daily ? 'daily' : 'regular'} toggle: ${id}`);
    if (daily) dailyMap.delete(id);
    else functionMap.delete(id);
  },

  runAll({ onProgress = null } = {}) {
    const entries = Array.from(functionMap.entries());
    debugLog('toggle:scheduler', `runAll: ${entries.length} regular toggles queued`);
    runEntriesSequentially(entries, { onProgress, daily: false });
  },

  runDaily() {
    const entries = Array.from(dailyMap.entries());
    debugLog('toggle:scheduler', `runDaily: ${entries.length} daily toggles queued`);
    runEntriesSequentially(entries, { daily: true });
  },

  runAllDaily() {
    this.runDaily();
  },

  runFrame({
    isLoad = false,
    onProgress = null,
    onFrameState = null,
    onWatchdogRestore = null,
  } = {}) {
    if (isLoad) {
      debugLog('toggle:scheduler', 'Skipping frame: page is loading');
      return false;
    }

    if (frameExpected > 0 && frameProgress < frameExpected) {
      frameFailures += 1;
      const pendingSample = getFramePendingSample();
      debugLog(
        'toggle:scheduler',
        `Frame watchdog: progress ${frameProgress}/${frameExpected} (failures: ${frameFailures})` +
          (frameLastProgressKey ? `; last completed: ${frameLastProgressKey}` : '') +
          (framePending.size
            ? `; pending ${framePending.size}: ${pendingSample.join(', ')}${
                framePending.size > pendingSample.length ? ', ...' : ''
              }`
            : ''),
        {
          level: 'warn',
        }
      );
      if (typeof onFrameState === 'function') {
        onFrameState({ expected: frameExpected, progress: frameProgress, failures: frameFailures });
      }

      if (frameFailures > DEFAULT_MAX_FAILURES) {
        const pendingSample2 = getFramePendingSample();
        debugLog(
          'toggle:scheduler',
          `Watchdog triggered: failures exceeded max (${frameFailures} > ${DEFAULT_MAX_FAILURES})` +
            (framePending.size
              ? `; pending ${framePending.size}: ${pendingSample2.join(', ')}${
                  framePending.size > pendingSample2.length ? ', ...' : ''
                }`
              : ''),
          {
            level: 'warn',
          }
        );
        this.restore({ onRestore: onWatchdogRestore });
      }
      return false;
    }

    const entries = Array.from(functionMap.entries());
    if (!entries.length) {
      resetFrameState();
      if (typeof onFrameState === 'function') {
        onFrameState({ expected: 0, progress: 0, failures: 0 });
      }
      return false;
    }

    frameExpected = entries.length;
    frameProgress = 0;
    frameFailures = 0;
    framePending = new Set(entries.map(([key]) => key));
    frameLastProgressKey = null;
    debugLog('toggle:scheduler', `runFrame: Starting frame with ${frameExpected} toggles`);
    if (typeof onFrameState === 'function') {
      onFrameState({ expected: frameExpected, progress: frameProgress, failures: frameFailures });
    }

    this.scheduleRunAll({
      onProgress: (key) => {
        frameProgress += 1;
        frameLastProgressKey = key;
        framePending.delete(key);
        if (typeof onProgress === 'function') onProgress(key);
      },
    });

    return true;
  },

  // schedule a coalesced run; multiple calls within a frame result in a single execution
  scheduleRunAll({ onProgress = null } = {}) {
    if (scheduledRun) {
      debugLog('toggle:scheduler', 'scheduleRunAll: Already scheduled, skipping coalesce');
      return;
    }
    scheduledRun = true;
    requestAnimationFrame(() => {
      try {
        this.runAll({ onProgress });
      } finally {
        scheduledRun = false;
      }
    });
  },

  getBundles() {
    return {
      functionbundle: Object.fromEntries(
        Array.from(functionMap.entries()).map(([k, meta]) => [k, meta.fn])
      ),
      dailyfunctionbundle: Object.fromEntries(
        Array.from(dailyMap.entries()).map(([k, meta]) => [k, meta.fn])
      ),
    };
  },

  clearAll() {
    debugLog(
      'toggle:scheduler',
      `Clearing all toggles: ${functionMap.size} regular + ${dailyMap.size} daily`
    );
    functionMap.clear();
    dailyMap.clear();
  },

  reset() {
    debugLog('toggle:scheduler', 'Resetting scheduler state');
    this.clearAll();
    resetFrameState();
  },

  restore({ onRestore = null } = {}) {
    debugLog('toggle:scheduler', 'Restoring scheduler (full reset)', { level: 'warn' });
    this.reset();
    if (typeof onRestore === 'function') onRestore();
  },

  getFunction(id, { daily = false } = {}) {
    const map = daily ? dailyMap : functionMap;
    const meta = map.get(id);
    return meta?.fn;
  },

  has(id, { daily = false } = {}) {
    return (daily ? dailyMap : functionMap).has(id);
  },

  list({ daily = null } = {}) {
    if (daily === true) return [...dailyMap.keys()];
    if (daily === false) return [...functionMap.keys()];
    return [...functionMap.keys(), ...dailyMap.keys()];
  },
};

export default ToggleScheduler;
