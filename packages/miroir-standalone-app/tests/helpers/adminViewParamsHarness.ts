/**
 * A local cache holding the Admin ViewParams instance, a Miroir context and a domain controller
 * that records the actions it receives, for tests of components that read and save ViewParams
 * (`useAdminViewParams`) under `LocalCacheProvider` and `MiroirContextReactProvider`.
 */
import {
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  type DomainControllerInterface,
  type LocalCacheInterface,
} from "miroir-core";
import { LocalCache, PersistenceReduxSaga } from "miroir-react";
import { adminSelfApplication, defaultAdminViewParams, entityViewParams } from "miroir-app-admin";

/** Puts the Admin ViewParams, with `viewParams` over the defaults, in the local cache, as a save landing. */
export function loadViewParams(localCache: LocalCacheInterface, viewParams: Record<string, unknown>): void {
  // no rollback: a rollback of the admin application drops the ViewParams instance just loaded
  const loadResult = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [
          {
            parentName: entityViewParams.name,
            parentUuid: entityViewParams.uuid,
            applicationSection: "data",
            instances: [{ ...defaultAdminViewParams, ...viewParams }],
          },
        ],
      },
    } as any,
    defaultSelfApplicationDeploymentMap,
  );
  if (loadResult.status !== "ok") {
    throw new Error(`harness: loading ViewParams failed: ${JSON.stringify(loadResult)}`);
  }
}

export interface AdminViewParamsHarness {
  miroirContext: MiroirContext;
  localCache: LocalCacheInterface;
  domainController: DomainControllerInterface;
  /** The actions given to `domainController.handleActionFromUI`, in order. */
  handledActions: any[];
}

export function buildAdminViewParamsHarness(viewParams: Record<string, unknown>): AdminViewParamsHarness {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, undefined as any);
  const persistenceSaga = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
    ),
    remotePersistenceStoreRestClient: undefined as any,
  });
  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);
  loadViewParams(localCache, viewParams);
  const handledActions: any[] = [];
  const domainController = {
    handleActionFromUI: async (action: any) => {
      handledActions.push(action);
      return { status: "ok" };
    },
  } as unknown as DomainControllerInterface;
  return { miroirContext, localCache, domainController, handledActions };
}
