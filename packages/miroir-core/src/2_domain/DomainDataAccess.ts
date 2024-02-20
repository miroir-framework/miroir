import { JzodAttribute } from "@miroir-framework/jzod-ts";

import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  DomainState,
  DomainStateMetaModelSelector,
  EntitiesDomainState,
  EntitiesDomainStateEntityInstanceArraySelector,
  EntitiesDomainStateInstanceSelector,
} from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState.js";

import { defaultMiroirMetaModel } from "../1_core/Model.js";

import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import entityReport from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

import { JzodSchemaDefinition } from "../0_interfaces/1_core/JzodSchemaDefinition.js";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary.js";
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityJzodSchema from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityStoreBasedConfiguration from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  ApplicationVersion,
  EntityDefinition,
  EntityInstance,
  JzodSchema,
  MetaModel,
  Report,
  StoreBasedConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainDataAccess");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

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
    if (deploymentUuid == applicationDeploymentLibrary.uuid) {
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
        jzodSchemas: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityJzodSchema.uuid]
          ? Object.values(domainState[deploymentUuid]["model"][entityJzodSchema.uuid]) as JzodSchema[]
          : []
        ),
        reports: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityReport.uuid]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityReport.uuid]) as Report[]
          : []
        ),
        configuration: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityStoreBasedConfiguration.uuid]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityStoreBasedConfiguration.uuid]) as StoreBasedConfiguration[]
          : []
        ),
        applicationVersions: (
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"] &&
          domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityApplicationVersion.uuid]
          // ? Object.values(domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityApplicationVersion.uuid]) as MiroirApplicationVersionOLD_DO_NOT_USE[]
          ? Object.values(domainState[deploymentUuid][deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model"][entityApplicationVersion.uuid]) as ApplicationVersion[]
          : []
        ),
        applicationVersionCrossEntityDefinition: [],
      })
    } else {
      return defaultMiroirMetaModel;
    }
  }
}

// ################################################################################################
export function selectEntityInstancesFromJzodAttribute(jzodSchema:JzodAttribute | undefined):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (jzodSchema?.extra?.targetEntity && domainState[jzodSchema?.extra?.targetEntity]) {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[jzodSchema?.extra?.targetEntity]);
    } else {
      return [];
    }
  }
}

// ################################################################################################
export function selectEntityUuidFromJzodAttribute(jzodSchema:JzodAttribute | undefined):Uuid | undefined{
  return jzodSchema?.extra?.targetEntity;
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