export const BUILDER_LIFECYCLE_METHODS = Object.freeze([
  'compile',
  'configureSections',
  'mountSection',
  'sectionOpened',
  'teardown',
  'health',
]);

export function createBuilderLifecycleHandle(implementation) {
  if (!implementation || typeof implementation !== 'object') {
    throw new TypeError('Builder lifecycle implementation must be an object.');
  }
  for (const method of BUILDER_LIFECYCLE_METHODS) {
    if (typeof implementation[method] !== 'function') {
      throw new TypeError(`Builder lifecycle requires ${method}().`);
    }
  }
  return Object.freeze({ ...implementation });
}

export function isBuilderHealth(value) {
  return Boolean(
    value &&
      Number.isInteger(value.total) &&
      Number.isInteger(value.mounted) &&
      Number.isInteger(value.failed) &&
      Array.isArray(value.mountedSections) &&
      Array.isArray(value.failures)
  );
}
