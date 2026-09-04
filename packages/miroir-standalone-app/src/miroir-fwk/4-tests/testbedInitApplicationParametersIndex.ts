import type {
  InitApplicationParameters,
  TestbedInitApplicationParametersRef,
} from "miroir-core";

import { appForTestTestbedInitParams } from "./uiIntegrationAppForTestPlayfieldSeed.js";
import { libraryTestbedInitParams } from "./uiIntegrationPlayfieldSeeds.js";

/** Resolve suite JSON init ref literals to runtime InitApplicationParameters (#258). */
export function getTestbedInitApplicationParametersFromRef(
  ref: TestbedInitApplicationParametersRef,
): InitApplicationParameters {
  switch (ref) {
    case "libraryTestbedInitParams":
      return libraryTestbedInitParams;
    case "appForTestTestbedInitParams":
      return appForTestTestbedInitParams;
    default: {
      const _exhaustive: never = ref;
      throw new Error(`Unknown testbedInitApplicationParameters ref: ${_exhaustive}`);
    }
  }
}
