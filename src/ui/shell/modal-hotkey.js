import { getRuntimeWindow } from '../../core/global-bridge.js';

const MODAL_HOTKEY_STORAGE_KEY = 'dol-cheatplus-hotkey';
const MODAL_HOTKEY_GUARD_KEY = '__DOL_CP_MODAL_HOTKEY_BOUND__';
const DEFAULT_MODAL_HOTKEY = 'ctrl+shift+c';

let toggleModal = null;

function parseHotkey(hotkey) {
  const raw = String(hotkey || '')
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (raw === 'off' || raw === 'disabled') return { disabled: true };

  const parts = raw
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    ctrl: mods.has('ctrl') || mods.has('control'),
    alt: mods.has('alt'),
    shift: mods.has('shift'),
  };
}

function resolveModalHotkey() {
  const runtimeWindow = getRuntimeWindow();
  let configured = DEFAULT_MODAL_HOTKEY;

  try {
    const saved = runtimeWindow?.localStorage?.getItem(MODAL_HOTKEY_STORAGE_KEY);
    if (saved) configured = saved;
  } catch (_) {
    /* no-op */
  }

  return parseHotkey(configured);
}

function isEditableTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || '').toLowerCase();
  return (
    tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true
  );
}

function matchesHotkey(event, hotkey) {
  if (!hotkey || hotkey.disabled) return false;
  const key = String(event.key || '').toLowerCase();
  return (
    key === hotkey.key &&
    Boolean(event.ctrlKey) === Boolean(hotkey.ctrl) &&
    Boolean(event.altKey) === Boolean(hotkey.alt) &&
    Boolean(event.shiftKey) === Boolean(hotkey.shift)
  );
}

/**
 * Ensures the modal hotkey listener is bound exactly once.
 * @param {() => void} toggleFn callback used to toggle modal visibility
 */
export function ensureModalHotkey(toggleFn) {
  if (typeof toggleFn === 'function') toggleModal = toggleFn;

  const runtimeWindow = getRuntimeWindow();
  if (runtimeWindow?.[MODAL_HOTKEY_GUARD_KEY]) return;

  const onKeydown = (event) => {
    if (isEditableTarget(event.target)) return;
    if (!matchesHotkey(event, resolveModalHotkey())) return;

    event.preventDefault();
    if (typeof toggleModal === 'function') toggleModal();
  };

  document.addEventListener('keydown', onKeydown);
  if (runtimeWindow) runtimeWindow[MODAL_HOTKEY_GUARD_KEY] = true;
}
