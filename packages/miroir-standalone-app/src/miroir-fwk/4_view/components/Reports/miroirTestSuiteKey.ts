import type { MiroirTestDefinition } from "miroir-core";

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
