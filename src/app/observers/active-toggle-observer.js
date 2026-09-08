let activeToggleObserver = null;

export function setActiveToggleObserver(observer) {
  activeToggleObserver = observer ?? null;
  return activeToggleObserver;
}

export function getActiveToggleObserver() {
  return activeToggleObserver;
}

export function clearActiveToggleObserver() {
  activeToggleObserver = null;
}
