import { createCheat } from '../../create-cheat.js';

function sellingEntries(game) {
  return Object.entries(game.get('farmersProduce.selling') ?? {})
    .map(([name, raw]) => ({ name, amount: Number(raw) }))
    .filter(({ amount }) => Number.isFinite(amount))
    .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name));
}

function renderReport({ game, controls }) {
  const entries = sellingEntries(game);
  controls.text(
    'report',
    entries.length
      ? entries.map(({ name, amount }, index) => `${index + 1}. ${name}: ${amount}`).join(' | ')
      : 'No produce sales recorded.'
  );
}

export const produceSalesReportCheat = createCheat({
  id: 'world.produce-sales-report',
  location: { section: 'misc', group: 'produce-inspection', order: 130 },
  meta: {
    label: 'Produce Sales',
    controls: [
      { key: 'report', type: 'text' },
      { key: 'refresh', type: 'button', label: 'Refresh', action: 'refresh' },
    ],
  },
  requiredPaths: ['farmersProduce.selling'],
  isApplicable({ game }) {
    const selling = game.get('farmersProduce.selling');
    return Boolean(selling) && typeof selling === 'object' && !Array.isArray(selling);
  },
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    refresh() {
      return { ok: true, message: 'Produce sales refreshed.', refresh: true };
    },
  },
  sync: renderReport,
});
