export function defaultDetectLoadTrigger(target) {
  return Boolean(target?.classList?.contains('macro-button') && target?.innerHTML == 'SAVES');
}

export function defaultDetectHistoryNavigation(target) {
  return Boolean(target?.id == 'history-backward' || target?.id === 'history-forward');
}

export const defaultRuntimeObserverPolicy = Object.freeze({
  detectLoadTrigger: defaultDetectLoadTrigger,
  detectHistoryNavigation: defaultDetectHistoryNavigation,
});

export function createRuntimeObserverPolicy(overrides = {}) {
  return {
    ...defaultRuntimeObserverPolicy,
    ...overrides,
  };
}
