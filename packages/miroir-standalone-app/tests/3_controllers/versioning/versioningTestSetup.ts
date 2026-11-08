/**
 * #696: the setup shared by the versioning capability tests. It opens `test-filesystem` with an
 * emulated server, as the Git tests do: the client DomainController forwards what a remote client
 * forwards, and the server's DomainController holds the stores. The application frozen is appForTest,
 * the only test fixture that is `versioned-internal` and has a `modelVersion` section.
 *
 * Not reachable through MiroirTest: the tests give the client and the server their own process
 * capabilities, and count how often the versioning package is loaded.
 */
import { expect } from "vitest";

import {
  Action2Error,
  ConfigurationService,
  getClientEnvironment,
  getProcessCapabilities,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type Action2ReturnType,
  type DomainControllerInterface,
  type EntityInstance,
  type EntityInstanceCollection,
  type PersistenceStoreControllerManagerInterface,
  type ProcessCapabilities,
} from "@miroir-framework/core";
import { bootEnvironment } from "@miroir-framework/env";
import { fetchMiroirAndAppConfigurations } from "@miroir-framework/react";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { setupMiroirTest, type SetupMiroirTestOptions } from "miroir-react-testing/src/4-tests/setupMiroirTest.js";

import { loglevelnext } from "../../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../../src/startup.js";
import { openTestEnvironment } from "../../helpers/testEnvironment.js";

export const APP_FOR_TEST = "eef01001-0001-4000-8000-000000000001";
export const APP_FOR_TEST_DEPLOYMENT = "eef01001-0002-4000-8000-000000000002";
export const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
export const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
export const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
export const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
export const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
export const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
export const SELF_APPLICATION_VERSION_ENTITY = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";

export const applicationDeploymentMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [APP_FOR_TEST]: APP_FOR_TEST_DEPLOYMENT,
  [LIBRARY_APPLICATION]: LIBRARY_DEPLOYMENT,
};

export type VersioningTestContext = {
  domainController: DomainControllerInterface;
  serverDomainController: DomainControllerInterface;
  serverStores: PersistenceStoreControllerManagerInterface;
  baseCapabilities: ProcessCapabilities;
};

let started = false;

/** Startup of the test process: the registrations a server makes. */
export function startVersioningTestProcess(): void {
  if (started) {
    return;
  }
  started = true;
  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
    defaultLevel: "WARN",
    specificLoggerOptions: {},
  } as any);
}

/** How the test process gets the versioning package: setupMiroirTest's own import, a counted one, or none. */
export type VersioningTestOptions = Pick<SetupMiroirTestOptions, "versioningLoader">;

export async function openVersioningTestContext(options: VersioningTestOptions = {}): Promise<VersioningTestContext> {
  startVersioningTestProcess();
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const testEnvironment = openTestEnvironment("test-filesystem");
  const wired = await setupMiroirTest(
    testEnvironment.miroirConfig,
    miroirActivityTracker,
    miroirEventService,
    undefined,
    {},
    options,
  );
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  const loaded = await fetchMiroirAndAppConfigurations({
    domainController: wired.domainControllerForClient,
    miroirConfig: testEnvironment.miroirConfig,
  });
  expect(loaded?.status, "the configurations load").not.toBe("error");
  const baseCapabilities = getProcessCapabilities({
    config: {},
    environment: getClientEnvironment(),
    storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
    adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
  });
  return {
    domainController: wired.domainControllerForClient,
    serverDomainController: wired.domainControllerForServer!,
    serverStores: wired.persistenceStoreControllerManagerForServer!,
    baseCapabilities,
  };
}

/** Sets the capabilities of the client and of the server; each defaults to the base snapshot. */
export function setCapabilities(
  context: VersioningTestContext,
  changes: { client?: Partial<ProcessCapabilities>; server?: Partial<ProcessCapabilities> },
): void {
  context.domainController.setProcessCapabilities({ ...context.baseCapabilities, ...changes.client });
  context.serverDomainController.setProcessCapabilities({ ...context.baseCapabilities, ...changes.server });
}

export function appForTestModelEnvironment(domainController: DomainControllerInterface) {
  return domainController.currentModelEnvironment(APP_FOR_TEST, applicationDeploymentMap);
}

export function modelEnvironment(domainController: DomainControllerInterface, application: string) {
  return domainController.currentModelEnvironment(application, applicationDeploymentMap);
}

/** Sends a freeze of appForTest to `domainController` (the client unless said otherwise). */
export function freezeAppForTest(
  domainController: DomainControllerInterface,
  versionName: string,
): Promise<Action2ReturnType> {
  return domainController.handleAction(
    {
      actionType: "freezeApplicationVersion",
      endpoint: MODEL_ENDPOINT,
      payload: { application: APP_FOR_TEST, versionName },
    } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(domainController),
  );
}

/** The rows of an Entity in a section of appForTest, read from the server's store. */
export function storedAppForTestRows(
  context: VersioningTestContext,
  section: "model" | "data" | "modelVersion",
  parentUuid: string,
): Promise<EntityInstance[]> {
  return storedRows(context, APP_FOR_TEST_DEPLOYMENT, section, parentUuid);
}

/** The rows of an Entity in a section of a deployment, read from the server's store. */
export async function storedRows(
  context: VersioningTestContext,
  deployment: string,
  section: "model" | "data" | "modelVersion",
  parentUuid: string,
): Promise<EntityInstance[]> {
  const result = await context.serverStores.getPersistenceStoreController(deployment)!.getInstances(section, parentUuid);
  if (result instanceof Action2Error) {
    return [];
  }
  return ((result.returnedDomainElement as EntityInstanceCollection | undefined)?.instances ?? []) as EntityInstance[];
}

/** The names of appForTest's frozen versions, from the server's store. */
export async function storedVersionNames(context: VersioningTestContext): Promise<string[]> {
  const rows = await storedAppForTestRows(context, "modelVersion", SELF_APPLICATION_VERSION_ENTITY);
  return rows.map((row) => (row as EntityInstance & { name: string }).name).sort();
}

export function expectFeatureUnavailable(result: Action2ReturnType, capability: string): void {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
  expect((result as Action2Error).errorType, JSON.stringify(result)).toBe("FeatureUnavailable");
  expect((result as Action2Error).errorContext?.capability).toBe(capability);
}

export function expectOk(result: Action2ReturnType, label: string): void {
  expect(result instanceof Action2Error, `${label}: ${JSON.stringify(result)}`).toBe(false);
}
