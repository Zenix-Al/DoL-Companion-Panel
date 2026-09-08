# Testing and debugging

```text
npm test
npm run test:unit
npm run test:integration
npm run test:parity
npm run verify:cheat-factory
npm run lint
npm run audit:imports
npm run check:docs
```

Tests run serially because JSDOM cases temporarily install browser globals. Use fake adapters, config facades, schedulers, clocks, and control scopes instead of a live game. Put browser-only evidence in a copy of the [browser smoke checklist](../testing/BROWSER_SMOKE_CHECKLIST.md).

Development builds retain debug calls; release builds remove call sites. Diagnostics must remain bounded and read-only. The full-suite baseline permits two documented server-save TODOs; do not add skips or TODOs without naming the missing capability and preserving a focused test.
