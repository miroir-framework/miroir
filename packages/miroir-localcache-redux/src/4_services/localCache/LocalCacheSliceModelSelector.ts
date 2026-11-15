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
} from "@miroir-framework/core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  selectApplicationDeploymentMap,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
function selectEntityInstancesFromReduxDeploymentsState(
  reduxState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  application: Uuid,
  applicationSection:ApplicationSection | undefined,
  entityUuid: Uuid | undefined
) {
  const result = selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState(
    reduxState,
    applicationDeploymentMap,
    {
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        application,
        applicationSection,
        entityUuid,
      },
    }
  );
  return result;
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
