import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  DomainState,
  DomainStateMetaModelSelector,
  EntitiesDomainState,
  EntitiesDomainStateEntityInstanceArraySelector,
  EntitiesDomainStateInstanceSelector,
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";

import { defaultMiroirMetaModel } from "../1_core/Model";

const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");
const entityReport = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json");
const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json");
const entityEntity = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
const entityJzodSchema = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json');
const entityStoreBasedConfiguration = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json');
const entitySelfApplicationVersion = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');
const entityMenu = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json');

import {
  ApplicationVersion,
  EntityDefinition,
  EntityInstance,
  JzodPlainAttribute,
  // JzodAttribute,
  MlSchema,
  Menu,
  MetaModel,
  Report,
  type EndpointDefinition,
  type Query
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

import { entityEndpointVersion, entityQueryVersion } from "..";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainDataAccess")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export function selectEntityInstances(parentUuid:string | undefined):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (parentUuid && domainState[parentUuid]) {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[parentUuid]);
    } else {
      return [];
    }
  }
}

// ################################################################################################
export function selectCurrentDeploymentModel(
  deploymentUuid:string | undefined
):DomainStateMetaModelSelector {
  return (domainState:DomainState):MetaModel => {
    log.info('selectCurrentDeploymentModel for deploymentUuid', deploymentUuid, 'existing entities:', Object.keys(domainState))
    if (!deploymentUuid) {
      throw new Error("selectCurrentDeploymentModel for deploymentUuid undefined");
      
    }
    if (deploymentUuid == adminConfigurationDeploymentMiroir.uuid) {
      return defaultMiroirMetaModel;
    } else {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return ({
        entities: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityEntity.uuid]
          ? Object.values(domainState[deploymentUuid]["model"][entityEntity.uuid]) as MetaEntity[]
          : []
        ),
        entityDefinitions: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityEntityDefinition.uuid]
          ? Object.values(domainState[deploymentUuid]["model"][entityEntityDefinition.uuid]) as EntityDefinition[]
          : []
        ),
        endpoints: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityEndpointVersion.uuid]
          ? Object.values(domainState[deploymentUuid]["model"][entityEndpointVersion.uuid]) as EndpointDefinition[]
          : []
        ),
        jzodSchemas: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityJzodSchema.uuid]
          ? Object.values(domainState[deploymentUuid]["model"][entityJzodSchema.uuid]) as MlSchema[]
          : []
        ),
        reports: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityReport.uuid]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityReport.uuid]) as Report[]
          : []
        ),
        storedQueries: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityQueryVersion.uuid]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityQueryVersion.uuid]) as Query[]
          : []
        ),
        // configuration: (
        //   domainState[deploymentUuid] &&
        //   domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"] &&
        //   domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityStoreBasedConfiguration.uuid]
        //   ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityStoreBasedConfiguration.uuid]) as StoreBasedConfiguration[]
        //   : []
        // ),
        applicationVersions: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entitySelfApplicationVersion.uuid]
          // ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entitySelfApplicationVersion.uuid]) as MiroirApplicationVersionOLD_DO_NOT_USE[]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entitySelfApplicationVersion.uuid]) as ApplicationVersion[]
          : []
        ),
        menus: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityMenu.uuid]
          // ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entitySelfApplicationVersion.uuid]) as MiroirApplicationVersionOLD_DO_NOT_USE[]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model"][entityMenu.uuid]) as Menu[]
          : []
        ),
        applicationVersionCrossEntityDefinition: [],
      })
    }
  }
}

// ################################################################################################
export function selectEntityInstancesFromJzodAttribute(
  mlSchema: JzodPlainAttribute | undefined
): EntitiesDomainStateEntityInstanceArraySelector {
  return (domainState: EntitiesDomainState): EntityInstance[] => {
    // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    // if (mlSchema?.tag?.value?.targetEntity && domainState[mlSchema?.tag?.value.targetEntity]) {
    if (mlSchema?.tag?.value?.selectorParams?.targetEntity && domainState[mlSchema?.tag?.value?.selectorParams.targetEntity]) {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[mlSchema?.tag?.value.selectorParams.targetEntity]);
    } else {
      return [];
    }
  };
}

// ################################################################################################
export function selectEntityUuidFromJzodAttribute(mlSchema:JzodPlainAttribute | undefined):Uuid | undefined{
  // return mlSchema?.tag?.value?.targetEntity;
  return mlSchema?.tag?.value?.selectorParams?.targetEntity;
}

// ################################################################################################
export function selectReportDefinitionFromReportUuid(
  reportUuid: string | undefined
):EntitiesDomainStateInstanceSelector{
  return (domainState:EntitiesDomainState):Report | undefined => {
    // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (reportUuid && domainState[entityReport.uuid] && domainState[entityReport.uuid][reportUuid]) {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return domainState[entityReport.uuid][reportUuid] as Report;
    } else {
      return undefined;
    }
  }
}

// // ################################################################################################
// export function selectEntityInstancesForReportSection(
//   reportUuid: string | undefined,
//   reportSectionIndex: number,
// ):EntitiesDomainStateEntityInstanceArraySelector{
//   return (domainState:EntitiesDomainState):EntityInstance[] => {
//     log.info('selectEntityInstancesForReportSection for reportUuid', reportUuid, 'reportSectionIndex:', reportSectionIndex,'domainState',domainState)
//     const reportDefinition:Report | undefined = selectReportDefinitionFromReportUuid(reportUuid)(domainState) as Report | undefined;
//     const currentReportSectionIndex = reportSectionIndex;
//     if (
//       reportDefinition &&
//       reportDefinition.definition?.section?.type === "list" &&
//       reportDefinition.definition.section?.definition.length > reportSectionIndex &&
//       reportDefinition.definition.section?.definition[currentReportSectionIndex].type === "objectListReportSection" &&
//       domainState[(reportDefinition.definition?.section?.definition[currentReportSectionIndex] as ObjectListReportSection)?.definition?.parentUuid??""]
//     ) {
//       log.info('selectEntityInstancesForReportSection for entityUuid', reportUuid, 'reportSectionIndex', reportSectionIndex)
//       return DomainInstanceUuidIndexToArray(
//         domainState[
//           (reportDefinition.definition?.section?.definition[currentReportSectionIndex] as ObjectListReportSection)
//             ?.definition?.parentUuid ?? ""
//         ]
//       );
//     } else {
//       return [];
//     }
//   }
// }