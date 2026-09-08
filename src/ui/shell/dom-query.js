import { SHADOW_HOST_ID } from '../constants.js';
import debugLog from '../../core/logger.js';

export let shadowHost = null;
export let shadowRoot = null;

export let quicklink = null;
export let statlink = null;
export let misclink = null;
export let quickcontent = null;
export let statscontent = null;
export let misccontent = null;
export let toastContainer = null;
export let modal = null;
export let modalContentContainer = null;
export let cheat = null;

export function getUiRoot() {
  return shadowRoot || document;
}

export function byUiId(id) {
  if (shadowRoot) {
    if (typeof shadowRoot.getElementById === 'function') {
      const el = shadowRoot.getElementById(id);
      if (el) return el;
    }
    const el = shadowRoot.querySelector('#' + id);
    if (el) return el;
  }
  return document.getElementById(id);
}

export function ensureShadowRoot() {
  if (shadowRoot) return shadowRoot;
  if (!document.body) return null;

  shadowHost = document.getElementById(SHADOW_HOST_ID);
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = SHADOW_HOST_ID;
    document.body.appendChild(shadowHost);
    try {
      debugLog('ui', 'ensureShadowRoot: created shadow host', { data: { id: SHADOW_HOST_ID } });
    } catch (e) {
      /* no-op */
    }
  }

  shadowRoot = shadowHost.shadowRoot || shadowHost.attachShadow({ mode: 'open' });
  try {
    debugLog('ui', 'ensureShadowRoot: shadowRoot attached', {
      data: { hasShadowRoot: !!shadowRoot },
    });
  } catch (e) {
    /* no-op */
  }
  return shadowRoot;
}

export function refreshUiRefs() {
  quicklink = byUiId('quick-link');
  statlink = byUiId('stats-link');
  misclink = byUiId('misc-link');
  quickcontent = byUiId('quick-content');
  statscontent = byUiId('stats-content');
  misccontent = byUiId('misc-content');
  toastContainer = byUiId('toastContainer');
  modal = byUiId('modal');
  modalContentContainer = byUiId('modal-content-container');
  cheat = byUiId('cheat');
  try {
    debugLog('ui', 'refreshUiRefs', {
      data: {
        cheat: !!cheat,
        modal: !!modal,
        modalContentContainer: !!modalContentContainer,
      },
    });
  } catch (e) {
    /* no-op */
  }
}

refreshUiRefs();

export function getUiRefs() {
  refreshUiRefs();
  return {
    quicklink,
    quickcontent,
    statlink,
    statscontent,
    misclink,
    misccontent,
  };
}

/**
 * Replace a <select> element's options while preserving the current selection if still valid.
 * @param {HTMLSelectElement|null} selectElement
 * @param {Array<{value: string|number, label: string}>} options
 */
export function replaceSelectOptions(selectElement, options) {
  if (!selectElement) return;
  const previousValue = selectElement.value;
  selectElement.replaceChildren();

  options.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label;
    selectElement.appendChild(option);
  });

  if (previousValue && options.some((option) => String(option.value) === previousValue)) {
    selectElement.value = previousValue;
  } else if (options.length > 0) {
    selectElement.value = String(options[0].value);
  }
}
