/**
 * #589: MiroirTests that need an opt-in runtime feature carry a tag naming it. Where the feature is
 * off, runners report the suite as skipped, with the reason, instead of failing it.
 * Browser-safe: no Node imports (the self-test and the Miroir Tests page use it too).
 */
import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { ProcessCapabilities } from "../1_core/processCapabilities.js";
import { isEvolutionTraceEnabled } from "../2_domain/evolutionTracePolicy.js";

/** The tag of the suites that need evolution traces (`MIROIR_EVOLUTION_TRACE`). */
export const EVOLUTION_TRACE_TAG = "evolution-trace";
export const EVOLUTION_TRACE_TESTS_NEED_TRACES =
  "evolution-trace suites need evolution traces, which are off: set MIROIR_EVOLUTION_TRACE=1 to run them";

/** #696: the tag of the suites that need the `versioning` process capability (the freeze, the traces). */
export const VERSIONING_TAG = "versioning";
export const VERSIONING_TESTS_NEED_VERSIONING =
  "versioning suites need the versioning process capability, which is off: remove features.versioning: false to run them";

/**
 * Why `instance` cannot run here, or `undefined` when it can. `env` defaults to `process.env`
 * where there is one, as {@link isEvolutionTraceEnabled} reads it. Without a `capabilities` snapshot,
 * the capability requirements are taken as met.
 */
export function miroirTestUnmetRequirement(
  instance: { tags?: readonly string[] },
  env?: Record<string, string | undefined>,
  capabilities?: Pick<ProcessCapabilities, "versioning">,
): string | undefined {
  const tags: readonly string[] = instance.tags ?? [];
  if (tags.includes(VERSIONING_TAG) && capabilities && capabilities.versioning !== true) {
    return VERSIONING_TESTS_NEED_VERSIONING;
  }
  if (tags.includes(EVOLUTION_TRACE_TAG) && !isEvolutionTraceEnabled(env)) {
    return EVOLUTION_TRACE_TESTS_NEED_TRACES;
  }
  return undefined;
}

/**
 * The suite of `instance`, marked `skip` when a requirement is unmet, so that every runner walking
 * it reports its leaves as skipped.
 */
export function miroirTestSuiteForEnvironment(
  instance: MiroirTestDefinition,
  suite: MiroirTestSuite,
  env?: Record<string, string | undefined>,
  capabilities?: Pick<ProcessCapabilities, "versioning">,
): { suite: MiroirTestSuite; skipReason?: string } {
  const skipReason = miroirTestUnmetRequirement(instance, env, capabilities);
  return skipReason === undefined ? { suite } : { suite: { ...suite, skip: true }, skipReason };
}
