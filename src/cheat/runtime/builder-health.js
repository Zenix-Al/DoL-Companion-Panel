function freezeFailure(failure) {
  return Object.freeze({ ...failure });
}

export function createBuilderHealth({ descriptors, mounted, failures, mountedSections }) {
  const instances = [...mounted.values()];
  const applicable = instances.filter(({ applicable }) => applicable).length;
  return Object.freeze({
    total: descriptors.length,
    applicable,
    mounted: instances.length,
    disabled: instances.length - applicable,
    failed: failures.size,
    mountedSections: Object.freeze([...mountedSections]),
    failures: Object.freeze([...failures.values()].map(freezeFailure)),
  });
}

export function describeBuilderFailure(descriptor, phase, error) {
  return Object.freeze({
    cheatId: descriptor.id,
    phase,
    code: `CHEAT_${phase.toUpperCase()}_FAILED`,
    errorType: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error ?? 'Unknown error'),
  });
}
