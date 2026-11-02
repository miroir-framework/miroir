import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import loglevelNextLog from "loglevelnext";
import type { Express } from "express";

import {
  ConfigurationService,
  defaultExternalServiceClient,
  getClientEnvironment,
  getProcessCapabilities,
  type PersistenceStoreControllerManager,
  setProcessTokenSecret,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MiroirConfigServer,
  type ProcessCapabilities,
} from "@miroir-framework/core";
import { bootEnvironment, environmentServerConfig, openTestEnvironment, selectedTestEnvironment } from "@miroir-framework/env";
import { startMiroirNode } from "miroir-localcache-redux/node";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

// #636: a server-side domain controller on a test environment (test-filesystem unless MIROIR_ENV names
// another test-* environment), built the way miroir-server builds its own. Its stores are copies in
// .miroir/<environment>/, seeded again for each test file.

export const DEFAULT_SERVER_TEST_ENVIRONMENT = "test-filesystem";
export const TEST_TOKEN_SECRET = "server-library-test-token-secret-0123456789";

export const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
export const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
export const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";

const quietLoggers: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

export type ServerTestPlatform = {
  miroirConfig: MiroirConfigServer;
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
  applicationDeploymentMap: ApplicationDeploymentMap;
  capabilities: ProcessCapabilities;
};

export async function startServerTestPlatform(): Promise<ServerTestPlatform> {
  const environment = openTestEnvironment(selectedTestEnvironment(process.env) ?? DEFAULT_SERVER_TEST_ENVIRONMENT, {
    reseed: true,
  });
  const miroirConfig = environmentServerConfig(environment.resolved);

  // #639: the same startup call as miroir-server
  const { domainController, persistenceStoreControllerManager } = await startMiroirNode(miroirConfig, {
    stores: [miroirFileSystemStoreSectionStartup],
    loggers: { factory: loglevelNextLog as any as LoggerFactoryInterface, options: quietLoggers },
    externalServiceClient: defaultExternalServiceClient({ persistRotatedSecret: async () => {} }),
  });
  if (!persistenceStoreControllerManager) {
    throw new Error("startMiroirNode returned no store manager for a server configuration");
  }
  const { applicationDeploymentMap } = await bootEnvironment(domainController, environment.resolved, process.env);
  setProcessTokenSecret(TEST_TOKEN_SECRET);

  const capabilities = getProcessCapabilities({
    config: miroirConfig,
    environment: getClientEnvironment(),
    storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
    adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
  });
  domainController.setProcessCapabilities(capabilities);

  return { miroirConfig, domainController, persistenceStoreControllerManager, applicationDeploymentMap, capabilities };
}

export type Listening = { baseUrl: string; close(): Promise<void> };

/** Listens on a free loopback port. */
export async function listen(app: Express): Promise<Listening> {
  const server: Server = await new Promise((resolve) => {
    const started = app.listen(0, "127.0.0.1", () => resolve(started));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
