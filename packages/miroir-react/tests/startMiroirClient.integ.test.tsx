// @vitest-environment happy-dom
// #639: the startup call of a React client. vitest: React rendering and process wiring (stores,
// domain controllers, emulated server), not reachable through MiroirTest.
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import {
  ConfigurationService,
  defaultMiroirModelEnvironment,
  getClientEnvironment,
  getProcessCapabilities,
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  fetchProcessCapabilities,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type MiroirConfigClient,
  type ProcessCapabilities,
} from "miroir-core";
import { bootEnvironment, openTestEnvironment } from "miroir-env";
import { book1 } from "miroir-example-library";
import { startMiroirNode } from "miroir-localcache-redux/node";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import {
  LocalCacheProvider,
  MiroirContextReactProvider,
  startMiroirClient,
  useEntityInstanceUuidIndexFromLocalCache,
} from "../src/index.js";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const TEST_ENVIRONMENT = "test-filesystem";
const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

async function loadLibrary(domainController: DomainControllerInterface, applicationDeploymentMap: ApplicationDeploymentMap) {
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
}

/** Shows the title of every Library book in the local cache, the way a report reads instances. */
function BookTitles(props: { applicationDeploymentMap: ApplicationDeploymentMap }) {
  const books = useEntityInstanceUuidIndexFromLocalCache(
    {
      queryType: "localCacheEntityInstancesExtractor",
      definition: { application: LIBRARY_APPLICATION, applicationSection: "data", entityUuid: BOOK_ENTITY },
    },
    props.applicationDeploymentMap,
  );
  return (
    <ul id="books">
      {Object.values(books ?? {}).map((book: any) => (
        <li key={book.uuid}>{book.name}</li>
      ))}
    </ul>
  );
}

describe("startMiroirClient", () => {
  it("gives the React providers what they need to show Miroir data, with the emulated server configured first", async () => {
    const environment = openTestEnvironment(TEST_ENVIRONMENT, { reseed: true });
    const miroirConfig = environment.miroirConfig as MiroirConfigClient;
    const capabilitiesSeenByTheHook: ProcessCapabilities[] = [];

    const platform = await startMiroirClient(miroirConfig, {
      stores: [miroirFileSystemStoreSectionStartup],
      configureEmulatedServer: async (server) => {
        capabilitiesSeenByTheHook.push(await fetchProcessCapabilities(server.restClientStub));
      },
    });

    // the hook ran once, before the capabilities were set on the stub
    expect(capabilitiesSeenByTheHook).toEqual([FAIL_CLOSED_PROCESS_CAPABILITIES]);
    expect(platform.processCapabilities).not.toEqual(FAIL_CLOSED_PROCESS_CAPABILITIES);
    expect(platform.emulatedServer).toBeDefined();

    const { applicationDeploymentMap } = await bootEnvironment(platform.domainController, environment.resolved, process.env);
    await loadLibrary(platform.domainController, applicationDeploymentMap);
    expect(applicationDeploymentMap[LIBRARY_APPLICATION]).toBe(LIBRARY_DEPLOYMENT);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LocalCacheProvider store={platform.domainController.getLocalCache().getInnerStore()}>
          <MiroirContextReactProvider
            miroirContext={platform.miroirContext}
            domainController={platform.domainController}
            processCapabilities={platform.processCapabilities}
          >
            <BookTitles applicationDeploymentMap={applicationDeploymentMap} />
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
    });
    expect(container.querySelector("#books")?.textContent).toContain(book1.name);
    act(() => root.unmount());
    container.remove();
  });

  it("uses a client it is given instead of an emulated server (the Electron renderer's shape)", async () => {
    const environment = openTestEnvironment(TEST_ENVIRONMENT, { reseed: true });
    const miroirConfig = environment.miroirConfig as MiroirConfigClient;
    // the process that owns the stores, reached through its stub
    const owner = await startMiroirNode(miroirConfig, { stores: [miroirFileSystemStoreSectionStartup] });
    const { applicationDeploymentMap } = await bootEnvironment(owner.domainController, environment.resolved, process.env);
    owner.emulatedServer!.restClientStub.setProcessCapabilities(
    getProcessCapabilities({
      config: miroirConfig,
      environment: getClientEnvironment(),
      storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
      adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
    }),
  );

    const platform = await startMiroirClient(miroirConfig, { stores: [], restClient: owner.emulatedServer!.restClientStub });

    expect(platform.emulatedServer).toBeUndefined();
    expect(platform.restClient).toBe(owner.emulatedServer!.restClientStub);
    await loadLibrary(platform.domainController, applicationDeploymentMap);
    const domainState = platform.domainController.getLocalCache().getDomainState() as any;
    expect(domainState[LIBRARY_DEPLOYMENT]?.data?.[BOOK_ENTITY]?.[book1.uuid]?.name).toBe(book1.name);
  });
});
