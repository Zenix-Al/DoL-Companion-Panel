import { CHEAT_CONFIG_SCHEMA } from '../cheat/contract/config-schema.js';
import { createGameContext } from '../cheat/runtime/game-context.js';
import { createDiagnosticProbe, createDiagnosticRunner } from '../core/health.js';

export function createProductionDiagnostics({ catalog, adapter, getHealth, getAliases, scheduler }) {
  const descriptors = catalog.listCheats();
  const game = createGameContext(adapter);
  const probes = [
    createDiagnosticProbe({
      id: 'catalog.identity', label: 'Catalog identity', scope: 'catalog', timeoutMs: 250,
      run: () => ({ status: new Set(descriptors.map(({ id }) => id)).size === descriptors.length ? 'pass' : 'fail', message: `${descriptors.length} descriptors.` }),
    }),
    createDiagnosticProbe({
      id: 'runtime.paths', label: 'Runtime applicability', scope: 'runtime', timeoutMs: 500,
      applicable: () => adapter.isReady?.() !== false,
      run: () => {
        const missing = descriptors.filter(({ requiredPaths = [] }) =>
          requiredPaths.some((path) => !game.has(path))
        ).length;
        return { status: missing ? 'warning' : 'pass', message: `${missing} descriptors have unavailable required paths.` };
      },
    }),
    createDiagnosticProbe({
      id: 'builder.health', label: 'Builder health', scope: 'runtime', timeoutMs: 250,
      run: () => { const health = getHealth(); return { status: health.failed ? 'fail' : 'pass', message: `${health.mounted}/${health.total} mounted; ${health.failed} failed.` }; },
    }),
    createDiagnosticProbe({
      id: 'aliases.registration', label: 'Alias registration', scope: 'aliases', timeoutMs: 250,
      run: () => { const aliases = getAliases(); return { status: new Set(aliases).size === aliases.length ? 'pass' : 'fail', message: `${aliases.length} aliases registered.` }; },
    }),
    createDiagnosticProbe({
      id: 'scheduler.ownership', label: 'Scheduler ownership', scope: 'scheduler', timeoutMs: 250,
      run: () => ({ status: 'pass', message: `${scheduler.list().length} scheduler entries.` }),
    }),
    createDiagnosticProbe({
      id: 'config.references', label: 'Config references', scope: 'config', timeoutMs: 250,
      run: () => { const paths = new Set(CHEAT_CONFIG_SCHEMA.map(({ path }) => path)); const invalid = descriptors.flatMap(({ config = [] }) => config).filter((path) => !paths.has(path)); return { status: invalid.length ? 'fail' : 'pass', message: `${invalid.length} invalid config references.` }; },
    }),
  ];
  return createDiagnosticRunner({ probes });
}
