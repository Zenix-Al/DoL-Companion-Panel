const modalTemplate = {
  tag: 'div',
  id: 'modal',
  class: 'modal',
  children: [
    {
      tag: 'div',
      class: 'modal-content',
      children: [
        {
          tag: 'div',
          class: 'navbar',
          children: [
            { tag: 'div', id: 'quick-link', class: 'nav-link gold', text: 'Quick' },
            { tag: 'div', id: 'stats-link', class: 'nav-link', text: 'Stat' },
            { tag: 'div', id: 'misc-link', class: 'nav-link', text: 'Misc' },
            { tag: 'div', id: 'close-modal-top', class: 'close nav-link', text: '\u00d7' },
          ],
        },
        {
          tag: 'div',
          id: 'modal-content-container',
          children: [
            { tag: 'div', id: 'quick-content', class: 'cheat-content active' },
            { tag: 'div', id: 'stats-content', class: 'cheat-content' },
            { tag: 'div', id: 'misc-content', class: 'cheat-content' },
          ],
        },
        {
          tag: 'div',
          class: 'navbar',
          children: [{ tag: 'div', id: 'close-modal-bottom', class: 'close nav-link', text: '\u00d7' }],
        },
      ],
    },
  ],
};

const layoutTemplate = {
  tag: 'div',
  id: 'cheat',
  children: [
    {
      tag: 'div',
      id: 'floating-button',
      children: [
        { tag: 'button', id: 'cheat-history-backwards', text: '\u2190', hidden: true },
        { tag: 'button', id: 'cheat-history-forwards', text: '\u2192', hidden: true },
        { tag: 'button', id: 'cheat-sidebar', text: '\u2630', hidden: true },
        { tag: 'button', id: 'cheat-open', text: 'Cheat' },
      ],
    },
    { tag: 'div', id: 'toastContainer' },
    { tag: 'div', id: 'effect-layer', class: 'hidden' },
    // Modal is injected lazily on first open.
  ],
};

export function renderTemplate(template) {
  const el = document.createElement(template.tag);
  if (template.id) el.id = template.id;
  if (template.class) el.className = template.class;
  if (template.text) el.textContent = template.text;
  if (template.hidden) el.hidden = true;
  if (template.children) {
    template.children.forEach((child) => el.appendChild(renderTemplate(child)));
  }
  return el;
}

export { layoutTemplate, modalTemplate };
