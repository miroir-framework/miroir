// @vitest-environment node
/**
 * #270 Slice 6 — orchestrator import against emulated Admin store (P18).
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsImport.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsImport.270
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  EntityInstance,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  assembleSecretImportSet,
  clearSecrets,
  clearSecretsMasterKey,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  ENTITY_MIROIR_SECRET_UUID,
  hydrateSecrets,
  importProcessSecrets,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  parseServerArgs,
  persistImportedProcessSecrets,
  resetAndInitApplicationDeployment,
  resolveSecret,
  setSecretsMasterKey,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import { cleanLevel, packageName } from "../../constants.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "secretsImport.270" ||
  RUN_TEST.startsWith("secretsImport.270") ||
  RUN_TEST === "secretsImport.270.phase6";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const EMULATED_SECRET_DIR = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/assets/admin_data/a96856df-2b38-494a-8027-82617e2d64ad",
);

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const IMPORTED_GITHUB = "imported-gh-token";
const IMPORTED_CLI = "cli-plain";
const IMPORTED_ENV = "env-plain";

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "secretsImport.270.phase6.integ.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

let domainControllerForServer: DomainControllerInterface;

function leftoverSecretJsonFiles(): string[] {
  return readdirSync(EMULATED_SECRET_DIR).filter((name) => name.endsWith(".json"));
}

async function querySecretRows(): Promise<Record<string, unknown>[]> {
  const queryResult = await domainControllerForServer.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: adminSelfApplication.uuid,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            secrets: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            },
          },
        },
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(
    queryResult instanceof Action2Error,
    `secret query failed: ${JSON.stringify(queryResult)}`,
  ).toBe(false);
  const element = (queryResult as { returnedDomainElement?: { secrets?: unknown } })
    .returnedDomainElement?.secrets;
  if (Array.isArray(element)) {
    return element as Record<string, unknown>[];
  }
  if (element && typeof element === "object") {
    return Object.values(element as Record<string, Record<string, unknown>>);
  }
  return [];
}

async function deleteAllSecretRows(): Promise<void> {
  const remaining = await querySecretRows();
  for (const row of remaining) {
    await domainControllerForServer.handleAction(
      {
        actionType: "deleteInstance",
        actionLabel: "secrets.delete",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: ADMIN_APPLICATION_UUID,
          applicationSection: "data",
          objects: [
            {
              uuid: String(row.uuid ?? ""),
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }
}

beforeAll(async () => {
  if (!shouldRun) {
    return;
  }
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "secretsImport.270.phase6 requires emulateServer: true (in-process server path).",
    );
  }

  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
    miroirDeploymentStorageConfiguration,
    openAdminAndMiroirStoresOnServer: true,
    miroirActivityTracker,
    miroirEventService,
  });
  const executionEnvironment = await session.initSession();
  if (!executionEnvironment.domainControllerForServer) {
    throw new Error("domainControllerForServer missing from executionEnvironment");
  }
  domainControllerForServer = executionEnvironment.domainControllerForServer;

  await resetAndInitApplicationDeployment(
    executionEnvironment.domainController,
    applicationDeploymentMap,
    [deployment_Miroir as Deployment],
  );
}, 60000);

beforeEach(async () => {
  if (!shouldRun || !domainControllerForServer) {
    return;
  }
  clearSecrets();
  clearSecretsMasterKey();
  setSecretsMasterKey(WRAPPING_KEY);
  await deleteAllSecretRows();
}, 60000);

afterEach(async () => {
  if (!shouldRun || !domainControllerForServer) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
});

afterAll(async () => {
  if (!shouldRun || !domainControllerForServer) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  expect(leftoverSecretJsonFiles()).toEqual([]);
});

describe.skipIf(!shouldRun).sequential(
  "secretsImport.270.phase6 — import persist then hydrate-from-store",
  () => {
    it("import + secrets.set then clearSecrets + hydrate-from-store resolves imported names", async () => {
      const launchEnv = {
        MIROIR_SECRET_fromEnv: IMPORTED_ENV,
        AI_GITHUB_TOKEN: IMPORTED_GITHUB,
        AI_PROVIDER_TYPE: "openai",
        AI_MODEL: "gpt-4o",
      };
      const parsed = parseServerArgs(["--secret", `fromCli=${IMPORTED_CLI}`], launchEnv);
      const importSet = assembleSecretImportSet(parsed.secrets, launchEnv);
      expect(importSet).toEqual({
        fromCli: IMPORTED_CLI,
        fromEnv: IMPORTED_ENV,
        aiGithubToken: IMPORTED_GITHUB,
      });

      const instances = importProcessSecrets({
        wrappingKey: WRAPPING_KEY,
        secrets: importSet,
      });
      await persistImportedProcessSecrets(
        domainControllerForServer,
        instances,
        applicationDeploymentMap,
      );

      clearSecrets();
      const rows = await querySecretRows();
      expect(rows.some((row) => row.name === "aiGithubToken")).toBe(true);
      expect(rows.some((row) => row.name === "fromCli")).toBe(true);
      expect(rows.some((row) => row.name === "fromEnv")).toBe(true);
      for (const row of rows) {
        expect(row).not.toHaveProperty("value");
        expect(String(row.ciphertext ?? "")).toMatch(/^aes-256-gcm\$/);
      }

      hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });
      expect(resolveSecret("aiGithubToken")).toEqual({
        value: IMPORTED_GITHUB,
        scope: "process",
        source: "row",
      });
      expect(resolveSecret("fromCli").value).toBe(IMPORTED_CLI);
      expect(resolveSecret("fromEnv").value).toBe(IMPORTED_ENV);
    });
  },
);
