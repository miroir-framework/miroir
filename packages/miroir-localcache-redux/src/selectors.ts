// #656 (D8): the selectors, without the store, the saga or the slice: what the UI imports statically, whichever local
// cache the process started on (both keep the same `StateWithUndoRedo`). A separate entry, so that a bundler sees them
// apart from the rest of the local cache.

export { selectModelForDeploymentFromReduxState } from "./4_services/localCache/LocalCacheSliceModelSelector.js";
export {
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
} from "./4_services/localCache/LocalCacheSliceSelectors.js";
export { selectCurrentTransaction } from "./4_services/localCache/UndoRedoReducer.js";
export { getMemoizedReduxDeploymentsStateSelectorMap } from "./4_services/localCache/DomainStateMemoizedSelectors.js";
export { getMemoizedReduxDeploymentsStateSelectorForTemplateMap } from "./4_services/localCache/DomainStateMemoizedSelectorsForTemplate.js";
export type {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
} from "./4_services/localCache/localCacheReduxSliceInterface.js";
