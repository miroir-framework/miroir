// Entry without React (#337): Node processes (server, CLI, MCP, the Electron main process) import
// "miroir-localcache-redux/node", so their bundles do not pull react-redux and react-dom.

import {
  startMiroirNodeWith,
  startMiroirPlatformWith,
  type LocalCacheModule,
  type MiroirConfigClient,
  type MiroirConfigServer,
  type MiroirNodeOptions,
  type MiroirPlatform,
  type MiroirPlatformOptions,
} from "@miroir-framework/core";
import { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";
import { setupMiroirDomainController } from "./sagaTools.js";

/** #656: what the startup code takes from this local cache; the build checks the contract. */
export const localCacheModule = {
  kind: "redux",
  setupMiroirDomainController,
  RestPersistenceClientAndRestClient,
} as const satisfies LocalCacheModule;

export { LocalCache } from "./4_services/LocalCache.js";
export {
  getLocalCacheKeysDeploymentSectionEntitiesList,
  getDeploymentUuidListFromLocalCacheKeys,
  getLocalCacheKeysDeploymentSectionList,
  getLocalCacheKeysForDeploymentSection,
  getLocalCacheKeysForDeploymentUuid,
  getPersistenceActionReduxEventNames,
  localCacheStateToDomainState,
  setLocalCacheSegmentFreshness,
  LocalCacheSlice,
} from "./4_services/localCache/LocalCacheSlice.js";
export {
  selectModelForDeploymentFromReduxState,
} from "./4_services/localCache/LocalCacheSliceModelSelector.js";
export {
  applyReduxDeploymentsStateQuerySelector,
  selectReduxDeploymentsStateSelectorParams,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentReduxDeploymentsStateFromReduxState,
  // useReduxState,
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
export {
  createUndoRedoReducer,
  reduxStoreWithUndoRedoGetInitialState,
  selectCurrentTransaction,
} from "./4_services/localCache/UndoRedoReducer.js";
export {
  InnerReducerInterface,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  ReduxStoreWithUndoRedo,
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
} from "./4_services/localCache/localCacheReduxSliceInterface.js";
export {
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  // getMemoizedReduxDeploymentsStateMlSchemaSelectorTemplateMap,
} from "./4_services/localCache/DomainStateMemoizedSelectorsForTemplate.js";
export {
  // getMemoizedReduxDeploymentsStateMlSchemaSelectorMapDEFUNCT,
  getMemoizedReduxDeploymentsStateSelectorMap
} from "./4_services/localCache/DomainStateMemoizedSelectors.js";
export {
  PersistenceReduxSaga,
  PersistenceSagaGenReturnType,
  PersistenceStoreAccessParams,
} from "./4_services/persistence/PersistenceReduxSaga.js";
export { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";
export { setupMiroirDomainController } from "./sagaTools.js";
export type {
  MiroirEmulatedServer,
  MiroirNodeOptions,
  MiroirPlatform,
  MiroirPlatformOptions,
} from "@miroir-framework/core";

/** The startup of a process on this local cache (#639); the wiring lives in core (#656). */
export function startMiroirPlatform(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirPlatformOptions,
): Promise<MiroirPlatform> {
  return startMiroirPlatformWith(localCacheModule, miroirConfig, options);
}

/** The startup of a Node process on this local cache (#639); the wiring lives in core (#656). */
export function startMiroirNode(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirNodeOptions,
): Promise<MiroirPlatform> {
  return startMiroirNodeWith(localCacheModule, miroirConfig, options);
}
