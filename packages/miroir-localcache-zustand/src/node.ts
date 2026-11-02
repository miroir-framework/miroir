// Entry without React (#656): Node processes import "miroir-localcache-zustand/node", so their
// bundles do not pull react or the zustand React bindings.

import type { LocalCacheModule } from "@miroir-framework/core";
import { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";
import { setupMiroirDomainController } from "./setupTools.js";

/** #656: what the startup code takes from this local cache; the build checks the contract. */
export const localCacheModule = {
  kind: "zustand",
  setupMiroirDomainController,
  RestPersistenceClientAndRestClient,
} as const satisfies LocalCacheModule;

// Core LocalCache
export { LocalCache } from "./4_services/LocalCache.js";

// LocalCache Slice utilities
export {
  getLocalCacheKeysDeploymentSectionEntitiesList,
  getDeploymentUuidListFromLocalCacheKeys,
  getLocalCacheKeysDeploymentSectionList,
  getLocalCacheKeysForDeploymentSection,
  getLocalCacheKeysForDeploymentUuid,
  localCacheStateToDomainState,
  setLocalCacheSegmentFreshness,
} from "./4_services/localCache/LocalCacheSlice.js";

// Model selectors
export {
  // selectApplicationDeploymentMapFromReduxDeploymentsState,
  selectModelForDeploymentFromReduxState,
} from "./4_services/localCache/LocalCacheSliceModelSelector.js";

// Selectors
export {
  applyReduxDeploymentsStateQuerySelector,
  selectReduxDeploymentsStateSelectorParams,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectReduxDeploymentsStateSelectorForQueryTemplateParams,
  selectDomainStateFromReduxState,
  selectMiroirSelectorQueryParams,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectDomainStateSelectorParams,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectInstanceArrayForDeploymentSectionEntity,
  selectMiroirQueryTemplateSelectorParams,
} from "./4_services/localCache/LocalCacheSliceSelectors.js";

// Memoized selectors
export {
  getMemoizedReduxDeploymentsStateSelectorMap,
  // getMemoizedReduxDeploymentsStateMlSchemaSelectorMapDEFUNCT,
} from "./4_services/localCache/DomainStateMemoizedSelectors.js";

export {
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  // getMemoizedReduxDeploymentsStateMlSchemaSelectorTemplateMap,
} from "./4_services/localCache/DomainStateMemoizedSelectorsForTemplate.js";

// Undo/Redo store
export {
  selectCurrentTransaction,
  getInitialState as reduxStoreWithUndoRedoGetInitialState,
  createLocalCacheStore,
  type LocalCacheStore,
} from "./4_services/localCache/UndoRedoStore.js";

// Type exports - compatible with Redux version (re-exported from miroir-core via localCacheZustandInterface)
export {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  QueriesResultsCache,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  ReduxStoreWithUndoRedo,
  StateChanges,
  ZustandStateWithUndoRedo,
  ZustandStoreWithUndoRedo,
} from "./4_services/localCache/localCacheZustandInterface.js";

// Persistence
export {
  PersistenceAsyncStore,
  PersistenceAsyncStore as PersistenceReduxSaga, // Compatibility alias
  PersistenceStoreAccessParams,
} from "./4_services/persistence/PersistenceAsyncStore.js";

// Setup helper
export { setupMiroirDomainController } from "./setupTools.js";

export { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";

