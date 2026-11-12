/**
 * #708: the switch of evolution traces and its gate. Traces are read as off on an unversioned
 * application. With traces on, a commit or a direct model write is refused before anything is written
 * when the process has the `versioning` capability off, or when the deployment has no `modelVersion`
 * section. A record the server could not append is kept, reported, and sent again before the next one.
 *
 * Not reachable through MiroirTest: the tests switch the process capabilities of the client and of
 * the emulated server separately, and edit the client's cached Deployment row.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceSwitch
 * ```
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  type Action2ReturnType,
  type EntityInstance,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Admin } from "@miroir-framework/core/admin";
import { entityAuthor, selfApplicationLibrary } from "miroir-example-library";
import { entityPublisher, selfApplicationAppForTest } from "miroir-fixture-appForTest";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectFeatureUnavailable,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  setCapabilities,
  storedAppForTestRows,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const DEPLOYMENT_ENTITY = "7959d814-400c-4e80-988f-a00fe582ab98";

type StoredRecord = EntityInstance & {
  sequenceNumber: number;
  previousTrace?: string;
  kind: string;
  actions?: Array<{ actionType: string; payload: { objects?: Array<{ description?: string }> } }>;
};

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext();
  await directModelWrite(APP_FOR_TEST, { ...selfApplicationAppForTest, evolutionTraces: true } as EntityInstance);
}, 120000);

afterEach(async () => {
  setCapabilities(context, {});
  for (const application of [APP_FOR_TEST, LIBRARY_APPLICATION]) {
    await context.domainController.handleAction(
      { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application } } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, application),
    );
  }
}, 60000);

function directModelWrite(application: string, object: EntityInstance): Promise<Action2ReturnType> {
  return context.domainController.handleAction(
    {
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application, applicationSection: "model", objects: [object] },
    } as any,
    applicationDeploymentMap,
    modelEnvironment(context.domainController, application),
  );
}

async function updateInTransaction(application: string, object: EntityInstance): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "transactionalInstanceAction",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          application,
          instanceAction: {
            actionType: "updateInstance",
            endpoint: INSTANCE_ENDPOINT,
            payload: { application, applicationSection: "model", objects: [object] },
          },
        },
      } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, application),
    ),
    "transactional update",
  );
}

function commit(application: string = APP_FOR_TEST): Promise<Action2ReturnType> {
  return context.domainController.handleAction(
    { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application } } as any,
    applicationDeploymentMap,
    modelEnvironment(context.domainController, application),
  );
}

async function storedRecords(deployment: string = APP_FOR_TEST_DEPLOYMENT): Promise<StoredRecord[]> {
  const rows = (await storedRows(context, deployment, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)) as StoredRecord[];
  return rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

async function storedPublisherDescription(): Promise<string | undefined> {
  const rows = await storedAppForTestRows(context, "model", entityPublisher.parentUuid!);
  return (rows.find((row) => row.uuid === entityPublisher.uuid) as { description?: string } | undefined)?.description;
}

const ADMIN_DEPLOYMENT: string = deployment_Admin.uuid;
const mapWithAdmin = { ...applicationDeploymentMap, [adminSelfApplication.uuid]: ADMIN_DEPLOYMENT };

/** The client's cached Deployment row of appForTest, in the admin application's data. */
function cachedAppForTestDeploymentRow(): EntityInstance & { configuration: Record<string, unknown> } {
  const domainState = context.domainController.getDomainState() as Record<string, any>;
  return domainState[ADMIN_DEPLOYMENT].data[DEPLOYMENT_ENTITY][APP_FOR_TEST_DEPLOYMENT];
}

/** Writes appForTest's Deployment row, in the admin store and the client's cache. */
async function writeAppForTestDeploymentRow(row: EntityInstance): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: adminSelfApplication.uuid, applicationSection: "data", objects: [row] },
      } as any,
      mapWithAdmin,
      modelEnvironment(context.domainController, APP_FOR_TEST),
    ),
    "Deployment row",
  );
}

