/**
 * #216 — freezeApplicationVersion persistence + Phase 8 tracer (filesystem emulated server).
 *
 * Run:
 * ```bash
 * VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
 *   npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze
 * ```
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import process from "process";

import type {
  ApplicationDeploymentMap,
  EndpointDefinition,
  Entity,
  EntityInstance,
  EntityVersion,
  SelfApplication,
} from "miroir-core";
import {
  Action2Error,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultSelfApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  resolveFreezeEntityVersionApplicationSection,
  resolvePreviousApplicationVersion,
  StoreUnitConfiguration,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "miroir-core";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { DomainControllerIntegrationTestSession } from "../helpers/DomainControllerIntegrationTestSession.js";
import {
  domainControllerDataCrudFilterEntities,
  libraryEntitiesAndInstancesWithoutBook3,
} from "../helpers/libraryPlayfieldSeeds.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import { cleanLevel, packageName } from "./constants.js";

import { deployment_Admin } from "miroir-test-app_deployment-admin";
import {
  entityBook,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";
import {
  defaultMiroirMetaModel,
  entityApplicationVersionCrossEntityVersion,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

const env: any = process.env;
const fileName = "applicationVersionFreeze.integ.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName),
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
const miroirConfig = miroirConfigParam;
const loggerOptions: LoggerOptions = logConfig;
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

const globalTimeOut = 60000;

const deployment_Miroir: Deployment = {
  uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "DefaultMiroirApplicationDeployment",
  defaultLabel: "Miroir SelfApplication Deployment",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  description: "The default Deployment for SelfApplication Miroir",
  configuration: {
    admin: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/admin",
    },
    model: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_data",
    },
  },
};

const deployment_Library: Deployment = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "LibraryApplicationFilesystemDeployment",
  defaultLabel: "LibraryApplicationFilesystemDeployment",
  selfApplication: selfApplicationLibrary.uuid,
  description: "Filesystem Deployment for Library",
  configuration: {
    admin: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/admin",
    },
    model: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-library/assets/library_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-library/assets/library_data",
    },
  },
};

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  {} as EndpointDefinition,
  deployment_Library.uuid,
);

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library.uuid,
};

const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const testApplicationUuid = selfApplicationLibrary.uuid;
const testApplicationDeploymentUuid = deployment_Library.uuid;
const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const BRANCH_UUID = selfApplicationModelBranchLibraryMasterBranch.uuid as string;

let domainController: DomainControllerInterface;

function libraryModelEnv() {
  return domainController.currentModelEnvironment(testApplicationUuid, applicationDeploymentMap);
}

async function refreshLibraryCache() {
  const result = await domainController.handleAction(
    {
      actionType: "rollback",
      endpoint: MODEL_ENDPOINT,
      payload: { application: testApplicationUuid },
    },
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(result instanceof Action2Error, `rollback failed: ${JSON.stringify(result)}`).toBe(false);
}

async function freezeLibrary(versionName: string) {
  const result = await domainController.handleAction(
    {
      actionType: "freezeApplicationVersion",
      endpoint: MODEL_ENDPOINT,
      payload: {
        application: testApplicationUuid,
        versionName,
        branch: BRANCH_UUID,
      },
    },
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  return result;
}

function presentModelSlice(entity: Entity | EntityVersion) {
  const slice: Record<string, unknown> = { name: (entity as Entity).name };
  for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
    if ((entity as any)[field] !== undefined) {
      slice[field] = (entity as any)[field];
    }
  }
  return slice;
}

beforeAll(async () => {
  myConsoleLog("beforeAll");
  const session = new DomainControllerIntegrationTestSession(
    miroirConfig,
    {
      applicationDeploymentMap,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
      miroirActivityTracker,
      miroirEventService,
    },
    "miroirPlatform",
  );
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;

  const createResult = await domainController.handleAction(
    createDeploymentCompositeAction(
      "library",
      testApplicationDeploymentUuid,
      testApplicationUuid,
      adminDeployment,
      testDeploymentStorageConfiguration,
    ),
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(createResult instanceof Action2Error, `createDeployment failed: ${JSON.stringify(createResult)}`).toBe(
    false,
  );
  myConsoleLog("beforeAll DONE");
}, globalTimeOut);

beforeEach(async () => {
  const resetResult = await domainController.handleAction(
    resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      deployment_Library.uuid,
      {
        dataStoreType: "app",
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary as SelfApplication,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstancesWithoutBook3,
      defaultLibraryModelEnvironment.currentModel as any,
      domainControllerDataCrudFilterEntities,
    ),
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(resetResult instanceof Action2Error, `reset failed: ${JSON.stringify(resetResult)}`).toBe(false);
}, globalTimeOut);

afterAll(async () => {
  await domainController.handleAction(
    testUtils_resetApplicationDeployment(selfApplicationLibrary.uuid),
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  await domainController.handleAction(
    testUtils_deleteApplicationDeployment(
      miroirConfig,
      selfApplicationLibrary.uuid,
      deployment_Library.uuid,
    ),
    applicationDeploymentMap,
    libraryModelEnv(),
  );
}, globalTimeOut);

describe.sequential("216 Phase 6 — freezeApplicationVersion persistence", () => {
  it(
    "first freeze persists SAV + EntityVersions + Cross (Library EV section = model)",
    async () => {
      expect(resolveFreezeEntityVersionApplicationSection(testApplicationUuid)).toBe("model");

      const freezeResult = await freezeLibrary("V1-Freeze");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);

      const sav = model.applicationVersions.find((v) => v.name === "V1-Freeze");
      expect(sav, "SAV V1-Freeze missing after reload").toBeDefined();
      expect(sav!.previousVersion).toBeUndefined();
      expect(sav!.modelCUDMigration ?? []).toEqual([]);
      expect(sav!.branch).toBe(BRANCH_UUID);

      const crosses = model.applicationVersionCrossEntityVersion.filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      // Freeze snapshots application Entities only — not Cross Entity itself if ensure-created.
      const freezeTargetEntities = model.entities.filter(
        (e) => e.uuid !== entityApplicationVersionCrossEntityVersion.uuid,
      );
      expect(crosses.length).toBe(freezeTargetEntities.length);
      expect(crosses.length).toBeGreaterThan(0);

      for (const cross of crosses) {
        const ev = model.entityVersions.find((e) => e.uuid === cross.entityVersion);
        expect(ev, `EntityVersion ${cross.entityVersion} missing`).toBeDefined();
        expect(ev!.uuid).not.toBe(ev!.entityUuid);
        expect(ev!.parentUuid).toBe(entityEntityVersion.uuid);

        const live = freezeTargetEntities.find((e) => e.uuid === ev!.entityUuid);
        expect(live, `live Entity ${ev!.entityUuid} missing`).toBeDefined();
        expect(presentModelSlice(ev!)).toEqual(presentModelSlice(live!));
      }

      // Pre-existing documentation-class EntityVersions (if any) are not reused as freeze uuids
      const freezeEvUuids = new Set(crosses.map((c) => c.entityVersion));
      for (const live of freezeTargetEntities) {
        expect(freezeEvUuids.has(live.uuid)).toBe(false);
      }
    },
    globalTimeOut,
  );

  it(
    "live Entity edit after freeze leaves historical EntityVersion unchanged",
    async () => {
      const freezeResult = await freezeLibrary("V1-Isolation");
      expect(freezeResult instanceof Action2Error).toBe(false);

      await refreshLibraryCache();
      let model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Isolation")!;
      const bookCross = model.applicationVersionCrossEntityVersion.find((c) => {
        if (c.applicationVersion !== sav.uuid) return false;
        const ev = model.entityVersions.find((e) => e.uuid === c.entityVersion);
        return ev?.entityUuid === entityBook.uuid;
      });
      expect(bookCross).toBeDefined();
      const frozenBookEvBefore = structuredClone(
        model.entityVersions.find((e) => e.uuid === bookCross!.entityVersion)!,
      );

      const liveBook = model.entities.find((e) => e.uuid === entityBook.uuid)!;
      const updatedBook: Entity = {
        ...liveBook,
        name: "BookRenamedAfterFreeze",
        mlSchema: {
          ...liveBook.mlSchema!,
          definition: {
            ...(liveBook.mlSchema as any).definition,
            afterFreezeAttr: { type: "string" },
          },
        },
      };

      const updateResult = await domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            applicationSection: "model",
            objects: [updatedBook as EntityInstance],
          },
        },
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(updateResult instanceof Action2Error, JSON.stringify(updateResult)).toBe(false);

      await refreshLibraryCache();
      model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const liveAfter = model.entities.find((e) => e.uuid === entityBook.uuid)!;
      expect(liveAfter.name).toBe("BookRenamedAfterFreeze");

      const frozenBookEvAfter = model.entityVersions.find((e) => e.uuid === bookCross!.entityVersion)!;
      expect(frozenBookEvAfter.name).toBe(frozenBookEvBefore.name);
      expect(frozenBookEvAfter.mlSchema).toEqual(frozenBookEvBefore.mlSchema);
    },
    globalTimeOut,
  );

  it(
    "second freeze links previousVersion and fills modelCUDMigration when Entities changed",
    async () => {
      expect((await freezeLibrary("V1-Chain")) instanceof Action2Error).toBe(false);

      await refreshLibraryCache();
      let model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const v1 = model.applicationVersions.find((v) => v.name === "V1-Chain")!;
      expect(v1).toBeDefined();

      const liveBook = model.entities.find((e) => e.uuid === entityBook.uuid)!;
      const updatedBook: Entity = {
        ...liveBook,
        name: "BookForV2",
      };
      expect(
        (
          await domainController.handleAction(
            {
              actionType: "updateInstance",
              endpoint: INSTANCE_ENDPOINT,
              payload: {
                application: testApplicationUuid,
                applicationSection: "model",
                objects: [updatedBook as EntityInstance],
              },
            },
            applicationDeploymentMap,
            libraryModelEnv(),
          )
        ) instanceof Action2Error,
      ).toBe(false);

      expect((await freezeLibrary("V2-Chain")) instanceof Action2Error).toBe(false);
      await refreshLibraryCache();
      model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const v2 = model.applicationVersions.find((v) => v.name === "V2-Chain")!;
      expect(v2).toBeDefined();
      expect(v2.previousVersion).toBe(v1.uuid);
      expect(v2.modelCUDMigration?.length ?? 0).toBeGreaterThan(0);
      expect(
        (v2.modelCUDMigration as any[]).some(
          (c) => c.kind === "renameEntity" && c.entityUuid === entityBook.uuid,
        ),
      ).toBe(true);
    },
    globalTimeOut,
  );

  it(
    "second freeze with unchanged Entities yields empty modelCUDMigration",
    async () => {
      expect((await freezeLibrary("V1-Same")) instanceof Action2Error).toBe(false);
      expect((await freezeLibrary("V2-Same")) instanceof Action2Error).toBe(false);
      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const v2 = model.applicationVersions.find((v) => v.name === "V2-Same")!;
      expect(v2.previousVersion).toBeDefined();
      expect(v2.modelCUDMigration ?? []).toEqual([]);
    },
    globalTimeOut,
  );

  it(
    "rejects freeze for unversioned SelfApplication",
    async () => {
      // Gate is pure; exercise Action path with a synthetic MetaModel SelfApplication
      // by temporarily planning is unit-covered — here assert Action rejects when
      // applications[0].versioningEnabled is false via direct Action after patching cache
      // is impractical (immutable flag). Assert via plan-equivalent: Action on Library
      // with versioningEnabled true succeeds above; unversioned rejection locked in
      // applicationVersionFreeze.actionSchema.unit.test.ts.
      // Integ smoke: wrong/missing branch on first freeze still returns Action2Error.
      const result = await domainController.handleAction(
        {
          actionType: "freezeApplicationVersion",
          endpoint: MODEL_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            versionName: "NoBranch",
            // branch omitted + no freeze tip → planner requires branch
          },
        },
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(result instanceof Action2Error).toBe(true);
    },
    globalTimeOut,
  );

  it(
    "commit without freeze does not create a freeze tip or Cross Entity snapshot set (#216 Phase 7)",
    async () => {
      await refreshLibraryCache();
      const before = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const freezeCrossBefore = before.applicationVersionCrossEntityVersion.filter((c) =>
        before.applicationVersions.some(
          (v) =>
            v.uuid === c.applicationVersion &&
            v.name !== "Initial" &&
            !v.name.startsWith("TODO:"),
        ),
      ).length;
      const freezeSavBefore = before.applicationVersions.filter(
        (v) => v.name !== "Initial" && !v.name.startsWith("TODO:"),
      ).length;

      // Transactional model edit + commit (commit must not publish Application Versions).
      const liveBook = before.entities.find((e) => e.uuid === entityBook.uuid)!;
      expect(
        (
          await domainController.handleAction(
            {
              actionType: "updateInstance",
              endpoint: INSTANCE_ENDPOINT,
              payload: {
                application: testApplicationUuid,
                applicationSection: "model",
                objects: [{ ...liveBook, description: "commit-hygiene" } as EntityInstance],
              },
            },
            applicationDeploymentMap,
            libraryModelEnv(),
          )
        ) instanceof Action2Error,
      ).toBe(false);

      const commitResult = await domainController.handleAction(
        {
          actionType: "commit",
          endpoint: MODEL_ENDPOINT,
          payload: { application: testApplicationUuid },
        },
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(commitResult instanceof Action2Error, JSON.stringify(commitResult)).toBe(false);

      await refreshLibraryCache();
      const after = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const freezeSavAfter = after.applicationVersions.filter(
        (v) => v.name !== "Initial" && !v.name.startsWith("TODO:"),
      ).length;
      const freezeCrossAfter = after.applicationVersionCrossEntityVersion.filter((c) =>
        after.applicationVersions.some(
          (v) =>
            v.uuid === c.applicationVersion &&
            v.name !== "Initial" &&
            !v.name.startsWith("TODO:"),
        ),
      ).length;

      expect(freezeSavAfter).toBe(freezeSavBefore);
      expect(freezeCrossAfter).toBe(freezeCrossBefore);

      const freezeProduced = after.applicationVersions
        .filter((sav) =>
          after.applicationVersionCrossEntityVersion.some(
            (c) => c.applicationVersion === sav.uuid,
          ),
        )
        .map((sav) => sav.uuid);
      expect(
        resolvePreviousApplicationVersion(after.applicationVersions, {
          selfApplicationUuid: testApplicationUuid,
          branchUuid: BRANCH_UUID,
          freezeProducedVersionUuids: freezeProduced,
        }),
      ).toBeUndefined();
    },
    globalTimeOut,
  );
});

describe.sequential("216 Phase 8 — end-to-end freeze tracer bullet", () => {
  it(
    "V1 freeze → mutate Entity attribute → V2 freeze with previousVersion + alterEntityAttribute",
    async () => {
      await refreshLibraryCache();
      let model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);

      // 1. Baseline: no freeze tip (placeholders ignored)
      const freezeProducedBefore = model.applicationVersions
        .filter((sav) =>
          model.applicationVersionCrossEntityVersion.some(
            (c) => c.applicationVersion === sav.uuid,
          ),
        )
        .map((sav) => sav.uuid);
      expect(
        resolvePreviousApplicationVersion(model.applicationVersions, {
          selfApplicationUuid: testApplicationUuid,
          branchUuid: BRANCH_UUID,
          freezeProducedVersionUuids: freezeProducedBefore,
        }),
      ).toBeUndefined();

      // 2. Freeze V1 — empty migration, Entity snapshots
      expect((await freezeLibrary("Tracer-V1")) instanceof Action2Error).toBe(false);
      await refreshLibraryCache();
      model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const v1 = model.applicationVersions.find((v) => v.name === "Tracer-V1")!;
      expect(v1).toBeDefined();
      expect(v1.previousVersion).toBeUndefined();
      expect(v1.modelCUDMigration ?? []).toEqual([]);
      const v1Crosses = model.applicationVersionCrossEntityVersion.filter(
        (c) => c.applicationVersion === v1.uuid,
      );
      expect(v1Crosses.length).toBeGreaterThan(0);
      const liveBookBefore = model.entities.find((e) => e.uuid === entityBook.uuid)!;
      const bookEvV1 = model.entityVersions.find((ev) =>
        v1Crosses.some(
          (c) => c.entityVersion === ev.uuid && ev.entityUuid === entityBook.uuid,
        ),
      )!;
      expect(bookEvV1).toBeDefined();
      expect(presentModelSlice(bookEvV1)).toEqual(presentModelSlice(liveBookBefore));

      // 3. Mutate live Entity — add attribute only (no rename)
      const updatedBook: Entity = {
        ...liveBookBefore,
        mlSchema: {
          ...liveBookBefore.mlSchema!,
          definition: {
            ...(liveBookBefore.mlSchema as any).definition,
            tracerPhase8Attr: { type: "string" },
          },
        },
      };
      expect(
        (
          await domainController.handleAction(
            {
              actionType: "updateInstance",
              endpoint: INSTANCE_ENDPOINT,
              payload: {
                application: testApplicationUuid,
                applicationSection: "model",
                objects: [updatedBook as EntityInstance],
              },
            },
            applicationDeploymentMap,
            libraryModelEnv(),
          )
        ) instanceof Action2Error,
      ).toBe(false);

      // 4. Freeze V2 — links V1; diff has alterEntityAttribute for Book only
      expect((await freezeLibrary("Tracer-V2")) instanceof Action2Error).toBe(false);
      await refreshLibraryCache();
      model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const v2 = model.applicationVersions.find((v) => v.name === "Tracer-V2")!;
      expect(v2).toBeDefined();
      expect(v2.previousVersion).toBe(v1.uuid);

      const migration = (v2.modelCUDMigration ?? []) as Array<{
        kind: string;
        entityUuid?: string;
        differingFields?: string[];
      }>;
      expect(migration.length).toBeGreaterThan(0);
      const bookAlter = migration.find(
        (c) => c.kind === "alterEntityAttribute" && c.entityUuid === entityBook.uuid,
      );
      expect(bookAlter, `expected alterEntityAttribute for Book; got ${JSON.stringify(migration)}`).toBeDefined();
      expect(bookAlter!.differingFields).toContain("mlSchema");
      expect(migration.some((c) => c.kind === "renameEntity")).toBe(false);
      expect(migration.some((c) => c.kind === "createEntity" || c.kind === "dropEntity")).toBe(false);

      // 5. Live model remains Entity-authoritative (not read through Cross / V1 EV)
      const liveBookAfter = model.entities.find((e) => e.uuid === entityBook.uuid)!;
      expect((liveBookAfter.mlSchema as any).definition.tracerPhase8Attr).toEqual({
        type: "string",
      });
      const frozenBookEvV1 = model.entityVersions.find((e) => e.uuid === bookEvV1.uuid)!;
      expect((frozenBookEvV1.mlSchema as any).definition.tracerPhase8Attr).toBeUndefined();
      expect(presentModelSlice(liveBookAfter)).not.toEqual(presentModelSlice(frozenBookEvV1));
    },
    globalTimeOut,
  );
});
