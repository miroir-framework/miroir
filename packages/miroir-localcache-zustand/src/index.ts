/**
 * miroir-localcache-zustand
 * 
 * Zustand-based implementation of LocalCache for Miroir Framework.
 * Provides drop-in replacement for miroir-localcache-redux.
 */

// Re-export React hooks for abstraction - allows miroir-standalone-app to not depend directly on react-redux
export {
  useSelector,
  LocalCacheProvider,
  Provider,
  useLocalCacheStore,
  TypedUseSelectorHook,
} from "./react/hooks.js";

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
  selectJzodSchemaSelectorParamsForTemplate,
  applyDomainStateJzodSchemaSelector,
  applyReduxDeploymentsStateJzodSchemaSelectorTemplate,
  applyReduxDeploymentsStateJzodSchemaSelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectDomainStateJzodSchemaSelectorParams,
  selectDomainStateSelectorParams,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectInstanceArrayForDeploymentSectionEntity,
  selectMiroirQueryTemplateSelectorParams,
} from "./4_services/localCache/LocalCacheSliceSelectors.js";

// Memoized selectors
export {
  getMemoizedReduxDeploymentsStateSelectorMap,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap,
} from "./4_services/localCache/DomainStateMemoizedSelectors.js";

export {
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap,
} from "./4_services/localCache/DomainStateMemoizedSelectorsForTemplate.js";

// Undo/Redo store
export {
  selectCurrentTransaction,
  getInitialState as reduxStoreWithUndoRedoGetInitialState,
  createLocalCacheStore,
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

// RestPersistenceClientAndRestClient - handles network persistence actions
export { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";

