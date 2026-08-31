/**
 * Resolve playfield model + instances from a MiroirTestSuite (issue #252).
 */
import type { ApplicationEntitiesAndInstances } from "../1_core/Deployment.js";
import type {
  MetaModelPartial,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite } from "./runnerTestSuiteResolve.js";

export type SuitePlayfieldSeed = {
  testbedModel: MetaModelPartial;
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
};

export type TestConfigurationPlayfield = {
  uuid: string;
  testbedModel: MetaModelPartial;
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
};

type MiroirTestSuiteWithPlayfield = MiroirTestSuite & {
  testConfiguration?: string;
  testbedModel?: MetaModelPartial;
  testbedEntitiesAndInstances?: ApplicationEntitiesAndInstances;
};

/**
 * skipReset wins (D11). Uuid XOR inline (D3). Neither → null (transitional fallback).
 */
export function resolveSuitePlayfieldSeed(
  suite: MiroirTestSuite,
  getTestConfiguration?: (uuid: string) => TestConfigurationPlayfield | undefined,
): SuitePlayfieldSeed | null {
  if (resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(suite)) {
    return null;
  }

  const withPlayfield = suite as MiroirTestSuiteWithPlayfield;
  const configUuid = withPlayfield.testConfiguration;
  const hasInline =
    withPlayfield.testbedModel !== undefined ||
    withPlayfield.testbedEntitiesAndInstances !== undefined;

  if (configUuid !== undefined && hasInline) {
    throw new Error(
      `MiroirTestSuite "${suite.miroirTestLabel}" has both testConfiguration and inline testbed fields`,
    );
  }

  if (configUuid !== undefined) {
    if (getTestConfiguration === undefined) {
      throw new Error(
        `MiroirTestSuite "${suite.miroirTestLabel}" references testConfiguration ${configUuid} but no loader was provided`,
      );
    }
    const loaded = getTestConfiguration(configUuid);
    if (loaded === undefined) {
      throw new Error(
        `MiroirTestSuite "${suite.miroirTestLabel}" references unknown testConfiguration ${configUuid}`,
      );
    }
    return {
      testbedModel: loaded.testbedModel,
      testbedEntitiesAndInstances: loaded.testbedEntitiesAndInstances,
    };
  }

  if (
    withPlayfield.testbedModel !== undefined &&
    withPlayfield.testbedEntitiesAndInstances !== undefined
  ) {
    return {
      testbedModel: withPlayfield.testbedModel,
      testbedEntitiesAndInstances:
        withPlayfield.testbedEntitiesAndInstances as ApplicationEntitiesAndInstances,
    };
  }

  if (hasInline) {
    throw new Error(
      `MiroirTestSuite "${suite.miroirTestLabel}" inline testbed requires both testbedModel and testbedEntitiesAndInstances`,
    );
  }

  return null;
}
