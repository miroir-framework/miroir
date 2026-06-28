import type { Runner } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function resolveRunnerFromRegistry(
  runnerRegistry: Record<string, Runner>,
  runnerRef: string,
): Runner {
  const runner = runnerRegistry[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef: ${runnerRef}`);
  }
  return runner;
}
