import type { Runner } from "miroir-core";

import runnerCreateEntity from "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/82f81a25-2366-4abf-8a97-83ca5e9a9c46.json" assert { type: "json" };
import runnerDropEntity from "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/44313751-b0e5-4132-bb12-a544806e759b.json" assert { type: "json" };

/** Runners keyed by leaf `runnerRef` for Miroir-app entity runner MiroirTests. */
export const RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY: Record<string, Runner> = {
  createEntity: runnerCreateEntity as unknown as Runner,
  dropEntity: runnerDropEntity as unknown as Runner,
};

export function resolveRunnerMiroirEntityRunnerRef(runnerRef: string): Runner {
  const runner = RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef for Miroir entity runner suite: ${runnerRef}`);
  }
  return runner;
}
