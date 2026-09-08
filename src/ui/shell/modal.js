import { get, set } from '../../core/state.js';
import { dispatch } from '../../core/actions/dispatcher.js';

import { byUiId, getUiRoot, refreshUiRefs } from './dom-query.js';
import { modalTemplate, renderTemplate } from './layout.js';
import { ensureModalHotkey } from './modal-hotkey.js';

let teardownModalRuntime = null;

export function configureModalRuntimeTeardown(teardown) {
  teardownModalRuntime = typeof teardown === 'function' ? teardown : null;
}

function toggleModalByHotkey() {
  if (get('modal.open')) closeModal();
  else openModal();
}

function filterSectionRows(sectionEl, query) {
  if (!sectionEl) return;
  const norm = String(query ?? '')
    .trim()
    .toLowerCase();
  const rows = sectionEl.querySelectorAll('.modal-content-padding');
  rows.forEach((row) => {
    if (row.classList.contains('cp-search-row')) return;
    if (!norm) {
      row.style.display = '';
      return;
    }
    const haystack = (row.textContent || '').toLowerCase();
    row.style.display = haystack.includes(norm) ? '' : 'none';
  });
}

function attachSectionSearch(sectionEl, title) {
  if (!sectionEl || sectionEl.querySelector('.cp-search-row')) return;

  const row = document.createElement('div');
  row.className = 'modal-content-padding cp-search-row';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'cp-search-input';
  input.placeholder = `Search ${title}...`;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', `${title} search`);

  input.addEventListener('input', () => filterSectionRows(sectionEl, input.value));
  row.appendChild(input);
  sectionEl.prepend(row);
}

function ensureSectionSearchBars() {
  attachSectionSearch(byUiId('quick-content'), 'Quick');
  attachSectionSearch(byUiId('stats-content'), 'Stat');
  attachSectionSearch(byUiId('misc-content'), 'Misc');
}

function ensureModalInjected() {
  if (byUiId('modal')) return;
  const root = getUiRoot();
  const cheatRoot = byUiId('cheat');
  if (!root || !cheatRoot) return;

  const modalEl = renderTemplate(modalTemplate);
  modalEl.addEventListener('click', (event) => {
    const id = event.target?.id;
    if (id === 'close-modal-top' || id === 'close-modal-bottom') {
      closeModal();
      return;
    }

    if (id === 'quick-link' || id === 'stats-link' || id === 'misc-link') {
      dispatch(id);
    }
  });
  cheatRoot.appendChild(modalEl);
  refreshUiRefs();
}

export function bloodEffect() {
  const effect = byUiId('effect-layer');
  const bodyElement = document.body;

  if (!effect) return;

  effect.classList.remove('hidden');
  effect.style.transition = 'opacity 0.1s ease-in-out';
  effect.style.opacity = 0;

  setTimeout(() => {
    effect.style.transition = 'opacity 2s ease-in-out';
    effect.style.opacity = 1;
    bodyElement.classList.add('shake');
  }, 200);

  setTimeout(() => {
    bodyElement.classList.remove('shake');
    effect.classList.add('hidden');
  }, 2200);
}

export function openModal() {
  if (get('modal.open')) return;

  ensureModalHotkey(toggleModalByHotkey);

  ensureModalInjected();
  const modal = byUiId('modal');
  if (!modal) return;

  modal.style.display = 'block';
  set('modal.open', true);
  set('modal.isDelete', false);
  set('modal.isCheatPressed', false);
  dispatch('init_interface');
  ensureSectionSearchBars();
  dispatch('quick-link');
}

export function closeModal() {
  if (!get('modal.open')) return;
  const modal = byUiId('modal');
  if (!modal) return;

  void teardownModalRuntime?.();
  set('modal.isDelete', true);
  modal.remove();
  refreshUiRefs();
  set('modal.open', false);
  set('modal.isDelete', false);
  set('modal.isCheatPressed', false);
}

ensureModalHotkey(toggleModalByHotkey);
