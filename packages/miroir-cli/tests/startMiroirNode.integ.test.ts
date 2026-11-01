// #639: the startup call of a Node host, tested in the CLI, its first host. vitest: process wiring
// (stores, domain controllers, emulated server), not reachable through MiroirTest.
import {
  ConfigurationServiceInner,
  defaultExternalServiceClient,
  defaultMiroirModelEnvironment,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type MiroirConfigClient,
} from "miroir-core";
import { bootEnvironment, environmentServerConfig, openTestEnvironment } from "miroir-env";
import { startMiroirNode } from "miroir-localcache-redux/node";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { describe, expect, it } from "vitest";

import { loadStoreStartups } from "../src/startup/storeStartup.js";

const TEST_ENVIRONMENT = "test-filesystem";
const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const OPENAPI_DOCUMENT_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5"; // prepareOpenApiDocument

/** Loads the Library application into the domain controller's local cache, then returns its books. */
async function libraryBooks(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Record<string, unknown>> {
  const rollback = await domainController.handleAction(
    {
      actionType: "rollback",
      actionLabel: "Load Library into the local cache",
      endpoint: MODEL_ENDPOINT,
      payload: { application: LIBRARY_APPLICATION },
    },
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
  expect(rollback.status).toBe("ok");
  const domainState = domainController.getLocalCache().getDomainState() as any;
  return domainState[LIBRARY_DEPLOYMENT]?.data?.[BOOK_ENTITY] ?? {};
}

describe("startMiroirNode", () => {
  it("starts a client configuration with its emulated server, on the stores it is given", async () => {
    const environment = openTestEnvironment(TEST_ENVIRONMENT, { reseed: true });
    const miroirConfig = environment.miroirConfig as MiroirConfigClient;
    expect(miroirConfig.client.emulateServer).toBe(true);

    const platform = await startMiroirNode(miroirConfig, { stores: [miroirFileSystemStoreSectionStartup] });
    const reconciliation = await bootEnvironment(platform.domainController, environment.resolved, process.env);

    // the client domain controller is remote: its books come through the stub, from the emulated server's stores
    expect(Object.keys(await libraryBooks(platform.domainController, reconciliation.applicationDeploymentMap)).length).toBeGreaterThan(0);
    expect(platform.emulatedServer?.restClientStub).toBeDefined();
    expect(platform.restClient).toBe(platform.emulatedServer?.restClientStub);
    expect(platform.persistenceStoreControllerManager).toBeUndefined();
    // the emulated server's own controller is local, on the same stores
    expect(
      Object.keys(await libraryBooks(platform.emulatedServer!.domainController, reconciliation.applicationDeploymentMap)).length,
    ).toBeGreaterThan(0);
  });

  it("loads the store startups a client configuration needs", async () => {
    const { miroirConfig } = openTestEnvironment(TEST_ENVIRONMENT);
    const startups = await loadStoreStartups(miroirConfig as MiroirConfigClient);
    expect(startups).toEqual([miroirFileSystemStoreSectionStartup]);

    // a scratch service: the process-wide one is never cleared, so it already holds every factory
    const scratch = new ConfigurationServiceInner();
    startups.forEach((startup) => startup(scratch));
    expect(scratch.StoreSectionFactoryRegister.has(JSON.stringify({ storageType: "filesystem", section: "model" }))).toBe(true);
  });

  it("starts a server configuration with a local domain controller and its store manager", async () => {
    const environment = openTestEnvironment(TEST_ENVIRONMENT, { reseed: true });
    const serverConfig = environmentServerConfig(environment.resolved);

    const fetched: string[] = [];
    const platform = await startMiroirNode(serverConfig, {
      stores: [miroirFileSystemStoreSectionStartup],
      // the domain controller calls out through the client it is given (server.ts passes its rotated-secrets client this way)
      externalServiceClient: defaultExternalServiceClient({
        fetch: async (input) => {
          fetched.push(String(input));
          return new Response('{"openapi":"3.0.0","info":{"title":"t","version":"1"},"paths":{}}', { status: 200 });
        },
      }),
    });
    const reconciliation = await bootEnvironment(platform.domainController, environment.resolved, process.env);

    expect(Object.keys(await libraryBooks(platform.domainController, reconciliation.applicationDeploymentMap)).length).toBeGreaterThan(0);
    // the manager is the one the domain controller opened the deployments on
    expect(platform.persistenceStoreControllerManager?.getPersistenceStoreController(LIBRARY_DEPLOYMENT)).toBeDefined();
    expect(platform.emulatedServer).toBeUndefined();
    expect(platform.restClient).toBeUndefined();

    await platform.domainController.handleAction(
      {
        actionType: "prepareOpenApiDocument",
        endpoint: OPENAPI_DOCUMENT_ENDPOINT,
        payload: { url: "https://openapi.example.test/document.json" },
      } as any,
      reconciliation.applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(fetched).toEqual(["https://openapi.example.test/document.json"]);
  });
});
