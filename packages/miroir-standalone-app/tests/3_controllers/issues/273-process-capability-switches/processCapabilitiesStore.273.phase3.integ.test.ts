/**
 * #273 Slice 3 — handleAction refuses illegal store create/delete/reset and create types.
 *
 * Run:
 * ```bash
 * RUN_TEST=processCapabilitiesStore.273.phase3 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem processCapabilitiesStore.273.phase3
 * ```
 */
import { join } from "node:path";
import process from "process";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  DomainAction,
  DomainControllerInterface,
  ProcessCapabilities,
  StoreManagementAction,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { setupMiroirTest } from "../../../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import { cleanLevel, packageName } from "../../constants.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesStore.273.phase3";

const STORE_ENDPOINT = "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const;
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";

const sqlSection = {
  emulatedServerType: "sql" as const,
  connectionString: "postgres://x",
  schema: "x",
};

const sqlConfiguration: StoreUnitConfiguration = {
  admin: sqlSection,
  model: sqlSection,
  data: sqlSection,
};

const bundledSection = {
  emulatedServerType: "bundled" as const,
  deploymentUuid: "00000000-0000-4000-8000-000000000001",
};

const bundledConfiguration: StoreUnitConfiguration = {
  admin: bundledSection,
  model: bundledSection,
  data: bundledSection,
};

const noStoreAdministrationSnapshot: ProcessCapabilities = {
  ai: false,
  mcp: false,
  cursor: false,
  designerTools: true,
  availableStoreTypes: ["indexedDb"],
  creatableStoreTypes: ["indexedDb"],
  storeAdministration: false,
};

const indexedDbOnlyCreateSnapshot: ProcessCapabilities = {
  ...noStoreAdministrationSnapshot,
  storeAdministration: true,
};

const env = process.env;
const fileName = "processCapabilitiesStore.273.phase3.integ.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
const miroirConfig = miroirConfigParam;
miroirConfig.client.filesystemDeploymentRootDirectory = join(resolveRepoRoot(), "packages");
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

let domainControllerForServer: DomainControllerInterface;

function createStoreAction(configuration: StoreUnitConfiguration): StoreManagementAction {
  return {
    actionType: "storeManagementAction_createStore",
    endpoint: STORE_ENDPOINT,
    payload: {
      application: ADMIN_APPLICATION_UUID,
      configuration,
    },
  };
}

function deleteStoreAction(): StoreManagementAction {
  return {
    actionType: "storeManagementAction_deleteStore",
    endpoint: STORE_ENDPOINT,
    payload: {
      application: ADMIN_APPLICATION_UUID,
      configuration: sqlConfiguration,
    },
  };
}

function resetStoreAction(): StoreManagementAction {
  return {
    actionType: "storeManagementAction_resetAndInitApplicationDeployment",
    endpoint: STORE_ENDPOINT,
    payload: {
      application: ADMIN_APPLICATION_UUID,
      deployments: [],
    },
  };
}

function openStoreAction(): StoreManagementAction {
  return {
    actionType: "storeManagementAction_openStore",
    endpoint: STORE_ENDPOINT,
    payload: {
      application: ADMIN_APPLICATION_UUID,
      configuration: {},
    },
  };
}

function closeStoreAction(): StoreManagementAction {
  return {
    actionType: "storeManagementAction_closeStore",
    endpoint: STORE_ENDPOINT,
    payload: {
      application: ADMIN_APPLICATION_UUID,
    },
  };
}

function expectFeatureUnavailable(result: unknown, capability: string) {
  expect(result).toBeInstanceOf(Action2Error);
  expect(result).toMatchObject({
    status: "error",
    errorType: "FeatureUnavailable",
    errorContext: { capability },
  });
}

if (runThis) {
  beforeAll(async () => {
    log.info(fileName, "beforeAll");
    const wired = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService);
    if (!wired.domainControllerForServer) {
      throw new Error(
        "processCapabilitiesStore.273.phase3 requires domainControllerForServer (emulatedServer local DC).",
      );
    }
    domainControllerForServer = wired.domainControllerForServer;
    log.info(fileName, "beforeAll DONE");
  }, globalTimeOut);

  describe("processCapabilitiesStore.273.phase3 — store-management refuse", () => {
    it("refuses createStore / deleteStore / reset when storeAdministration is false", async () => {
      domainControllerForServer.setProcessCapabilities(noStoreAdministrationSnapshot);

      expectFeatureUnavailable(
        await domainControllerForServer.handleAction(
          createStoreAction(sqlConfiguration) as DomainAction,
          defaultSelfApplicationDeploymentMap,
        ),
        "storeAdministration",
      );
      expectFeatureUnavailable(
        await domainControllerForServer.handleAction(
          deleteStoreAction() as DomainAction,
          defaultSelfApplicationDeploymentMap,
        ),
        "storeAdministration",
      );
      expectFeatureUnavailable(
        await domainControllerForServer.handleAction(
          resetStoreAction() as DomainAction,
          defaultSelfApplicationDeploymentMap,
        ),
        "storeAdministration",
      );
    });

    it("does not FeatureUnavailable openStore / closeStore when storeAdministration is false", async () => {
      domainControllerForServer.setProcessCapabilities(noStoreAdministrationSnapshot);

      const openResult = await domainControllerForServer.handleAction(
        openStoreAction() as DomainAction,
        defaultSelfApplicationDeploymentMap,
      );
      expect(
        openResult instanceof Action2Error && openResult.errorType === "FeatureUnavailable",
      ).toBe(false);

      const closeResult = await domainControllerForServer.handleAction(
        closeStoreAction() as DomainAction,
        defaultSelfApplicationDeploymentMap,
      );
      expect(
        closeResult instanceof Action2Error && closeResult.errorType === "FeatureUnavailable",
      ).toBe(false);
    });

    it("refuses createStore sql when creatableStoreTypes is only indexedDb", async () => {
      domainControllerForServer.setProcessCapabilities(indexedDbOnlyCreateSnapshot);

      expectFeatureUnavailable(
        await domainControllerForServer.handleAction(
          createStoreAction(sqlConfiguration) as DomainAction,
          defaultSelfApplicationDeploymentMap,
        ),
        "availableStoreTypes",
      );
    });

    it("refuses createStore bundled even when storeAdministration is true", async () => {
      domainControllerForServer.setProcessCapabilities({
        ...indexedDbOnlyCreateSnapshot,
        creatableStoreTypes: ["indexedDb", "bundled"],
      });

      expectFeatureUnavailable(
        await domainControllerForServer.handleAction(
          createStoreAction(bundledConfiguration) as DomainAction,
          defaultSelfApplicationDeploymentMap,
        ),
        "availableStoreTypes",
      );
    });
  });
}
