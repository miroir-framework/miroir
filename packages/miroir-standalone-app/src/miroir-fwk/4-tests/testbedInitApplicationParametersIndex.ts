import type {
  InitApplicationParameters,
  TestbedInitApplicationParametersRef,
} from "miroir-core";

import { appForTestTestbedInitParams } from "./uiIntegrationAppForTestPlayfieldSeed.js";
import { githubTestbedInitParams, libraryTestbedInitParams } from "./uiIntegrationPlayfieldSeeds.js";

/** Resolve suite JSON init ref literals to runtime InitApplicationParameters (#258). */
export function getTestbedInitApplicationParametersFromRef(
  ref: TestbedInitApplicationParametersRef,
): InitApplicationParameters {
  switch (ref) {
    case "libraryTestbedInitParams":
      return libraryTestbedInitParams;
    case "appForTestTestbedInitParams":
      return appForTestTestbedInitParams;
    case "githubTestbedInitParams":
      return githubTestbedInitParams;
    default: {
      const _exhaustive: never = ref;
      throw new Error(`Unknown testbedInitApplicationParameters ref: ${_exhaustive}`);
    }
  }
}
