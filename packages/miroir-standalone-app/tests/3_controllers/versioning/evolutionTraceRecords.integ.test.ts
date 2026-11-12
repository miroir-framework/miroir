/**
 * #708: evolution trace records. An application whose `evolutionTraces` are on gets one
 * `EvolutionTraceRecord` per commit in its `modelVersion` section.
 *
 * Not reachable through MiroirTest: the tests observe the client and the emulated server
 * DomainControllers, the client's local cache during a sequence, and the `modelVersion` files.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
  resetAndinitializeDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  type DomainAction,
} from "@miroir-framework/core";
import { defaultAppForTestModel } from "miroir-fixture-appForTest";
import { appForTestTestbedInitParams } from "miroir-react-testing/src/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  applicationDeploymentMap,
  expectOk,
  openVersioningTestContext,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext();
}, 120000);

/** Whether the client's local cache holds appForTest's SelfApplication row. */
function clientCacheHoldsAppForTestRow(): boolean {
  const domainState = context.domainController.getDomainState() as Record<string, any>;
  return !!domainState?.[APP_FOR_TEST_DEPLOYMENT]?.model?.[SELF_APPLICATION_ENTITY]?.[APP_FOR_TEST];
}

describe("evolutionTraceRecords (#708)", () => {
  /**
   * Slice 0, characterization. Deployment init runs `resetModel`, `initModel`, then commits
   * `createEntity`. The trace switch is read from the SelfApplication row in the local cache, so
   * what init records depends on whether that row is there when each step runs.
   */
  it("init: where appForTest's SelfApplication row is in the client's local cache", async () => {
    const sequence = resetAndinitializeDeploymentCompositeAction(
      APP_FOR_TEST,
      APP_FOR_TEST_DEPLOYMENT,
      appForTestTestbedInitParams,
      [],
      defaultAppForTestModel,
    );
    const rowBeforeStep: Record<string, boolean> = {};
    for (const step of sequence.payload.actionSequence as DomainAction[]) {
      const label = (step as { actionLabel?: string }).actionLabel ?? step.actionType;
      rowBeforeStep[label] = clientCacheHoldsAppForTestRow();
      const result = await context.domainController.handleAction(
        step as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      );
      expectOk(result, label);
    }
    expect(rowBeforeStep).toMatchInlineSnapshot(`
      {
        "resetAndinitializeDeploymentCompositeAction_InitModel": true,
        "resetAndinitializeDeploymentCompositeAction_Rollback": true,
        "resetAndinitializeDeploymentCompositeAction_commitEntities": true,
        "resetAndinitializeDeploymentCompositeAction_commitInitModel": true,
        "resetAndinitializeDeploymentCompositeAction_createEntities": true,
        "resetAndinitializeDeploymentCompositeAction_createMetaModelInstances_model": true,
        "resetAndinitializeDeploymentCompositeAction_createMetaModelInstances_modelVersion": true,
        "resetAndinitializeDeploymentCompositeAction_resetModel": true,
      }
    `);
  }, 120000);
});
