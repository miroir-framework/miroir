import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  EntityInstancesUuidIndex,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  ReduxDeploymentsState,
  Uuid,
  getApplicationSection,
  buildMetaModelCollections,
  metaModelCollections,
  type ApplicationDeploymentMap,
  getReduxDeploymentsStateIndex,
} from "@miroir-framework/core";
import {
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ZustandStateWithUndoRedo } from "./localCacheZustandInterface.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "4_services";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// Alias for compatibility
type ReduxStateWithUndoRedo = ZustandStateWithUndoRedo;

const emptyIndex: EntityInstancesUuidIndex = {};

// ################################################################################################
const selectApplicationDeploymentMap = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): ApplicationDeploymentMap => {
  return applicationDeploymentMap;
};

// // ################################################################################################
// export function selectApplicationDeploymentMapFromReduxDeploymentsState(
//   reduxState: ReduxDeploymentsState,
//   applicationDeploymentMap: ApplicationDeploymentMap,
// ): ApplicationDeploymentMap | undefined {
//   const deploymentUuid = applicationDeploymentMap[adminSelfApplication.uuid];
//   if (!deploymentUuid) {
//     return undefined;
//   }
//   const localEntityIndex = getReduxDeploymentsStateIndex(
//     deploymentUuid,
//     "data",
//     entityDeployment.uuid
//   );
//   const entityState = reduxState[localEntityIndex];
//   return entityState?.entities
//     ? (Object.fromEntries(
//         Object.entries(entityState.entities as Record<string, Deployment>).map(
//           (e: [string, Deployment]) => [e[1].selfApplication, e[1].uuid],
//         ),
//       ) as any)
//     : (emptyIndex as any);
// }

// ################################################################################################
function selectEntityInstancesFromReduxDeploymentsState(
  reduxState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  application: Uuid,
  applicationSection: ApplicationSection | undefined,
  entityUuid: Uuid | undefined
): EntityInstancesUuidIndex | undefined {
  if (!entityUuid) {
    return undefined;
  }
  const deploymentUuid = applicationDeploymentMap[application];
  if (!deploymentUuid) {
    return undefined;
  }
  const localEntityIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    applicationSection ?? "data",
    entityUuid
  );
  const entityState = reduxState[localEntityIndex];
  return entityState?.entities ?? emptyIndex;
}

// ################################################################################################
function applicationOfParams(params: MiroirQueryTemplate): Uuid {
  return params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.application : params.application;
}

/**
 * #708 D7-a: one memoized selector per {@link MetaModel} collection (`metaModelCollections`), reading the rows of
 * the collection's Entity from the section where they live.
 */
const metaModelCollectionSelectors = metaModelCollections.map(({ entity }) =>
  createSelector(
    [selectCurrentReduxDeploymentsStateFromReduxState, selectApplicationDeploymentMap, selectMiroirSelectorQueryParams],
    (reduxState: ReduxDeploymentsState, applicationDeploymentMap: ApplicationDeploymentMap, params: MiroirQueryTemplate) => {
      const application = applicationOfParams(params);
      return selectEntityInstancesFromReduxDeploymentsState(
        reduxState,
        applicationDeploymentMap,
        application,
        getApplicationSection(application, entity.uuid),
        entity.uuid,
      );
    },
  ),
);

//#########################################################################################
export const selectModelForDeploymentFromReduxState: () => (
  state: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: MiroirQueryTemplate
) => MetaModel = () =>
  createSelector(metaModelCollectionSelectors, (...indexes: (EntityInstancesUuidIndex | undefined)[]): MetaModel => {
    const collections = buildMetaModelCollections((_entry, index) => Object.values(indexes[index] ?? {}));
    const application = collections.applications[0];
    return {
      applicationUuid: application?.uuid ?? "",
      applicationName: application?.name ?? "",
      ...collections,
    };
  });
