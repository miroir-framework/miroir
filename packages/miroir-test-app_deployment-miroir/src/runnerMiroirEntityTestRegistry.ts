import type { Runner } from "miroir-core";

import runnerCreateEntity from "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/82f81a25-2366-4abf-8a97-83ca5e9a9c46.json" with { type: "json" };
import runnerDropEntity from "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/44313751-b0e5-4132-bb12-a544806e759b.json" with { type: "json" };
import runnerFreezeApplicationVersion from "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/20d51c4c-52e5-4077-baf3-5e87bd75e496.json" with { type: "json" };

/** Runners keyed by Runner `uuid` (leaf `runnerRef`) for Miroir-app entity runner MiroirTests. */
export const RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY: Record<string, Runner> = {
  [runnerCreateEntity.uuid]: runnerCreateEntity as unknown as Runner,
  [runnerDropEntity.uuid]: runnerDropEntity as unknown as Runner,
  [runnerFreezeApplicationVersion.uuid]: runnerFreezeApplicationVersion as unknown as Runner,
};
