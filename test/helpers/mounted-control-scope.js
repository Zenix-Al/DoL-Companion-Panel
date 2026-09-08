function createElement(document, definition) {
  let element;
  switch (definition.type) {
    case 'button':
      element = document.createElement('button');
      element.type = 'button';
      element.textContent = definition.label ?? '';
      break;
    case 'toggle':
      element = document.createElement('input');
      element.type = 'checkbox';
      break;
    case 'select':
      element = document.createElement('select');
      break;
    case 'range':
      element = document.createElement('input');
      element.type = 'range';
      break;
    case 'text':
      element = document.createElement('span');
      element.textContent = definition.label ?? '';
      break;
    case 'input':
    default:
      element = document.createElement('input');
      element.type = 'text';
      break;
  }
  element.dataset.cheatControl = definition.key;
  return element;
}

function normalizeOption(option) {
  if (option && typeof option === 'object') {
    return {
      value: String(option.value ?? ''),
      label: String(option.label ?? option.value ?? ''),
    };
  }
  return { value: String(option ?? ''), label: String(option ?? '') };
}

export function createMountedControlScope({ document, descriptor, parent = document.body }) {
  const root = document.createElement('section');
  root.dataset.cheatId = descriptor.id;
  const elements = new Map();

  for (const definition of descriptor.meta?.controls ?? []) {
    if (!definition?.key) throw new Error(`Cheat "${descriptor.id}" has a control without a key.`);
    if (elements.has(definition.key)) {
      throw new Error(`Cheat "${descriptor.id}" has duplicate control key "${definition.key}".`);
    }
    const element = createElement(document, definition);
    root.appendChild(element);
    elements.set(definition.key, element);
  }
  parent.appendChild(root);

  function requireElement(key) {
    const element = elements.get(key);
    if (!element) throw new Error(`Cheat "${descriptor.id}" has no control "${key}".`);
    return element;
  }

  function setOptions(key, options) {
    const element = requireElement(key);
    if (!(element instanceof document.defaultView.HTMLSelectElement)) {
      throw new Error(`Cheat control "${key}" is not a select.`);
    }
    element.replaceChildren();
    for (const option of options ?? []) {
      const normalized = normalizeOption(option);
      const optionElement = document.createElement('option');
      optionElement.value = normalized.value;
      optionElement.textContent = normalized.label;
      element.appendChild(optionElement);
    }
  }

  for (const definition of descriptor.meta?.controls ?? []) {
    if (definition.type === 'select') setOptions(definition.key, definition.options ?? []);
    if (definition.value !== undefined) {
      const element = requireElement(definition.key);
      if ('value' in element) element.value = String(definition.value);
    }
  }

  const controls = createControlScope({ descriptor, root });

  return {
    root,
    controls,
    elements,
    unmount() {
      root.remove();
    },
  };
}
import { createControlScope } from '../../src/cheat/runtime/control-scope.js';
