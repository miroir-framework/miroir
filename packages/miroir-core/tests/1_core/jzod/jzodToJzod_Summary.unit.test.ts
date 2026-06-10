import { describe, expect, it } from "vitest";

import type {
  JzodElement,
  MlSchema,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { jzodToJzod_Summary } from "../../../src/1_core/jzod/JzodToJzod_Summary";
import { miroirTest_jzodToJzod_Summary } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

const dummyMlSchema: MlSchema = {
  uuid: "00000000-0000-0000-0000-000000000000",
  parentUuid: "00000000-0000-0000-0000-000000000000",
  name: "dummy",
};

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodToJzod_Summary as DeployedMiroirTestExport,
  "jzodToJzod_Summary.unit.test",
);

/** Comparative assertion — not expressible as a single functionCallTest expectedValue. */
const RUN_TEST = process.env.RUN_TEST;
if (!RUN_TEST || RUN_TEST === "jzodToJzod_Summary.unit.test") {
  describe("jzodToJzod_Summary (vitest-only)", () => {
    it("default depth is 1 (same as explicit depth=1)", () => {
      const input: JzodElement = {
        type: "object",
        definition: {
          child: {
            type: "object",
            definition: { x: { type: "string" } },
          },
        },
      };
      expect(jzodToJzod_Summary(input, dummyMlSchema)).toEqual(
        jzodToJzod_Summary(input, dummyMlSchema, 1),
      );
    });
  });
}
