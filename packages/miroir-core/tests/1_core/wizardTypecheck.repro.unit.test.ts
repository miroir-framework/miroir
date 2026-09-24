/**
 * Repro for the ConnectExternalServiceWizard typecheck failure:
 * the Finish compositeActionSequence embeds a whole-bag getFromParameters
 * payload for connectExternalService; the template schema must accept it.
 */
import { describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  type JzodElement,
  type MiroirModelEnvironment,
} from "miroir-core";

import wizardReport from "../../../miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a.json" with { type: "json" };

describe("wizard typecheck repro", () => {
  it("ConnectExternalServiceWizard report passes jzodTypeCheck against the report schema", () => {
    const reportSchema: JzodElement = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "report",
      },
    } as any;

    const result = jzodTypeCheck(
      reportSchema,
      wizardReport,
      [],
      [],
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
      wizardReport, // currentDefaultValue
      {} as any, // reduxDeploymentsState — truthy: UI path
      undefined,
      wizardReport, // rootObject
    );
    if (result.status !== "ok") {
      console.error(
        "wizard typecheck failed:",
        JSON.stringify(getInnermostTypeCheckError(result), null, 2),
      );
    }
    expect(result.status).toBe("ok");
  });
});
