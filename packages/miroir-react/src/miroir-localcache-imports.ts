/**
 * miroir-localcache-imports.ts
 *
 * #656: what the UI takes from the local cache, whatever the implementation the process started on.
 * - `LocalCacheProvider` and `useSelector` go through the binding of that implementation (`localCacheBinding.ts`).
 * - The selectors are one static set (D8): pure functions of the state, which both implementations share
 *   (`StateWithUndoRedo`). They come from the redux package's selector modules, which import no store, saga
 *   or slice.
 * The implementation classes are in `./local-cache/redux` and `./local-cache/zustand` (D9).
 */

export { LocalCacheProvider, useSelector, shallowEqual } from "./localCacheBinding.js";

export {
  // Types
  type ReduxStateWithUndoRedo,
  type ReduxStateChanges,
  type LocalCacheSliceState,
  type LocalCacheSliceStateZone,

  // Selectors - Basic
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectCurrentTransaction,
  selectInstanceArrayForDeploymentSectionEntity,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectModelForDeploymentFromReduxState,

  // Selectors - Query/Template apply functions
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,

  // Memoized selector factories
  getMemoizedReduxDeploymentsStateSelectorMap,
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
} from "miroir-localcache-redux/selectors";
