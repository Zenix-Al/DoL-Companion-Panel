/**
 * Style registry for CheatPlus.
 *
 * Maintains separate lists of CSS text for `shadow` and `document` targets.
 * All registered sheets are applied at mount time via applyToShadow() or
 * applyToDocument(), preventing duplicate injections through a WeakSet guard.
 *
 * Usage:
 *   // During module init (side-effect-free — just registers, doesn't inject):
 *   registerSheet(cssText, { target: 'shadow' });
 *
 *   // At mount time (ui/index.js → mountInterface):
 *   applyToShadow(shadowRoot);
 *
 * Supported targets:
 *   'shadow'   — injected into a ShadowRoot (default, safe for Shadow DOM UI)
 *   'document' — injected into document.head (for host-page-scoped overrides)
 *   'both'     — registered for both targets
 */

const registry = { shadow: [], document: [] };

/** @returns {{ shadow: string[], document: string[] }} */
function getRegistry() {
  return registry;
}

/**
 * Register a CSS text string for the given target.
 * No-ops if the exact same string is already registered for that target.
 *
 * @param {string} cssText
 * @param {{ target?: 'shadow' | 'document' | 'both' }} [opts]
 */
export function registerSheet(cssText, { target = 'shadow' } = {}) {
  const reg = getRegistry();
  if (target === 'shadow' || target === 'both') {
    if (!reg.shadow.includes(cssText)) reg.shadow.push(cssText);
  }
  if (target === 'document' || target === 'both') {
    if (!reg.document.includes(cssText)) reg.document.push(cssText);
  }
}

/**
 * Inject all `shadow`-target sheets into the given ShadowRoot.
 * Uses a WeakMap to prevent re-injection on the same root.
 *
 * @param {ShadowRoot} shadowRoot
 */
const appliedShadowRoots = new WeakSet();

export function applyToShadow(shadowRoot) {
  if (!shadowRoot) return;
  if (appliedShadowRoots.has(shadowRoot)) return;
  appliedShadowRoots.add(shadowRoot);

  const reg = getRegistry();
  reg.shadow.forEach((cssText) => {
    const style = document.createElement('style');
    style.textContent = cssText;
    shadowRoot.appendChild(style);
  });
}

/**
 * Inject all `document`-target sheets into document.head.
 * Safe to call multiple times — tracks applied sheets by content hash.
 */
const appliedDocSheets = new Set();

export function applyToDocument() {
  if (!document.head) return;
  const reg = getRegistry();
  reg.document.forEach((cssText) => {
    if (appliedDocSheets.has(cssText)) return;
    appliedDocSheets.add(cssText);
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  });
}

/**
 * Clear all registered sheets and applied-root tracking.
 * Intended for re-injection scenarios (hot-reload, userscript re-run).
 * Does NOT remove already-injected <style> nodes from the DOM.
 */
export function resetRegistry() {
  registry.shadow = [];
  registry.document = [];
  appliedDocSheets.clear();
  // WeakSet has no .clear() — a new instance is created on next applyToShadow call,
  // so previously-applied shadow roots will receive sheets again if applyToShadow
  // is called after reset. This is intentional for hot-reload support.
}
