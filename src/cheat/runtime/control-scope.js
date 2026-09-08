export function createControlScope({ descriptor, root }) {
  if (!descriptor?.id) throw new TypeError('Control scope requires a descriptor.');
  if (!root?.querySelectorAll) throw new TypeError('Control scope requires a mounted root.');
  const definitions = new Map(
    (descriptor.meta?.controls ?? []).map((control) => [control.key, control])
  );
  const elements = new Map();
  for (const element of root.querySelectorAll('[data-cheat-control]')) {
    const key = element.dataset.cheatControl;
    if (definitions.has(key)) elements.set(key, element);
  }

  function element(key) {
    const found = elements.get(key);
    if (!found) throw new Error(`Cheat "${descriptor.id}" has no mounted control "${key}".`);
    return found;
  }

  function syncPresentation(target) {
    if (target.dataset.toggleButton === 'true') {
      const active = target.getAttribute('aria-pressed') === 'true';
      target.classList.toggle('cp-toggle-active', active);
      return;
    }
    if (target.type !== 'checkbox') return;
    const wrapper = target.closest('.modal-toggle');
    wrapper?.classList.toggle('cp-toggle-active', Boolean(target.checked));
  }

  const value = (key) => {
    const target = element(key);
    return target.dataset.toggleButton === 'true'
      ? target.getAttribute('aria-pressed') === 'true'
      : target.type === 'checkbox'
      ? Boolean(target.checked)
      : 'value' in target
      ? target.value
      : target.textContent;
  };

  return Object.freeze({
    element,
    value,
    number: (key) => Number(value(key)),
    checked: (key) => {
      const target = element(key);
      return target.dataset.toggleButton === 'true'
        ? target.getAttribute('aria-pressed') === 'true'
        : Boolean(target.checked);
    },
    setValue(key, next) {
      const target = element(key);
      if (target.dataset.toggleButton === 'true')
        target.setAttribute('aria-pressed', String(Boolean(next)));
      else if (target.type === 'checkbox') target.checked = Boolean(next);
      else if ('value' in target) target.value = next == null ? '' : String(next);
      else target.textContent = next == null ? '' : String(next);
      syncPresentation(target);
    },
    text(key, next) {
      element(key).textContent = next == null ? '' : String(next);
    },
    options(key, options = []) {
      const target = element(key);
      if (target.tagName !== 'SELECT') throw new Error(`Cheat control "${key}" is not a select.`);
      const selected = target.value;
      target.replaceChildren(
        ...options.map((option) => {
          const node = target.ownerDocument.createElement('option');
          const normalized =
            option && typeof option === 'object' ? option : { value: option, label: option };
          node.value = String(normalized.value ?? '');
          node.textContent = String(normalized.label ?? normalized.value ?? '');
          return node;
        })
      );
      if ([...target.options].some(({ value }) => value === selected)) target.value = selected;
      return Object.freeze({
        previousValue: selected,
        value: target.value,
        selectionChanged: Boolean(selected) && target.value !== selected,
      });
    },
    setEnabled(key, enabled, reason = '') {
      const target = element(key);
      target.disabled = !enabled;
      const wrapper = target.closest('.modal-toggle');
      if (wrapper) wrapper.setAttribute('aria-disabled', String(!enabled));
      if (reason) target.dataset.disabledReason = reason;
      else delete target.dataset.disabledReason;
    },
  });
}
