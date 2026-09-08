export const LAYOUT_CLASSES = Object.freeze({
  row: 'cp-layout-row',
  cheat: 'cp-layout-cheat-row',
  group: 'cp-layout-group',
  heading: 'cp-layout-heading',
  help: 'cp-layout-help',
  spacer: 'cp-layout-spacer',
  footer: 'cp-layout-footer',
});

export function classifyLayoutControls(controls = []) {
  const types = new Set(controls.map(({ type }) => type));
  if (types.size === 1 && types.has('header')) return LAYOUT_CLASSES.heading;
  if (types.size === 1 && types.has('break')) return LAYOUT_CLASSES.spacer;
  if (types.has('link')) return LAYOUT_CLASSES.footer;
  if (types.has('tooltip')) return LAYOUT_CLASSES.help;
  return LAYOUT_CLASSES.group;
}

