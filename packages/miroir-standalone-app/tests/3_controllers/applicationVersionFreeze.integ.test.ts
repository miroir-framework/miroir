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
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const bookCountByPublisherQuery = JSON.parse(
  readFileSync(
    join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-library/assets/library_model/e4320b9e-ab45-4abe-85d8-359604b3c62f/6176dcdf-39a6-4805-8dc5-3c2366a31a11.json",
    ),
    "utf8",
  ),
) as EntityInstance & { uuid: string; name: string; definition: Record<string, unknown> };
const countryListReport = JSON.parse(
  readFileSync(
    join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-library/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json",
    ),
    "utf8",
  ),
) as EntityInstance & { uuid: string; name: string; defaultLabel: string; definition: Record<string, unknown> };
const libraryMenu = JSON.parse(
  readFileSync(
    join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
    ),
    "utf8",
  ),
) as EntityInstance & { uuid: string; name: string; defaultLabel: string; definition: Record<string, unknown> };
const libraryBooksEndpoint = JSON.parse(
  readFileSync(
    join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-library/assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9884c1a4-5122-488a-85db-a99fbc02e678.json",
    ),
    "utf8",
  ),
) as EndpointDefinition & { uuid: string; name: string; version: string; application: string; definition: Record<string, unknown> };
const libraryReturnDocumentRunner = JSON.parse(
  readFileSync(
    join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-library/assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json",
    ),
    "utf8",
  ),
) as EntityInstance & {
  uuid: string;
  name: string;
  application: string;
  defaultLabel: string;
  description?: string;
  definition: Record<string, unknown>;
};
import {
  defaultMiroirMetaModel,
  entityApplicationVersionCrossEntityVersion,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  QUERY_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
  REPORT_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
  MENU_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
  ENDPOINT_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
  THEME_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
  resolveFreezeQueryVersionApplicationSection,
  resolveFreezeReportVersionApplicationSection,
  resolveFreezeMenuVersionApplicationSection,
  resolveFreezeEndpointVersionApplicationSection,
  resolveFreezeRunnerVersionApplicationSection,
  resolveFreezeThemeVersionApplicationSection,
  resolveFreezeTransformerDefinitionVersionApplicationSection,
} from "miroir-core";

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

function queryVersionSlice(queryVersion: {
  name: string;
  queryUuid: string;
  definition: unknown;
}) {
  return {
    name: queryVersion.name,
    queryUuid: queryVersion.queryUuid,
    definition: queryVersion.definition,
  };
}

async function seedLibraryStoredQuery() {
  const result = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        objects: [bookCountByPublisherQuery as EntityInstance],
      },
    },
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
}

async function seedLibraryReport() {
  const result = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        objects: [countryListReport as EntityInstance],
      },
    },
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
}

function reportVersionSlice(reportVersion: {
  name: string;
  reportUuid: string;
  defaultLabel?: string;
  definition: unknown;
}) {
  return {
    name: reportVersion.name,
    reportUuid: reportVersion.reportUuid,
    defaultLabel: reportVersion.defaultLabel,
    definition: reportVersion.definition,
  };
}

function menuVersionSlice(menuVersion: {
  name: string;
  menuUuid: string;
  defaultLabel?: string;
  description?: string;
  definition: unknown;
}) {
  return {
    name: menuVersion.name,
    menuUuid: menuVersion.menuUuid,
    defaultLabel: menuVersion.defaultLabel,
    description: menuVersion.description,
    definition: menuVersion.definition,
  };
}

function endpointVersionSlice(endpointVersion: {
  name: string;
  endpointUuid: string;
  version: string;
  application: string;
  description?: string;
  transactionalEndpoint?: boolean;
  definition: unknown;
}) {
  return {
    name: endpointVersion.name,
    endpointUuid: endpointVersion.endpointUuid,
    version: endpointVersion.version,
    application: endpointVersion.application,
    description: endpointVersion.description,
    transactionalEndpoint: endpointVersion.transactionalEndpoint,
    definition: endpointVersion.definition,
  };
}