describe("evolutionTraceSwitch (#708)", () => {
  it("an unversioned application with evolutionTraces on gets no record", async () => {
    expectOk(
      await directModelWrite(LIBRARY_APPLICATION, { ...selfApplicationLibrary, evolutionTraces: true } as EntityInstance),
      "Library traces on, unversioned",
    );
    // a rollback loads Library into the client, with its new row
    expectOk(
      await context.domainController.handleAction(
        { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
        applicationDeploymentMap,
        modelEnvironment(context.domainController, LIBRARY_APPLICATION),
      ),
      "load Library",
    );
    await updateInTransaction(LIBRARY_APPLICATION, { ...entityAuthor, description: "#708 unversioned" } as EntityInstance);
    expectOk(await commit(LIBRARY_APPLICATION), "Library commit");
    expect(await storedRecords(LIBRARY_DEPLOYMENT)).toEqual([]);
  }, 60000);

  it("with the client's versioning capability off, a traced commit is refused and writes nothing", async () => {
    const before = await storedRecords();
    const description = await storedPublisherDescription();
    await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 refused commit" } as EntityInstance);
    setCapabilities(context, { client: { versioning: false } });
    expectFeatureUnavailable(await commit(), "versioning");
    expect(await storedPublisherDescription()).toBe(description);
    expect(await storedRecords()).toEqual(before);
  }, 60000);

  it("a commit holding changes of a traces-off and a traces-on application is refused too", async () => {
    const before = await storedRecords();
    await updateInTransaction(LIBRARY_APPLICATION, { ...entityAuthor, description: "#708 mixed" } as EntityInstance);
    await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 mixed" } as EntityInstance);
    setCapabilities(context, { client: { versioning: false } });
    expectFeatureUnavailable(await commit(LIBRARY_APPLICATION), "versioning");
    expect(await storedRecords()).toEqual(before);
  }, 60000);

  it("with the client's versioning capability off, a traced direct model write is refused", async () => {
    const description = await storedPublisherDescription();
    setCapabilities(context, { client: { versioning: false } });
    expectFeatureUnavailable(
      await directModelWrite(APP_FOR_TEST, { ...entityPublisher, description: "#708 refused write" } as EntityInstance),
      "versioning",
    );
    expect(await storedPublisherDescription()).toBe(description);
  }, 60000);

  it("with the client's versioning capability off, a traced resetModel is refused and clears nothing", async () => {
    const description = await storedPublisherDescription();
    setCapabilities(context, { client: { versioning: false } });
    expectFeatureUnavailable(
      await context.domainController.handleAction(
        { actionType: "resetModel", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "versioning",
    );
    expect(await storedPublisherDescription()).toBe(description);
  }, 60000);

  it("a traced commit on a deployment without a modelVersion section is refused and writes nothing", async () => {
    const row = cachedAppForTestDeploymentRow();
    const { modelVersion: _modelVersion, ...withoutModelVersion } = row.configuration;
    await writeAppForTestDeploymentRow({ ...row, configuration: withoutModelVersion } as EntityInstance);
    try {
      const description = await storedPublisherDescription();
      await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 no modelVersion" } as EntityInstance);
      const refused = await commit();
      expect(refused instanceof Action2Error, JSON.stringify(refused)).toBe(true);
      expect((refused as Action2Error).errorMessage).toContain("modelVersion");
      expect(await storedPublisherDescription()).toBe(description);
    } finally {
      await writeAppForTestDeploymentRow(row);
    }
  }, 60000);

  it("a record the server could not append is reported, kept, and sent before the next one", async () => {
    const before = await storedRecords();
    setCapabilities(context, { server: { versioning: false } });
    await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 kept" } as EntityInstance);
    const committed = await commit();
    expectOk(committed, "commit with a failed append");
    expect((committed as any).returnedDomainElement?.evolutionTraceAppendFailures?.map((f: any) => f.application)).toEqual([
      APP_FOR_TEST,
    ]);
    expect(await storedPublisherDescription()).toBe("#708 kept");
    expect(await storedRecords()).toEqual(before);

    setCapabilities(context, {});
    await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 after" } as EntityInstance);
    const next = await commit();
    expectOk(next, "next commit");
    expect((next as any).returnedDomainElement?.evolutionTraceAppendFailures).toBeUndefined();
    const added = (await storedRecords()).slice(before.length);
    expect(added.map((record) => record.actions?.[0]?.payload.objects?.[0]?.description)).toEqual([
      "#708 kept",
      "#708 after",
    ]);
    expect(added[1].previousTrace).toBe(added[0].uuid);
  }, 60000);

  it("a freeze sends the kept records before its version marker, and is refused while they cannot be sent", async () => {
    const before = await storedRecords();
    setCapabilities(context, { server: { versioning: false } });
    await updateInTransaction(APP_FOR_TEST, { ...entityPublisher, description: "#708 kept before freeze" } as EntityInstance);
    expectOk(await commit(), "commit with a failed append");
    const refused = await freezeAppForTest(context.domainController, "708-kept");
    expect(refused instanceof Action2Error, JSON.stringify(refused)).toBe(true);
    expect((refused as Action2Error).errorMessage).toContain("evolution trace records");

    setCapabilities(context, {});
    expectOk(await freezeAppForTest(context.domainController, "708-kept"), "freeze 708-kept");
    const added = (await storedRecords()).slice(before.length);
    expect(added.map((record) => record.kind)).toEqual(["commit", "version"]);
    expect(added[0].actions?.[0]?.payload.objects?.[0]?.description).toBe("#708 kept before freeze");
    expect(added[1].previousTrace).toBe(added[0].uuid);
  }, 60000);

  it("two writes at the same time send a kept record once", async () => {
    const before = await storedRecords();
    setCapabilities(context, { server: { versioning: false } });
    expectOk(
      await directModelWrite(APP_FOR_TEST, { ...entityPublisher, description: "#708 kept once" } as EntityInstance),
      "write with a failed append",
    );
    setCapabilities(context, {});
    const writes = await Promise.all([
      directModelWrite(APP_FOR_TEST, { ...entityPublisher, description: "#708 concurrent" } as EntityInstance),
      directModelWrite(APP_FOR_TEST, { ...entityPublisher, description: "#708 concurrent" } as EntityInstance),
    ]);
    writes.forEach((write) => expectOk(write, "concurrent write"));
    const added = (await storedRecords()).slice(before.length);
    expect(added.map((record) => record.actions?.[0]?.payload.objects?.[0]?.description)).toEqual([
      "#708 kept once",
      "#708 concurrent",
      "#708 concurrent",
    ]);
    expect(added.map((record) => record.sequenceNumber)).toEqual(
      added.map((_, index) => (before.at(-1)?.sequenceNumber ?? 0) + index + 1),
    );
  }, 60000);
});
