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
  defaultMiroirModelEnvironment,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  resetAndinitializeDeploymentCompositeAction,
  type DomainAction,
  type EntityInstance,
} from "@miroir-framework/core";
import { defaultAppForTestModel, entityPublisher, selfApplicationAppForTest } from "miroir-fixture-appForTest";
import { appForTestTestbedInitParams } from "miroir-react-testing/src/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  INSTANCE_ENDPOINT,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  storedAppForTestRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

type StoredRecord = EntityInstance & {
  application: string;
  sequenceNumber: number;
  previousTrace?: string;
  kind: string;
  actions?: any[];
  complete?: boolean;
  commitUuid?: string;
};

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext();
}, 120000);

/** Whether the client's local cache holds appForTest's SelfApplication row. */
function clientCacheHoldsAppForTestRow(): boolean {
  const domainState = context.domainController.getDomainState() as Record<string, any>;
  return !!domainState?.[APP_FOR_TEST_DEPLOYMENT]?.model?.[SELF_APPLICATION_ENTITY]?.[APP_FOR_TEST];
}

/** Sets appForTest's `evolutionTraces` with a direct write from the client, which updates its local cache too. */
async function setAppForTestTraces(on: boolean): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: APP_FOR_TEST,
          applicationSection: "model",
          objects: [{ ...selfApplicationAppForTest, evolutionTraces: on } as EntityInstance],
        },
      } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    ),
    `evolutionTraces ${on}`,
  );
}

/** Sends an update of an appForTest model row inside the client's transaction. */
async function updateInTransaction(object: EntityInstance): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "transactionalInstanceAction",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          application: APP_FOR_TEST,
          instanceAction: {
            actionType: "updateInstance",
            endpoint: INSTANCE_ENDPOINT,
            payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [object] },
          },
        },
      } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    ),
    "transactional update",
  );
}

async function commitAppForTest() {
  return context.domainController.handleAction(
    { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

async function storedRecords(): Promise<StoredRecord[]> {
  const rows = (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)) as StoredRecord[];
  return rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

describe("evolutionTraceRecords (#708)", () => {
  it("one commit, one record: a committed Entity-row update of appForTest, traces on", async () => {
    await setAppForTestTraces(true);
    const updatedPublisher = { ...entityPublisher, description: "#708 one commit, one record" } as EntityInstance;
    await updateInTransaction(updatedPublisher);
    expectOk(await commitAppForTest(), "commit");

    const records = await storedRecords();
    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record).toMatchObject({
      application: APP_FOR_TEST,
      kind: "commit",
      sequenceNumber: 1,
      complete: true,
    });
    expect(record.previousTrace).toBeUndefined();
    expect(typeof record.commitUuid).toBe("string");
    expect(record.actions).toEqual([
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: APP_FOR_TEST,
          applicationSection: "model",
          parentUuid: entityPublisher.parentUuid,
          objects: [updatedPublisher],
        },
      },
    ]);
  }, 60000);
});

describe("evolutionTraceRecords (#708), init", () => {
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
