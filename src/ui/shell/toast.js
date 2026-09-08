import { byUiId } from './dom-query.js';

const FALLBACK_CONTAINER_ID = 'cp-fallback-toast-container';
const MAX_TOASTS = 4;
const DEFAULT_DURATION = 3000;
let toastSequence = 0;

function ensureFallbackContainer() {
  let container = document.getElementById(FALLBACK_CONTAINER_ID);
  if (container) return container;

  container = document.createElement('div');
  container.id = FALLBACK_CONTAINER_ID;
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function getToastContainer() {
  const shadowContainer = byUiId('toastContainer');
  if (shadowContainer) return shadowContainer;
  return ensureFallbackContainer();
}

function normalizeToastArgs(message, optionsOrDuration) {
  if (typeof optionsOrDuration === 'number') {
    return {
      message,
      duration: optionsOrDuration,
      variant: 'info',
    };
  }

  return {
    message,
    duration: optionsOrDuration?.duration ?? DEFAULT_DURATION,
    variant: optionsOrDuration?.variant ?? 'info',
    title: optionsOrDuration?.title,
  };
}

/**
 * Show a toast notification.
 *
 * @param {string} message
 * @param {{duration?:number,variant?:'info'|'success'|'warning'|'error',title?:string}|number} [optionsOrDuration]
 */
export function showToast(message, optionsOrDuration) {
  const { duration, variant, title } = normalizeToastArgs(message, optionsOrDuration);

  const toastContainer = getToastContainer();
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.classList.add('toast', 'toast-enter', `toast--${variant}`);

  if (title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    toast.appendChild(titleEl);
  }

  const bodyEl = document.createElement('div');
  bodyEl.className = 'toast-body';
  bodyEl.textContent = message;
  toast.appendChild(bodyEl);

  toast.dataset.cpToastSequence = String(++toastSequence);

  toastContainer.appendChild(toast);

  while (toastContainer.children.length > MAX_TOASTS) {
    toastContainer.firstElementChild?.remove();
  }

  requestAnimationFrame(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-show');
  });

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-leave');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
}

export function getToastSequence() {
  return toastSequence;
}

export const timedToast = (text, time, options) => setTimeout(() => showToast(text, options), time);
