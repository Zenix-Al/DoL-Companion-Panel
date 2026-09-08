let activeBuilder = null;

export function setActiveCheatBuilder(builder) {
  activeBuilder = builder ?? null;
  return activeBuilder;
}

export function getActiveCheatBuilder() {
  return activeBuilder;
}

export async function teardownActiveCheatBuilder() {
  return activeBuilder?.teardown?.() ?? false;
}
