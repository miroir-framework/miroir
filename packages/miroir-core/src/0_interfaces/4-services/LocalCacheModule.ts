import type { DomainControllerInterface } from "../2_domain/DomainControllerInterface";
import type { MiroirContextInterface } from "../3_controllers/MiroirContextInterface";
import type { ExternalServiceClientInterface } from "./ExternalServiceClientInterface";
import type { RestClientInterface, RestPersistenceClientAndRestClientInterface } from "./PersistenceInterface";
import type { PersistenceStoreControllerManagerInterface } from "./PersistenceStoreControllerManagerInterface";

// ################################################################################################
// #656: the local cache is chosen at startup. Each local cache package exports, from its entry
// without React (`node`), a `localCacheModule` that `satisfies LocalCacheModule`: the startup code
// (core `5_setup`) builds domain controllers through it and never imports a local cache package.
// ################################################################################################

/** The local cache implementations a Miroir process can start on. */
export const localCacheKinds = ["redux", "zustand"] as const;
/**
 * The local cache a Miroir process starts on: the `localCache` option of the startup calls.
 * @public
 */
export type LocalCacheKind = (typeof localCacheKinds)[number];

/** How a domain controller reaches its persistence store: its own stores, or a server through REST. */
export type LocalCachePersistenceStoreAccessParams =
  | {
      persistenceStoreAccessMode: "local";
      localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
    }
  | {
      persistenceStoreAccessMode: "remote";
      localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
      remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface;
    };

/** What the startup code takes from a local cache package. */
export interface LocalCacheModule {
  /** The implementation, as `LocalCacheInfo.implementation` reports it. */
  readonly kind: LocalCacheKind;
  /** Builds a domain controller on a new local cache and persistence store of this implementation. */
  setupMiroirDomainController(
    miroirContext: MiroirContextInterface,
    persistenceParams: LocalCachePersistenceStoreAccessParams,
    externalServiceClient?: ExternalServiceClientInterface,
  ): DomainControllerInterface;
  /** The REST persistence client a `remote` domain controller sends its persistence actions through. */
  RestPersistenceClientAndRestClient: new (
    rootApiUrl: string,
    restClient: RestClientInterface,
  ) => RestPersistenceClientAndRestClientInterface;
}
