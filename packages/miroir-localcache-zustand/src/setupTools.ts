/**
 * Setup tools for Zustand-based local cache.
 * Provides setupMiroirDomainController for initializing the domain controller.
 */
import {
  DomainController,
  DomainControllerInterface,
  MiroirContextInterface,
} from "miroir-core";
import { LocalCache } from "./4_services/LocalCache.js";
import {
  PersistenceAsyncStore,
  PersistenceStoreAccessParams,
} from "./4_services/persistence/PersistenceAsyncStore.js";

// ################################################################################################
/**
 * Sets up the Miroir Domain Controller with Zustand-based local cache.
 * 
 * @param miroirContext - The Miroir context interface
 * @param persistenceParams - Parameters for persistence store access
 * @returns Initialized DomainControllerInterface
 */
export function setupMiroirDomainController(
  miroirContext: MiroirContextInterface,
  persistenceParams: PersistenceStoreAccessParams,
): DomainControllerInterface {
  // Create the persistence store (replaces saga)
  const persistenceStore = new PersistenceAsyncStore(persistenceParams);
  
  // Create the local cache with Zustand
  const localCache = new LocalCache(persistenceStore);

  // Link local cache to persistence store
  persistenceStore.setLocalCache(localCache);
  
  // Wire up the persistence store controller manager
  if (persistenceParams.localPersistenceStoreControllerManager) {
    persistenceParams.localPersistenceStoreControllerManager.setLocalCache(localCache);
    persistenceParams.localPersistenceStoreControllerManager.setPersistenceStoreLocalOrRemote(persistenceStore);
  }

  // Create the domain controller
  const domainController = new DomainController(
    persistenceParams.persistenceStoreAccessMode,
    miroirContext,
    localCache, // implements LocalCacheInterface
    persistenceStore, // implements PersistenceStoreLocalOrRemoteInterface
    // {} as any// new Endpoint(localCache)
  );
  
  return domainController;
}

// Re-export types for compatibility
export type { PersistenceStoreAccessParams } from "./4_services/persistence/PersistenceAsyncStore.js";
