function compatibilityText(runtime) {
  return runtime.testedOn && runtime.testedOn !== '0.0.0'
    ? `Tested on: ${runtime.testedOn}`
    : 'Tested on: Untested';
}

function quickShell({ data, runtime }) {
  const rows = [
    {
      key: 'compatibility', role: 'help',
      controls: [
        { type: 'text', text: compatibilityText(runtime) },
        { type: 'text', text: runtime.curVer ? `Current version: ${runtime.curVer}` : '' },
        ...(runtime.isCheatWorkSymbol ? [{ type: 'text', text: runtime.isCheatWorkSymbol }] : []),
        { type: 'help', text: runtime.testedOn && runtime.testedOn !== '0.0.0' ? runtime.isCheatWork || 'Compatibility information' : 'Not tested in the current game version' },
      ],
    },
    { key: 'quick-heading', role: 'heading', groups: ['state'], controls: [{ type: 'heading', text: 'Quick cheats' }] },
    { key: 'unlimited-heading', role: 'heading', groups: ['tasks', 'unlimited', 'pregnancy'], controls: [{ type: 'heading', text: 'Unlimited Toggles' }] },
  ];
  if (runtime.isServer === 1) {
    rows.push({ key: 'server-heading', role: 'heading', group: 'server', controls: [{ type: 'heading', text: 'Server' }] });
    if (runtime.curVer !== runtime.testedOn) {
      rows.push({ key: 'server-version-warning', role: 'help', group: 'server', controls: [
        { type: 'text', text: 'Caution: game version is different.' },
        { type: 'help', text: 'Older or modded versions can be incompatible.' },
      ] });
    }
    rows.push({ key: 'server-save-actions', role: 'application', group: 'server', controls: [
      { type: 'text', text: 'Server Save' },
      { type: 'action', key: 'export', text: 'Export', action: 'save_data' },
      { type: 'action', key: 'import', text: 'Import', action: 'load_data' },
      { type: 'help', text: 'Export or import save slots 1–10 through the local server.' },
    ] });
  }
  rows.push({ key: 'footer', role: 'footer', controls: [
    { type: 'text', text: `Cheat version: ${runtime.cheatVer}${runtime.cheatVerType ? ` ${runtime.cheatVerType}` : ''}` },
    { type: 'link', key: 'releases', text: 'GitHub Releases', href: data.releaseSite },
    { type: 'link', key: 'source', text: 'Source Code', href: data.sourceCode },
  ] });
  return rows;
}

const statHeadings = [
  ['stats-heading', 'stats', 'Stats'], ['enemy-heading', 'enemy', 'Enemy stats'],
  ['player-heading', 'player', 'Player'], ['characteristics-heading', 'characteristics', 'Characteristics'],
  ['fame-heading', 'fame', 'Fame'], ['school-heading', 'school', 'School'],
  ['talent-heading', 'talent', 'Talent'],
];

function statShell() {
  return statHeadings.map(([key, group, text]) => ({ key, groups: [group], role: 'heading', controls: [{ type: 'heading', text }] }));
}

function miscShell() {
  return [
    { key: 'npc-heading', groups: ['npc', 'world'], role: 'heading', controls: [{ type: 'heading', text: 'NPC' }] },
    { key: 'pregnancy-heading', role: 'heading', controls: [{ type: 'heading', text: 'Pregnancy Manager' }] },
    { key: 'pregnancy-time-help', groups: ['pregnancy', 'offspring', 'pregnancy-removal'], role: 'help', controls: [
      { type: 'heading', text: 'Pregnancy time' }, { type: 'help', text: 'Values are measured in days.' },
    ] },
  ];
}

export function createSectionShells(context) {
  return Object.freeze({ quick: Object.freeze(quickShell(context)), stats: Object.freeze(statShell()), misc: Object.freeze(miscShell()) });
}
