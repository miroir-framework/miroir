/**
 * Repro for UI typecheck on domain_controller_composite_pk_crud createInstance.objects[0].
 * modelValidation skips resolveConditionalSchema (no reduxDeploymentsState); the UI does not.
 * InstanceEndpoint createInstance.objects used to tag ifThenElseMMLS → compositeActionTemplate,
 * which made plain entity instances fail with "no discriminator values found (actionType)".
 */
import { describe, expect, it } from "vitest";

import type { EntityDefinition, JzodElement, MiroirModelEnvironment } from "miroir-core";
import { defaultMiroirModelEnvironment, getInnermostTypeCheckError, jzodTypeCheck } from "miroir-core";

import { entityDefinitionMiroirTest } from "miroir-test-app_deployment-miroir";
import suite from "../assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/e2f4a306-7d8f-4b13-a4e5-1f2a3b4c5d6e.json" assert { type: "json" };

describe("composite_pk createInstance objects typecheck (UI path)", () => {
  it("validates createInstance.objects[0] when reduxDeploymentsState is present", () => {
    const schema = (entityDefinitionMiroirTest as unknown as EntityDefinition)
      .mlSchema as unknown as JzodElement;
    const modelEnv = defaultMiroirModelEnvironment as MiroirModelEnvironment;

    // Empty object is truthy enough for jzodTypeCheck to invoke resolveConditionalSchema
    // when currentDefaultValue + currentValuePath are also set (UI path).
    const reduxDeploymentsState = {} as any;

    const result = jzodTypeCheck(
      schema,
      suite,
      [],
      [],
      modelEnv,
      {},
      suite, // currentDefaultValue / root
      reduxDeploymentsState,
      undefined,
      suite, // rootObject
    );

    if (result.status === "error") {
      console.error(
        "UI-path typecheck failed:",
        JSON.stringify(getInnermostTypeCheckError(result), null, 2),
      );
    }
    expect(result.status).toBe("ok");
  });
});
