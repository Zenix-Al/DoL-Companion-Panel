import { getRuntimeWindow } from '../../core/global-bridge.js';

import { byUiId } from './dom-query.js';

const rw = getRuntimeWindow();

const FLOATING_POSITION_KEY = 'dol-cheatplus-floating-position-v1';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyFloatingPosition(floatingButton, x, y) {
  if (!floatingButton) return;
  const maxX = Math.max(rw.innerWidth - floatingButton.offsetWidth, 0);
  const maxY = Math.max(rw.innerHeight - floatingButton.offsetHeight, 0);
  const left = clamp(x, 0, maxX);
  const top = clamp(y, 0, maxY);

  floatingButton.style.left = `${left}px`;
  floatingButton.style.top = `${top}px`;
  floatingButton.style.right = 'auto';
  floatingButton.dataset.cpCustomPosition = '1';
  floatingButton.classList.add('cp-custom-position');
}

function persistFloatingPosition(x, y) {
  try {
    rw.localStorage.setItem(FLOATING_POSITION_KEY, JSON.stringify({ x, y }));
  } catch (_) {
    /* no-op */
  }
}

function restoreFloatingPosition(floatingButton) {
  if (!floatingButton) return;
  try {
    const raw = rw.localStorage.getItem(FLOATING_POSITION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.x) || !Number.isFinite(parsed?.y)) return;
    applyFloatingPosition(floatingButton, parsed.x, parsed.y);
  } catch (_) {
    /* no-op */
  }
}

export function initFloatingButtonDrag() {
  const floatingButton = byUiId('floating-button');
  const dragHandle = byUiId('cheat-open');
  if (!floatingButton || !dragHandle || floatingButton.dataset.cpDragBound === '1') return;

  restoreFloatingPosition(floatingButton);

  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;
  let dragged = false;

  const onPointerMove = (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!dragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) dragged = true;
    if (!dragged) return;

    applyFloatingPosition(floatingButton, originLeft + dx, originTop + dy);
  };

  const onPointerUp = () => {
    rw.removeEventListener('pointermove', onPointerMove);
    rw.removeEventListener('pointerup', onPointerUp);
    floatingButton.classList.remove('cp-dragging');

    if (!dragged) return;

    const left = Number.parseFloat(floatingButton.style.left || '0');
    const top = Number.parseFloat(floatingButton.style.top || '0');
    persistFloatingPosition(left, top);
    dragHandle.dataset.cpSuppressNextClick = '1';
  };

  dragHandle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (typeof dragHandle.setPointerCapture === 'function') {
      try {
        dragHandle.setPointerCapture(event.pointerId);
      } catch (_) {
        /* no-op */
      }
    }

    startX = event.clientX;
    startY = event.clientY;
    dragged = false;

    const rect = floatingButton.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;

    floatingButton.classList.add('cp-dragging');
    rw.addEventListener('pointermove', onPointerMove);
    rw.addEventListener('pointerup', onPointerUp);
  });

  dragHandle.addEventListener('click', (event) => {
    if (dragHandle.dataset.cpSuppressNextClick !== '1') return;
    dragHandle.dataset.cpSuppressNextClick = '0';
    event.preventDefault();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    else event.stopPropagation();
  });

  rw.addEventListener('resize', () => {
    if (floatingButton.dataset.cpCustomPosition !== '1') return;
    const left = Number.parseFloat(floatingButton.style.left || '0');
    const top = Number.parseFloat(floatingButton.style.top || '0');
    applyFloatingPosition(floatingButton, left, top);
  });

  floatingButton.dataset.cpDragBound = '1';
}

export function syncHistoryButtons() {
  const backwards = byUiId('cheat-history-backwards');
  const forwards = byUiId('cheat-history-forwards');
  const gameBack = byUiId('history-backward') || document.getElementById('history-backward');
  const gameForward = byUiId('history-forward') || document.getElementById('history-forward');
  if (!backwards || !forwards || !gameBack || !gameForward) return;
  backwards.disabled = gameBack.disabled;
  forwards.disabled = gameForward.disabled;
}

export function Enable_cheat_history() {
  var button_back = byUiId('cheat-history-backwards');
  var button_forward = byUiId('cheat-history-forwards');
  var button_set =
    byUiId('Enable_cheat_history') || document.getElementById('Enable_cheat_history');
  if (!button_back || !button_forward || !button_set) return;

  if (button_back.hidden == true) {
    button_back.hidden = false;
    button_forward.hidden = false;
    button_set.innerHTML = 'Disable';
    syncHistoryButtons();
  } else {
    button_back.hidden = true;
    button_forward.hidden = true;
    button_set.innerHTML = 'Enable';
  }
}

export function Enable_sidebar_button() {
  var button = byUiId('cheat-sidebar');
  var sidebar_button = document.getElementById('Enable_sidebar_button');
  if (!button || !sidebar_button) return;

  if (button.hidden == true) {
    button.hidden = false;
    sidebar_button.innerHTML = 'Disable';
  } else {
    button.hidden = true;
    sidebar_button.innerHTML = 'Enable';
  }
}

export function simple_cheat_button() {
  const cheatButton = byUiId('cheat-open');
  const simpleCheatButton = document.getElementById('simple_cheat_button');
  if (!cheatButton || !simpleCheatButton) return;

  const isDisabled = simpleCheatButton.innerHTML === 'Disable';
  simpleCheatButton.innerHTML = isDisabled ? 'Enable' : 'Disable';
  cheatButton.innerHTML = isDisabled ? 'Cheat' : '⚙';
  cheatButton.style.fontSize = isDisabled ? '' : '89%';
}
