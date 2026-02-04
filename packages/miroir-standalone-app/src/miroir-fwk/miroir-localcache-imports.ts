/**
 * miroir-localcache-imports.ts
 * 
 * Centralized imports from miroir-localcache-redux (or miroir-localcache-zustand).
 * To switch implementations, comment/uncomment the import source below.
 * 
 * All files in miroir-standalone-app should import from this file instead of
 * directly from miroir-localcache-redux or miroir-localcache-zustand.
 */

// ============================================================================
// SWITCH IMPLEMENTATION: Comment/uncomment one of the following blocks
// ============================================================================

// --- Redux Implementation (default) ---
export {
  // React hooks and Provider
  LocalCacheProvider,
  useSelector,
  
  // LocalCache
  LocalCache,
  
  // Persistence
  PersistenceReduxSaga,
  RestPersistenceClientAndRestClient,
  
  // Setup
  setupMiroirDomainController,
  
  // Types
  type ReduxStateWithUndoRedo,
  type ReduxStoreWithUndoRedo,
  type ReduxStateChanges,
  type LocalCacheSliceState,
  type LocalCacheSliceStateZone,
  
  // Initial state
  reduxStoreWithUndoRedoGetInitialState,
  
  // Selectors - Basic
  selectCurrentTransaction,
  selectInstanceArrayForDeploymentSectionEntity,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectModelForDeploymentFromReduxState,
  
  // Selectors - Query/Template apply functions
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateJzodSchemaSelector,
  applyReduxDeploymentsStateJzodSchemaSelectorTemplate,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  
  // Memoized selector factories
  getMemoizedReduxDeploymentsStateSelectorMap,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap,
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap,
} from "miroir-localcache-redux";

// // --- Zustand Implementation (alternative) ---
// export {
//   // React hooks and Provider
//   LocalCacheProvider,
//   useSelector,
  
//   // LocalCache
//   LocalCache,
  
//   // Persistence (PersistenceReduxSaga is aliased to PersistenceAsyncStore in zustand)
//   PersistenceReduxSaga,
//   RestPersistenceClientAndRestClient,
  
//   // Setup
//   setupMiroirDomainController,
  
//   // Types (aliased to match Redux naming)
//   type ReduxStateWithUndoRedo,
//   type ReduxStoreWithUndoRedo,
//   type ReduxStateChanges,
//   type LocalCacheSliceState,
//   type LocalCacheSliceStateZone,
  
//   // Initial state
//   reduxStoreWithUndoRedoGetInitialState,
  
//   // Selectors - Basic
//   selectCurrentTransaction,
//   selectInstanceArrayForDeploymentSectionEntity,
//   selectEntityInstanceUuidIndexFromLocalCache,
//   selectModelForDeploymentFromReduxState,
  
//   // Selectors - Query/Template apply functions
//   applyDomainStateJzodSchemaSelector,
//   applyDomainStateQuerySelectorForCleanedResult,
//   applyDomainStateQueryTemplateSelector,
//   applyReduxDeploymentsStateJzodSchemaSelector,
//   applyReduxDeploymentsStateJzodSchemaSelectorTemplate,
//   applyReduxDeploymentsStateQuerySelector,
//   applyReduxDeploymentsStateQuerySelectorForCleanedResult,
//   applyReduxDeploymentsStateQueryTemplateSelector,
//   applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  
//   // Memoized selector factories
//   getMemoizedReduxDeploymentsStateSelectorMap,
//   getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap,
//   getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
//   getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap,
// } from "miroir-localcache-zustand";
