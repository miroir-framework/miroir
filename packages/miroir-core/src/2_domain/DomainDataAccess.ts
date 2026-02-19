import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  EntitiesDomainState,
  EntitiesDomainStateEntityInstanceArraySelector,
  EntitiesDomainStateInstanceSelector
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";


import { entityReport } from "miroir-test-app_deployment-miroir";
// const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json");
// const entityEntity = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
// const entityJzodSchema = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json');
// // const entityStoreBasedConfiguration = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json');
// const entitySelfApplicationVersion = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');
// const entityMenu = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json');

import {
  EntityInstance,
  JzodPlainAttribute,
  Report
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

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
export function selectEntityInstancesFromJzodAttribute(
  mlSchema: JzodPlainAttribute | undefined
): EntitiesDomainStateEntityInstanceArraySelector {
  return (domainState: EntitiesDomainState): EntityInstance[] => {
    // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    // if (mlSchema?.tag?.value?.targetEntity && domainState[mlSchema?.tag?.value.targetEntity]) {
    if (mlSchema?.tag?.value?.foreignKeyParams?.targetEntity && domainState[mlSchema?.tag?.value?.foreignKeyParams.targetEntity]) {
      // log.info('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[mlSchema?.tag?.value.foreignKeyParams.targetEntity]);
    } else {
      return [];
    }
  };
}

// ################################################################################################
export function selectEntityUuidFromJzodAttribute(mlSchema:JzodPlainAttribute | undefined):Uuid | undefined{
  // return mlSchema?.tag?.value?.targetEntity;
  return mlSchema?.tag?.value?.foreignKeyParams?.targetEntity;
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