function runnerVersionSlice(runnerVersion: {
  name: string;
  runnerUuid: string;
  application: string;
  defaultLabel: string;
  description?: string;
  definition: unknown;
}) {
  return {
    name: runnerVersion.name,
    runnerUuid: runnerVersion.runnerUuid,
    application: runnerVersion.application,
    defaultLabel: runnerVersion.defaultLabel,
    description: runnerVersion.description,
    definition: runnerVersion.definition,
  };
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
      // Freeze snapshots application Entities only — exclude MetaModel bootstrap Entities.
      const metaBootstrapUuids = new Set(defaultMiroirMetaModel.entities.map((e) => e.uuid));
      metaBootstrapUuids.add(entityApplicationVersionCrossEntityVersion.uuid);
      const freezeTargetEntities = model.entities.filter(
        (e) => !metaBootstrapUuids.has(e.uuid),
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
    "omitted branch reuses Library master branch from existing SAV (#216 branch inference)",
    async () => {
      const result = await domainController.handleAction(
        {
          actionType: "freezeApplicationVersion",
          endpoint: MODEL_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            versionName: "NoBranch",
          },
        },
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
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

describe.sequential("227 — QueryVersion freeze persistence", () => {
  it(
    "first freeze persists QueryVersions + CrossQuery (Library model section)",
    async () => {
      expect(resolveFreezeQueryVersionApplicationSection(testApplicationUuid)).toBe("model");
      await seedLibraryStoredQuery();

      const freezeResult = await freezeLibrary("V1-Queries");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Queries");
      expect(sav, "SAV V1-Queries missing after reload").toBeDefined();

      const liveQueries = model.storedQueries.filter(
        (q) => (q as { uuid?: string }).uuid === bookCountByPublisherQuery.uuid,
      );
      expect(liveQueries.length).toBe(1);

      const crossQueries = (model.applicationVersionCrossQueryVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      expect(crossQueries.length).toBe(liveQueries.length);
      expect(crossQueries.length).toBeGreaterThan(0);

      for (const cross of crossQueries) {
        expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID);
        const qv = (model.queryVersions ?? []).find((q) => q.uuid === cross.queryVersion);
        expect(qv, `QueryVersion ${cross.queryVersion} missing`).toBeDefined();
        expect(qv!.uuid).not.toBe(qv!.queryUuid);
        expect(qv!.parentUuid).toBe(QUERY_VERSION_ENTITY_UUID);
        expect(qv!.parentName).toBe("QueryVersion");

        const live = liveQueries.find((q) => (q as { uuid?: string }).uuid === qv!.queryUuid) as {
          uuid: string;
          name: string;
          definition: unknown;
        };
        expect(live, `live Query ${qv!.queryUuid} missing`).toBeDefined();
        expect(queryVersionSlice(qv!)).toEqual({
          name: live!.name,
          queryUuid: (live as { uuid: string }).uuid,
          definition: (live as { definition: unknown }).definition,
        });
      }

      const freezeQvUuids = new Set(crossQueries.map((c) => c.queryVersion));
      for (const live of liveQueries) {
        expect(freezeQvUuids.has((live as { uuid: string }).uuid)).toBe(false);
      }
    },
    globalTimeOut,
  );

  it(
    "live Query edit after freeze leaves historical QueryVersion unchanged",
    async () => {
      await seedLibraryStoredQuery();
      expect((await freezeLibrary("V1-Query-Isolation")) instanceof Action2Error).toBe(false);

      await refreshLibraryCache();
      let model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Query-Isolation")!;
      const queryCross = (model.applicationVersionCrossQueryVersion ?? []).find((c) => {
        if (c.applicationVersion !== sav.uuid) return false;
        const qv = (model.queryVersions ?? []).find((q) => q.uuid === c.queryVersion);
        return qv?.queryUuid === bookCountByPublisherQuery.uuid;
      });
      expect(queryCross).toBeDefined();
      const frozenQueryBefore = structuredClone(
        (model.queryVersions ?? []).find((q) => q.uuid === queryCross!.queryVersion)!,
      );

      const liveQuery = model.storedQueries.find(
        (q) => (q as { uuid?: string }).uuid === bookCountByPublisherQuery.uuid,
      ) as EntityInstance & { name: string; definition: Record<string, unknown> };
      expect(liveQuery).toBeDefined();
      const updatedQuery = {
        ...liveQuery,
        name: "BookCountRenamedAfterFreeze",
        definition: {
          ...liveQuery.definition,
          afterFreezeMarker: { transformerType: "returnValue", value: true },
        },
      };

      const updateResult = await domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            applicationSection: "model",
            objects: [updatedQuery as EntityInstance],
          },
        },
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(updateResult instanceof Action2Error, JSON.stringify(updateResult)).toBe(false);

      await refreshLibraryCache();
      model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const liveAfter = model.storedQueries.find(
        (q) => (q as { uuid?: string }).uuid === bookCountByPublisherQuery.uuid,
      ) as { name: string; definition: Record<string, unknown> };
      expect(liveAfter.name).toBe("BookCountRenamedAfterFreeze");

      const frozenQueryAfter = (model.queryVersions ?? []).find(
        (q) => q.uuid === queryCross!.queryVersion,
      )!;
      expect(frozenQueryAfter.name).toBe(frozenQueryBefore.name);
      expect(frozenQueryAfter.definition).toEqual(frozenQueryBefore.definition);
    },
    globalTimeOut,
  );
});

describe.sequential("227 — ReportVersion freeze persistence", () => {
  it(
    "first freeze persists ReportVersions + CrossReport (Library model section)",
    async () => {
      expect(resolveFreezeReportVersionApplicationSection(testApplicationUuid)).toBe("model");
      await seedLibraryReport();

      const freezeResult = await freezeLibrary("V1-Reports");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Reports");
      expect(sav, "SAV V1-Reports missing after reload").toBeDefined();

      expect(
        model.reports.some((r) => (r as { uuid?: string }).uuid === countryListReport.uuid),
        "seeded CountryList report missing from present model",
      ).toBe(true);

      const crossReports = (model.applicationVersionCrossReportVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      // Library deployment ships many Reports from assets; freeze snapshots all present-model Reports.
      expect(crossReports.length).toBe(model.reports.length);
      expect(crossReports.length).toBeGreaterThan(0);

      for (const cross of crossReports) {
        expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID);
        const rv = (model.reportVersions ?? []).find((r) => r.uuid === cross.reportVersion);
        expect(rv, `ReportVersion ${cross.reportVersion} missing`).toBeDefined();
        expect(rv!.uuid).not.toBe(rv!.reportUuid);
        expect(rv!.parentUuid).toBe(REPORT_VERSION_ENTITY_UUID);
        expect(rv!.parentName).toBe("ReportVersion");

        const live = model.reports.find(
          (r) => (r as { uuid?: string }).uuid === rv!.reportUuid,
        ) as {
          uuid: string;
          name: string;
          defaultLabel: string;
          definition: unknown;
        };
        expect(live, `live Report ${rv!.reportUuid} missing`).toBeDefined();
        expect(reportVersionSlice(rv!)).toEqual({
          name: live!.name,
          reportUuid: (live as { uuid: string }).uuid,
          defaultLabel: (live as { defaultLabel: string }).defaultLabel,
          definition: (live as { definition: unknown }).definition,
        });
      }

      const countryCross = crossReports.find((c) => {
        const rv = (model.reportVersions ?? []).find((r) => r.uuid === c.reportVersion);
        return rv?.reportUuid === countryListReport.uuid;
      });
      expect(countryCross, "CountryList ReportVersion cross row missing").toBeDefined();

      const freezeRvUuids = new Set(crossReports.map((c) => c.reportVersion));
      expect(freezeRvUuids.has(countryListReport.uuid)).toBe(false);
    },
    globalTimeOut,
  );
});

describe.sequential("227 — MenuVersion freeze persistence", () => {
  it(
    "first freeze persists MenuVersions + CrossMenu (Library model section)",
    async () => {
      expect(resolveFreezeMenuVersionApplicationSection(testApplicationUuid)).toBe("model");

      const freezeResult = await freezeLibrary("V1-Menus");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Menus");
      expect(sav, "SAV V1-Menus missing after reload").toBeDefined();

      expect(
        model.menus.some((m) => (m as { uuid?: string }).uuid === libraryMenu.uuid),
        "LibraryMenu missing from present model",
      ).toBe(true);

      const crossMenus = (model.applicationVersionCrossMenuVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      expect(crossMenus.length).toBe(model.menus.length);
      expect(crossMenus.length).toBeGreaterThan(0);

      for (const cross of crossMenus) {
        expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_MENU_VERSION_UUID);
        const mv = (model.menuVersions ?? []).find((m) => m.uuid === cross.menuVersion);
        expect(mv, `MenuVersion ${cross.menuVersion} missing`).toBeDefined();
        expect(mv!.uuid).not.toBe(mv!.menuUuid);
        expect(mv!.parentUuid).toBe(MENU_VERSION_ENTITY_UUID);
        expect(mv!.parentName).toBe("MenuVersion");

        const live = model.menus.find(
          (m) => (m as { uuid?: string }).uuid === mv!.menuUuid,
        ) as {
          uuid: string;
          name: string;
          defaultLabel: string;
          description?: string;
          definition: unknown;
        };
        expect(live, `live Menu ${mv!.menuUuid} missing`).toBeDefined();
        expect(menuVersionSlice(mv!)).toEqual({
          name: live!.name,
          menuUuid: (live as { uuid: string }).uuid,
          defaultLabel: (live as { defaultLabel: string }).defaultLabel,
          description: (live as { description?: string }).description,
          definition: (live as { definition: unknown }).definition,
        });
      }

      const libraryMenuCross = crossMenus.find((c) => {
        const mv = (model.menuVersions ?? []).find((m) => m.uuid === c.menuVersion);
        return mv?.menuUuid === libraryMenu.uuid;
      });
      expect(libraryMenuCross, "LibraryMenu MenuVersion cross row missing").toBeDefined();

      const freezeMvUuids = new Set(crossMenus.map((c) => c.menuVersion));
      expect(freezeMvUuids.has(libraryMenu.uuid)).toBe(false);
    },
    globalTimeOut,
  );
});

describe.sequential("227 — EndpointVersion freeze persistence", () => {
  it(
    "first freeze persists EndpointVersions + CrossEndpoint (Library model section)",
    async () => {
      expect(resolveFreezeEndpointVersionApplicationSection(testApplicationUuid)).toBe("model");

      const freezeResult = await freezeLibrary("V1-Endpoints");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Endpoints");
      expect(sav, "SAV V1-Endpoints missing after reload").toBeDefined();

      expect(
        model.endpoints.some((e) => (e as { uuid?: string }).uuid === libraryBooksEndpoint.uuid),
        "Books endpoint missing from present model",
      ).toBe(true);

      const crossEndpoints = (model.applicationVersionCrossEndpointVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      expect(crossEndpoints.length).toBe(model.endpoints.length);
      expect(crossEndpoints.length).toBeGreaterThan(0);

      for (const cross of crossEndpoints) {
        expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID);
        const ev = (model.endpointVersions ?? []).find((e) => e.uuid === cross.endpointVersion);
        expect(ev, `EndpointVersion ${cross.endpointVersion} missing`).toBeDefined();
        expect(ev!.uuid).not.toBe(ev!.endpointUuid);
        expect(ev!.parentUuid).toBe(ENDPOINT_VERSION_ENTITY_UUID);
        expect(ev!.parentName).toBe("EndpointVersion");

        const live = model.endpoints.find(
          (e) => (e as { uuid?: string }).uuid === ev!.endpointUuid,
        ) as {
          uuid: string;
          name: string;
          version: string;
          application: string;
          description?: string;
          transactionalEndpoint?: boolean;
          definition: unknown;
        };
        expect(live, `live Endpoint ${ev!.endpointUuid} missing`).toBeDefined();
        expect(endpointVersionSlice(ev!)).toEqual({
          name: live!.name,
          endpointUuid: (live as { uuid: string }).uuid,
          version: (live as { version: string }).version,
          application: (live as { application: string }).application,
          description: (live as { description?: string }).description,
          transactionalEndpoint: (live as { transactionalEndpoint?: boolean }).transactionalEndpoint,
          definition: (live as { definition: unknown }).definition,
        });
      }

      const booksCross = crossEndpoints.find((c) => {
        const ev = (model.endpointVersions ?? []).find((e) => e.uuid === c.endpointVersion);
        return ev?.endpointUuid === libraryBooksEndpoint.uuid;
      });
      expect(booksCross, "Books EndpointVersion cross row missing").toBeDefined();

      const freezeEvUuids = new Set(crossEndpoints.map((c) => c.endpointVersion));
      expect(freezeEvUuids.has(libraryBooksEndpoint.uuid)).toBe(false);
    },
    globalTimeOut,
  );
});

describe.sequential("227 — RunnerVersion freeze persistence", () => {
  it(
    "first freeze persists RunnerVersions + CrossRunner (Library model section)",
    async () => {
      expect(resolveFreezeRunnerVersionApplicationSection(testApplicationUuid)).toBe("model");

      const freezeResult = await freezeLibrary("V1-Runners");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Runners");
      expect(sav, "SAV V1-Runners missing after reload").toBeDefined();

      expect(
        model.runners.some((r) => (r as { uuid?: string }).uuid === libraryReturnDocumentRunner.uuid),
        "returnDocument runner missing from present model",
      ).toBe(true);

      const crossRunners = (model.applicationVersionCrossRunnerVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      expect(crossRunners.length).toBe(model.runners.length);
      expect(crossRunners.length).toBeGreaterThan(0);

      for (const cross of crossRunners) {
        expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID);
        const rv = (model.runnerVersions ?? []).find((r) => r.uuid === cross.runnerVersion);
        expect(rv, `RunnerVersion ${cross.runnerVersion} missing`).toBeDefined();
        expect(rv!.uuid).not.toBe(rv!.runnerUuid);
        expect(rv!.parentUuid).toBe(RUNNER_VERSION_ENTITY_UUID);
        expect(rv!.parentName).toBe("RunnerVersion");

        const live = model.runners.find(
          (r) => (r as { uuid?: string }).uuid === rv!.runnerUuid,
        ) as {
          uuid: string;
          name: string;
          application: string;
          defaultLabel: string;
          description?: string;
          definition: unknown;
        };
        expect(live, `live Runner ${rv!.runnerUuid} missing`).toBeDefined();
        expect(runnerVersionSlice(rv!)).toEqual({
          name: live!.name,
          runnerUuid: (live as { uuid: string }).uuid,
          application: (live as { application: string }).application,
          defaultLabel: (live as { defaultLabel: string }).defaultLabel,
          description: (live as { description?: string }).description,
          definition: (live as { definition: unknown }).definition,
        });
      }

      const returnCross = crossRunners.find((c) => {
        const rv = (model.runnerVersions ?? []).find((r) => r.uuid === c.runnerVersion);
        return rv?.runnerUuid === libraryReturnDocumentRunner.uuid;
      });
      expect(returnCross, "returnDocument RunnerVersion cross row missing").toBeDefined();

      const freezeRvUuids = new Set(crossRunners.map((c) => c.runnerVersion));
      expect(freezeRvUuids.has(libraryReturnDocumentRunner.uuid)).toBe(false);
    },
    globalTimeOut,
  );
});

describe.sequential("227 — ThemeVersion freeze persistence", () => {
  it(
    "first freeze persists empty ThemeVersions + CrossTheme (Library has no themes)",
    async () => {
      expect(resolveFreezeThemeVersionApplicationSection(testApplicationUuid)).toBe("model");

      const freezeResult = await freezeLibrary("V1-Themes");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Themes");
      expect(sav, "SAV V1-Themes missing after reload").toBeDefined();

      expect(model.themes).toEqual([]);

      const crossThemes = (model.applicationVersionCrossThemeVersion ?? []).filter(
        (c) => c.applicationVersion === sav!.uuid,
      );
      expect(crossThemes.length).toBe(model.themes.length);
      expect(crossThemes).toEqual([]);

      const themeVersionsForSav = (model.themeVersions ?? []).filter((tv) =>
        crossThemes.some((c) => c.themeVersion === tv.uuid),
      );
      expect(themeVersionsForSav).toEqual([]);

      expect(THEME_VERSION_ENTITY_UUID).toBe("a7b8c9d0-e1f2-4012-a3b4-c5d6e7f8a9c0");
      expect(APPLICATION_VERSION_CROSS_THEME_VERSION_UUID).toBe(
        "b8c9d0e1-f2a3-4123-a4b5-c6d7e8f9a0c1",
      );
    },
    globalTimeOut,
  );
});

describe.sequential("227 — TransformerDefinitionVersion freeze persistence", () => {
  it(
    "first freeze persists empty TransformerDefinitionVersions + Cross (Library has no transformers)",
    async () => {
      expect(resolveFreezeTransformerDefinitionVersionApplicationSection(testApplicationUuid)).toBe(
        "model",
      );

      const freezeResult = await freezeLibrary("V1-Transformers");
      expect(
        freezeResult instanceof Action2Error,
        `freeze failed: ${JSON.stringify(freezeResult)}`,
      ).toBe(false);

      await refreshLibraryCache();
      const model = domainController.currentModel(testApplicationUuid, applicationDeploymentMap);
      const sav = model.applicationVersions.find((v) => v.name === "V1-Transformers");
      expect(sav, "SAV V1-Transformers missing after reload").toBeDefined();

      expect(model.transformerDefinitions ?? []).toEqual([]);

      const crossTransformers = (
        model.applicationVersionCrossTransformerDefinitionVersion ?? []
      ).filter((c) => c.applicationVersion === sav!.uuid);
      expect(crossTransformers.length).toBe((model.transformerDefinitions ?? []).length);
      expect(crossTransformers).toEqual([]);

      expect(TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID).toBe(
        "e1f2a3b4-c5d6-4012-a3b4-c5d6e7f8a9d0",
      );
      expect(APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID).toBe(
        "f2a3b4c5-d6e7-4123-a4b5-c6d7e8f9a0d1",
      );
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
