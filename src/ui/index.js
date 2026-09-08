import debugLog from '../core/logger.js';
import { safeCall } from '../core/safe-exec.js';
import { dispatch } from '../core/actions/dispatcher.js';

import { registerSheet, applyToShadow } from './theme/style-registry.js';
import { closeModal, openModal } from './shell/modal.js';
import { byUiId, ensureShadowRoot, refreshUiRefs } from './shell/dom-query.js';
import { initFloatingButtonDrag } from './shell/floating-controls.js';
import { layoutTemplate, renderTemplate } from './shell/layout.js';
import baseCssText from './theme/base.css';
import floatingCssText from './theme/floating.css';
import modalCssText from './theme/modal.css';
import responsiveCssText from './theme/responsive.css';
import toastCssText from './theme/toast.css';
import tokensText from './theme/tokens.css';

// Register stylesheets once at module load time (pure registration, no DOM side effects)
registerSheet(tokensText, { target: 'shadow' });
registerSheet(baseCssText, { target: 'shadow' });
registerSheet(floatingCssText, { target: 'shadow' });
registerSheet(toastCssText, { target: 'shadow' });
registerSheet(modalCssText, { target: 'shadow' });
registerSheet(responsiveCssText, { target: 'shadow' });

function bindOnce(element, flag, eventName, handler) {
  if (!element || element[flag]) return;
  element.addEventListener(eventName, handler);
  element[flag] = true;
}

function shouldCloseModalFromTarget(target) {
  if (!target?.id) return false;
  // explicit modal close controls are handled inside the modal component
  if (target.id !== 'modal') return false;

  const modal = byUiId('modal');
  if (!modal) return true;
  const content = modal.querySelector('.modal-content');
  return !(content && content.contains(target));
}

function mountInterface() {
  if (!document.body) {
    requestAnimationFrame(mountInterface);
    return;
  }

  const root = ensureShadowRoot();
  if (!root) {
    debugLog('ui', 'mountInterface: ensureShadowRoot returned null');
    return;
  }
  if (byUiId('cheat')) return;

  // inject UI stylesheets via registry (tokens first, then component styles)
  const styleApplied = safeCall('CSS injection failed:', () => {
    applyToShadow(root);
    return true;
  });
  // injection failure should not block mounting
  if (!styleApplied) {
    // no-op fallback; mount continues below
  }

  root.appendChild(renderTemplate(layoutTemplate));
  refreshUiRefs();
  initFloatingButtonDrag();
  debugLog('ui', 'mountInterface: mounted template', {
    data: { modalContainer: !!byUiId('modal-content-container') },
  });

  // Attach a direct button handler so the modal opens even if feature listeners
  // haven't been initialized yet (safe MVP fallback).
  safeCall('failed to bind fallback open handler', () => {
    const btn = byUiId('cheat-open');
    bindOnce(btn, '__cheatPlusBound', 'click', () => {
      safeCall('openModal failed:', () => openModal());
    });

    const btnSidebar = byUiId('cheat-sidebar');
    bindOnce(btnSidebar, '__cheatPlusBoundSidebar', 'click', () => {
      safeCall('cheat-sidebar failed:', () => dispatch('cheat-sidebar'));
    });

    const histBack = byUiId('cheat-history-backwards');
    bindOnce(histBack, '__cheatPlusBoundHistBack', 'click', () => {
      safeCall('history-back failed:', () => dispatch('cheat-history-backwards'));
    });

    const histFor = byUiId('cheat-history-forwards');
    bindOnce(histFor, '__cheatPlusBoundHistFor', 'click', () => {
      safeCall('history-for failed:', () => dispatch('cheat-history-forwards'));
    });

    const rootEl = byUiId('cheat');
    bindOnce(rootEl, '__cheatPlusCloseBound', 'click', (event) => {
      const target = event.target;
      if (!shouldCloseModalFromTarget(target)) return;
      safeCall('closeModal fallback failed:', () => closeModal());
    });
  });
}

export { mountInterface, renderTemplate, layoutTemplate };
