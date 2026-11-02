import type { MiroirTestDefinition } from "@miroir-framework/core";

export function getMiroirTestSuiteKey(instance: MiroirTestDefinition): string {
  return (
    instance.name ||
    instance.definition?.miroirTestLabel ||
    instance.uuid
  );
}

export function sortMiroirTestInstances(
  instances: MiroirTestDefinition[],
): MiroirTestDefinition[] {
  return [...instances].sort((a, b) =>
    getMiroirTestSuiteKey(a).localeCompare(getMiroirTestSuiteKey(b)),
  );
}
