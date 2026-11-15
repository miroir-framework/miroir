//#########################################################################################
/**
 * TODO: simila to 
 * miroir-core Model.ts getReportsAndEntitiesForDeploymentUuid, 
 * miroir-core DomainDataAccess.ts selectCurrentDeploymentModel
 * @param deploymentUuid 
 * @param state 
 * @returns 
 */

import {
  type ApplicationDeploymentMap,
  type MetaModel,
  type MiroirModelEnvironment,
  type Uuid,
  getApplicationSection,
  getMiroirFundamentalSchemaForDeployment,
  getReduxDeploymentsStateIndex,
  LoggerInterface,
  buildMetaModelCollections,
  MiroirLoggerFactory,
} from "@miroir-framework/core";
import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import type { LocalCacheSliceState } from "./localCacheReduxSliceInterface";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Model");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });

// #########################################################################################
/**
 * The model of an application as the local cache holds it: every {@link MetaModel} collection, read from
 * the section where its Entity's rows live (#708 D7-a, `metaModelCollections`).
 */
export function currentModel(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  state: LocalCacheSliceState
): MetaModel {
  const deploymentUuid = applicationDeploymentMap[application];
  if (!deploymentUuid) {
    throw new Error(
      "currentModel() called, could not find deploymentUuid for application " +
        application +
        " in applicationDeploymentMap: " +
        JSON.stringify(Object.keys(applicationDeploymentMap), null, 2)
    );
  }
  const collections = buildMetaModelCollections(({ entity }) => {
    const slice =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, getApplicationSection(application, entity.uuid), entity.uuid)
      ];
    return slice?.entities ? Object.values(slice.entities) : [];
  });
  const applications = collections.applications;
  const matchedApplication = applications.find((a) => a.uuid === application) ?? applications[0];
  return {
    applicationUuid: application,
    applicationName: matchedApplication?.name ?? "",
    ...collections,
  };
}

// #########################################################################################
export function currentModelEnvironment(
  application: Uuid,
  appliationDeploymentMap: ApplicationDeploymentMap,
  // deploymentUuid: string,
  state: LocalCacheSliceState
): MiroirModelEnvironment {
  if (process.env.MIROIR_UI_CONTEXT === "1") {
    log.warn(
      "[currentModelEnvironment] deprecated for UI schema access — use React context schemasPerDeployment instead.",
    );
  }
  const deploymentUuid = appliationDeploymentMap[application];
  const model = currentModel(application, appliationDeploymentMap, state);
  return {
    deploymentUuid: deploymentUuid,
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(deploymentUuid, model),
    miroirMetaModel: defaultMiroirMetaModel,
    currentModel: model,
    endpointsByUuid: model.endpoints.reduce((acc, endpoint) => {
      acc[endpoint.uuid] = endpoint;
      return acc;
    }, {} as { [uuid: string]: any }),
  };
}
