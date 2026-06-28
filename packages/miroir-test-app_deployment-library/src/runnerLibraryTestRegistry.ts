import type { Runner } from "miroir-core";

import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" assert { type: "json" };
import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" assert { type: "json" };

/** Runners keyed by leaf `runnerRef` for `miroirTest_runner_library`. */
export const RUNNER_LIBRARY_RUNNER_REGISTRY: Record<string, Runner> = {
  lendDocument: lendDocument as unknown as Runner,
  returnDocument: returnDocument as unknown as Runner,
};

export function resolveRunnerLibraryRunnerRef(runnerRef: string): Runner {
  const runner = RUNNER_LIBRARY_RUNNER_REGISTRY[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef for runner.library suite: ${runnerRef}`);
  }
  return runner;
}
