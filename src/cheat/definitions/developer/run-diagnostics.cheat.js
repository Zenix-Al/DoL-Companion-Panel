import { createCheat } from '../../create-cheat.js';

const revealed = new WeakSet();
const lastReports = new WeakMap();

function setRevealed(controls, visible) {
  for (const key of ['run', 'copy', 'report']) controls.element(key).hidden = !visible;
  controls.element('reveal').hidden = visible;
  if (visible) revealed.add(controls);
  else revealed.delete(controls);
}

export const runDiagnosticsCheat = createCheat({
  id: 'developer.run-diagnostics',
  location: { section: 'misc', group: 'developer-tools', order: 1000 },
  meta: {
    label: 'Developer Tools',
    controls: [
      { key: 'reveal', type: 'button', label: 'Show Developer Tools', action: 'reveal' },
      { key: 'run', type: 'button', label: 'Run Diagnostics', action: 'run' },
      { key: 'copy', type: 'button', label: 'Copy Report', action: 'copy' },
      { key: 'report', type: 'input' },
    ],
  },
  actions: {
    reveal({ controls }) {
      setRevealed(controls, true);
      return { ok: true, message: 'Developer Tools revealed for this modal.' };
    },
    async run({ controls, services }) {
      if (!revealed.has(controls))
        return { ok: false, kind: 'blocked', message: 'Reveal Developer Tools first.' };
      if (!services.diagnostics?.runAll)
        return { ok: false, kind: 'blocked', message: 'Diagnostics service is unavailable.' };
      const report = await services.diagnostics.runAll();
      const text = services.diagnostics.formatReport(report);
      lastReports.set(controls, text);
      controls.setValue('report', text);
      return {
        ok: report.fail === 0,
        kind: report.fail === 0 ? 'success' : 'validation',
        variant: report.fail === 0 ? 'success' : 'warning',
        message: `Diagnostics complete: ${report.pass} pass, ${report.warning} warning, ${report.fail} fail, ${report.blocked} blocked.`,
      };
    },
    async copy({ controls }) {
      if (!revealed.has(controls))
        return { ok: false, kind: 'blocked', message: 'Reveal Developer Tools first.' };
      const text = lastReports.get(controls) ?? controls.value('report');
      if (!text) return { ok: false, kind: 'blocked', message: 'Run diagnostics before copying.' };
      const input = controls.element('report');
      const clipboard = input.ownerDocument.defaultView.navigator.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(text);
        return { ok: true, message: 'Diagnostic report copied.' };
      }
      input.hidden = false;
      input.focus();
      input.select();
      return { ok: true, variant: 'info', message: 'Clipboard unavailable; report selected.' };
    },
  },
  onEnable({ controls }) {
    setRevealed(controls, false);
  },
  dispose({ controls }) {
    revealed.delete(controls);
    lastReports.delete(controls);
  },
  diagnostics: { developerOnly: true, readOnly: true },
});
